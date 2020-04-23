---
layout: post
title: "How Scribd manages Datadog’s AWS integration using Terraform"
authors:
- jimp
- qphou
tags:
- featured
- terraform
- monitoring
team: Core Infrastructure
---

Datadog comes with a builtin AWS
[integration](https://docs.datadoghq.com/integrations/amazon_web_services/?tab=allpermissions)
to ship CloudWatch metrics to your Datadog account. Once enabled, the
integration will automatically synchronize whitelisted CloudWatch metrics into
your Datadog account.

While this integration is powerful and convenient to use, it’s setup process is
actually quite involved. As outlined in [Datadog's documentation](https://docs.datadoghq.com/integrations/amazon_web_services/?tab=allpermissions), there are 18
manual steps required, including:

- finding the right AWS account ID
- creating the right IAM policy
- copy pasting the right AWS resource ID into Datadog UI
- etc.

If you have more than a few AWS accounts, you may prefer to use Terraform.

In this blog post, we would like to share how Scribd uses Terraform to automate
our Datadog and AWS integration across the organization.

# Enable Datadog’s builtin AWS integration

To address this problem, we built the [terraform-aws-datadog
module](https://github.com/scribd/terraform-aws-datadog). With only couple
lines of HCL code, Terraform will perform all the necessary steps to setup
Datadog integration with a specific AWS account with Scribd’s best practices:

```terraform
module "datadog" {
  source                = "git::https://github.com/scribd/terraform-aws-datadog.git?ref=master"
  aws_account_id        = data.aws_caller_identity.current.account_id
  datadog_api_key       = var.datadog_api_key
  env                   = "prod"
  namespace             = "team_foo"
}
```

The benefit from an AWS Account maintainer point of view is that using the
module is a convenient way to inherit centralized best practice. For module
maintainers, any change to the datadog integration module can be released using
a [standard Terraform module release process](https://www.terraform.io/docs/registry/modules/publish.html).


# Cloudwatch log synchronization

Initially, the module only sets up the base integration. As adoption increased, more
features were added to the module by various teams. One of these features is
automation for setting up log ingestion for cloudwatch.

Like setting up the official AWS integration app, the [instructions for log
synchronization](https://docs.datadoghq.com/integrations/amazon_web_services/?tab=allpermissions#log-collection)
are a bit overwhelming.

However, using the terraform-aws-datadog module, we can enable the feature with a single parameter:

```terraform
module "datadog" {
  source                = "git::https://github.com/scribd/terraform-aws-datadog.git?ref=master"
  datadog_api_key       = var.datadog_api_key
  env                   = "prod"
  namespace             = "project_foo"
  cloudwatch_log_groups = ["cloudwatch_log_group_1", "cloudwatch_log_group_2"]
}
```

That’s it, Terraform will automatically create the datadog serverless function
and triggers for specified log groups to forward all cloudwatch logs into
Datadog. After running terraform apply, you should be able to see logs showing
up in Datadog within minutes.


# Future work

With both metrics and logs synchronized into Datadog, we are able to leverage
Datadog as the central hub for all things monitoring. We are planning to bring
more features to the module as we migrate Scribd’s infrastructure into AWS.

Metrics ingested through the official AWS integration are delayed by couple
minutes, which is not ideal to use as signals for monitoring critical systems.
There are opportunities to enable real time metrics synchronization by
automating datadog agent setup.

The [datadog-serverless-functions
repo](https://github.com/DataDog/datadog-serverless-functions/tree/master/aws)
contains two other lambda based AWS augmentations that we may add as available
features of the module: `vpc_flow_log_monitoring` and `rds_enhanced_monitoring`.

Stay apprised of future releases by watching our [release page](https://github.com/scribd/terraform-aws-datadog/releases).

_Special shout out to Taylor McClure and Hamilton Hord for starting the project, as well
as Sai Kiran Burle, Kamran Farhadi and Eugene Pimenov for improvements and bug
fixes._
