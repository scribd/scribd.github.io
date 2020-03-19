---
layout: post
title: "Easy read-only ECR access for the entire AWS Organization"
tags:
- featured
- aws
- ecr
- iam
- docker
team: Core Platform
author: rtyler
---

IAM is a **very** powerful tool. It can also be very complex, and difficult to
use effectively. In our migration into AWS a number of Scribd developers have
had varying levels of success in climbing Mount IAM. For some use-cases where a
resource needs to be accessed across an AWS Account boundary, the steeper
learning curve has proven far too challenging for some, myself included.

We heavily rely on an AWS Organization and a hierarchy of AWS Accounts
to help us separate billing and provide a hard-separation between some
classes of resources. On the whole, I think this approach has been valuable
but when trying to manage resources which are _shared_ across
the Organization, our initial IAM/Role efforts have left us quite frustrated.

One example of a resource we frequently require shared access to are
our Elastic Container Registries (ECR).
The Core Platform team has ECRs to host Docker containers which can and
should be consumed by other teams and resources in their AWS Accounts. Not
only that, we also need to access our own containers from different accounts.
As a matter of habit, anything "production", we deploy in our "production"
Account, with strong access control policies and security, such as read-only
access to the AWS Console. We do our normal development and iteration in a
"development" Account, which may be host to any number of AWS Elastic Container
Services (ECS), each needing to pull containers from those ECRs.

Even within a single team, we're using multiple AWS Accounts, and have
cross-account IAM policies to implement!

I recently watched a demo in a team meeting from my colleague
[QP](https://github.com/houqp) who was setting up IAM cross-account Roles.
Based on his demo, I knew that getting the cross-account Roles correct for our
ECR use-cases was going to be tedious and painful. I lamented this to our
friends at [The Duckbill Group](https://www.duckbillgroup.com/), as I usually
do whenever something in AWS feels unpleasant. "Surely I'm missing something
here." Luckily enough, I was missing something:

```
 rtyler | I'm assuming there's no feature I'm missing which would allow us to say "any resource in our AWS org can access this", I
        | kind of really want a global read-only access for some ECRs :/
 rtyler | is there an arn shortcut for "whole org" perhaps?
cquinn* | Yes, the AWS:PrincipalOrgID Condition Key.
cquinn* | https://aws.amazon.com/blogs/security/control-access-to-aws-resources-by-using-the-aws-organization-of-iam-principals/
        | goes into some depth.
 rtyler | oh god, turing complete JSON
cquinn* | Cheer up, I’m sure it works in YAML.
```

Thankfully, [Corey](https://twitter.com/QuinnyPig/) was 100% correct, the
`AWS:PrincipalOrgID` condition in the IAM policy document would allow the exact
type of quasi-global read-only access I was after. Below is a snippet of
Terraform which defines the policy:

```terraform
data "aws_iam_policy_document" "ecr_readonly_access" {
  statement {
    sid    = "ReadonlyAccess"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:PrincipalOrgID"
      # This is our organization-wide identifier which can be found after
      # log-in to AWS: <https://console.aws.amazon.com/organizations/home>
      values = ["o-REDACTED"]
    }

    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:GetRepositoryPolicy",
      "ecr:DescribeRepositories",
      "ecr:ListImages",
      "ecr:DescribeImages",
      "ecr:BatchGetImage",
      "ecr:DescribeImageScanFindings",
    ]
  }
}
```

With the above policy applied via the `aws_ecr_repository_policy` resource to
our production ECRs, developers across the company can now access our
containers in their CodeBuild, ECS, EKS, and other AWS-based resources without
problem!

```terraform
data "aws_iam_policy_document" "ecr_access" {
  source_json   = data.aws_iam_policy_document.ecr_readonly_access.json
  # The ecr_full_access policy is another policy document resource with more
  # ARNs for roles and resources which can push to ECR
  override_json = data.aws_iam_policy_document.ecr_full_access.json
}

resource "aws_ecr_repository_policy" "ecr" {
  repository = aws_ecr_repository.some_ecr.name
  policy     = data.aws_iam_policy_document.ecr_access.json
}
```

**Note:** _Our Terraform snippets have been adapted from [this great Cloud Posse
module](https://github.com/cloudposse/terraform-aws-ecr)_.



The great thing about migrating to AWS in 2020, is that just about all simple
challenges have already been figured out, and if you have a partner like
The Duckbill Group, it's very easy to avoid over-engineering and unnecessary
complex solutions!
