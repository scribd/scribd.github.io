---
layout: post
title: "Don't hardcode IAM credentials in GitHub!"
tags:
- oidc
- terraform
- github
team: Core Infrastructure
author: Oleh Motrunych
---

Scribd deploys a _lot_ of code from GitHub to AWS using GitHub Actions, which
means many of our Actions need to access AWS resources. Managing AWS API keys
and tokens for different IAM users is time-consuming, brittle, and insecure.
Managing key-distribution between AWS and GitHub also makes it difficult to
track which keys go where, when they should be rotated, and what permissions
those keys have. Fortunately AWS supports creating [OpenID Connect identity
providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
which is an ideal tool handle this kind of cross-cloud authentication in a more
maintainable way.

From the AWS documentation:

> IAM OIDC identity providers are entities in IAM that describe an external
> identity provider (IdP) service that supports the OpenID Connect (OIDC)
> standard, such as Google or Salesforce.
> 
> You use an IAM OIDC identity provider when you want to establish trust
> between an OIDC-compatible IdP and your AWS account.

The following diagram from [GitHub's documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#getting-started-with-oidc)
gives an overview of how GitHub's OIDC provider integrates with your workflows
and cloud provider:

![OIDC diagram from GitHub documentation](/post-images/2026-oidc/oidc-architecture.webp)

From within GitHub Actions we can specify the repository and role to assume
in via the
[aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
action, which will automatically configure the necessary credentials for AWS
SDK operations inside the job.

Our newly open sourced [**terraform-oidc-module**](https://github.com/scribd/terraform-oidc-module) makes setting up the resources necessary to bridge the gap between AWS GitHub _much_ simpler.

---

Tying OIDC together between AWS and a single GitHub repository starts with the
`aws_iam_openid_connect_provider` resource, but then developers must also
configure resources and permissions for common deployment tasks such as:

- **access S3 bucket with read only permissions**
- **access S3 bucket with write permissions**
- **access ECR  with read only permissions**
- **access ECR  with write permissions**
- **access some AWS service with some specific permissions set**


Redoing this work for _every_ repository in the organization to ensure
segmentation of permissions becomes _very_ tedious without the
`terraform-oidc-module`.

```hcl
module "oidc" {
  source = "git::https://github.com/scribd/terraform-oidc-module.git?ref=v1.0.0"

  name = "example"
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["example0000example000example"]
  repo_ref = ["repo:REPO_ORG/REPO_NAME:ref:refs/heads/main"]

  custom_policy_arns = [aws_iam_policy.example_policy0.arn,aws_iam_policy.example_policy1.arn ]

  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}
```

I hope you find this useful to getting started with OIDC and GitHub Actions!
