---
layout: post
title: "Using Panther to monitor AWS infrastructure"
tags:
- monitoring
team: Security Engineering
author: paha
---

Before widespread cloud usage, it was uncommon for one person to be present for the entire datacenter development lifecycle. Very few people knew how to design and build a datacenter from scratch while ensuring appropriate security configuration settings were set, on top of rigging up monitoring. It was even more uncommon for non-sysadmins to have any involvement in data center infrastructure construction or ongoing refinement. The cloud is very different. It only takes seconds to create an entire infrastructure from a template. And even developers are doing it!

The monitoring challenges for such a scenario are significant. There aren't necessarily "more" monitoring data points, but the speed with which infrastructure can be created tends to result in infrastructure getting way out over its skis with respect to monitoring. Furthermore, since many barriers to entry for doing stupid things have been lowered to the point of non-existence, monitoring is the last great hope of maintaining control over a cloud environment. While access controls can still provide some guardrails, the flexibility that all engineers need to do their jobs requires that they have the ability to do "dangerous" things that they've never had to do before. The true definition of "full stack" has expanded.

# We're moving!

Scribd is in the midst of migrating our entire infrastructure from a legacy data center to AWS. Things are moving fast. We've given developer teams nearly complete access to their own AWS accounts. We've labeled these accounts "development environments" and haven't created any cross-connections between them and production system accounts, but developers still have a lot of power, much more than they had in the legacy environment.

The AWS cloud has a few important saving graces to manage the new chaos, for which there isn't really an analogue in traditional data centers: universal event logging in a standard format for all resources, and highly granular permissions settings in a consistent format. Universal event logging in legacy centers was usually an asymptote that mortal sysadmins and security engineers could never actually reach. This was due to the inability to get complete data off of a device, inability to properly parse the data that could be exported, or a combination of both. [AWS CloudTrail](https://docs.aws.amazon.com/cloudtrail/) solves both problems.

It was also very difficult to precisely define user permissions for infrastructure work in legacy environments. At Scribd, this resulted in a small cadre of sysadmins having root access to everything and no one else having access to anything. With [AWS IAM](https://docs.aws.amazon.com/iam/), the [Instance Metadata Service (IMDS)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html), or some combination of the two, access permissions can be easily set in a consistent format for any type of infrastructure resource.

# A new solution to an old problem

Unfortunately, native AWS services can't fully take advantage of the power that its event logging and permissions settings provide. Scribd needed a monitoring solution that could keep up with our expanding infra, alerting us when certain events occurred or when permissions were set inappropriately.

We recently deployed the [Panther](https://www.runpanther.io) monitoring system in several AWS accounts. Right out of the box, it enables us to see certain near-real-time changes in these accounts, such as changes in security groups, using [AWS EventBridge](https://docs.aws.amazon.com/eventbridge/) as a base. It also performs a daily configuration check for a defined set of configuration options, such as S3 buckets' public writeability and the existence of MFA on root IAM user accounts. We currently have alerts for events and policy failures sent to a dedicated Slack channel. There is also a historical CloudTrail search functionality that makes hunting for events easy. The newest feature allows pivoting across multiple log sources. In other words, "correlations". That's what a [SIEM](https://en.wikipedia.org/wiki/Security_information_and_event_management) is built for.

The other major power of Panther is extensibility. We can write custom "rules" (for events) and "policies" (for configurations) in Python.
 This policy checks for resources in monitored accounts that exist outside designed AWS regions:

```python
APPROVED_REGIONS = {
	"us-east-1",
	"us-east-2",
}

def policy(resource):
    if resource['ResourceType'] == 'AWS.EC2.NetworkACL' and resource.get("IsDefault"):
        return True
    if resource['ResourceType'] == 'AWS.EC2.VPC' and resource.get("IsDefault"):
        return True
    if resource['ResourceType'] == 'AWS.EC2.SecurityGroup' and resource.get("Name")=='default':
        return True
    return resource['Region'] in APPROVED_REGIONS
```

We can create highly granular alerts on similarly granular IAM permissions. Anyone who can read basic Python and understands AWS terminology can make new rules and policies. The sky's the limit on custom logic. The rules and policies aren't just static checkboxes, either. We can store all of them in our version repository, as Panther has the "[panther-analysis-tool](https://docs.runpanther.io/scanning/policies#writing-policies-with-the-panther-analysis-tool)" to allow batch upload to the system.

The infrastructure is entirely inside our accounts, and is built almost entirely from CloudFormation templates and lambdas created by Panther. Since we use Terraform exclusively at Scribd for our own infrastructure, we translated some minimal IAM-related templates in Terraform (one of which we've contributed to Panther's [open source repo](https://github.com/panther-labs/panther/blob/master/deployments/auxiliary/terraform/panther_cloudsec_iam/main.tf)). We felt that the translations were a good idea because they involve setting custom IAM role names to enable certain cross-account access. They also won't need to be modified during a Panther upgrade.

The infra is also entirely serverless. The main expense is the storage space for processed CloudTrail logs, which we can control quite precisely.

Deploying (or upgrading) Panther is just a matter of forking the [open-source repo](https://github.com/panther-labs/panther) on Github and running a deployment script in a Docker container, either from a personal laptop or on an EC2 instance in AWS.

We haven't made many changes to the custom rules and policies yet, but even the pre-baked ones are useful. Example event alerts we've received already include "EC2 Network Gateway Modified" (something quite important for checking continuity to the internet), "EC2 Route Table Modified" (ditto), and "EC2 Security Group Modified". It's worth reiterating that these alerts come in within 30 seconds of the action taking place. Policy alerts like "AWS VPC Default Security Group Restricts All Traffic" have already shown up, too. (All of these alerts were triggered as I was making a Terraform module to manage default VPC resources.)

# Future plans

More pre-built custom device log format parsing rules are on the horizon. Other SIEM solutions have attempted to do this (even Datadog is trying it now!), but it's often proved difficult for vendors to keep their parsing rules current. At a previous position, I remember realizing that A Large SIEM Vendor was years behind on parsing the native log format of A Large Firewall Company, and that many very important new fields were being dropped before making it to the store of processed data. It seems Panther wants to solve this by making all of the parsing code open-source, as well. Hopefully this motivates device vendors to keep their own Panther parsers up to date.

Panther Labs is also planning to provide granularity to alert channels. Alerts will be assigned to, e.g., specific Slack channels for specific teams. This will allow teams to keep an eye on their own infrastructure in ways they haven't been able to do before at Scribd. Broad visibility of the entire ecosystem will allow more efficient incident response by quickly routing the right information to the right people.

Overall, Panther has proved incredibly easy for a small security team to roll out to a multi-account enterprise environment, and it looks like we have an easily scalable and maintainable roadmap for the future.
