---
layout: post
title: "Terraform OIDC module"
tags:
- Oidc
- Terraform
- GithubActions
team: Platform Infra
author: oleh-motrunych
---

We at platform engineering, use quite a bit of Github actions id our repositories, and in some cases from GitHub Action we need to access AWS resources.  Managing AWS API key and API token generated from AWS IAM user is kind of time consuming. Moreover these keys are not managed by Terraform and its hard to track when it was rotated and if it was ever. AWS supports identity which is ideal to handle this kind of situation in a more maintainable way. IAM OIDC identity providers are entities in IAM that describe an external identity provider.

Federated Github Actions works by allowing Github to authenticate to AWS directly, specifying the repo and role to assume GitHub - aws-actions/configure-aws-credentials: Configure AWS credential environment variables for use in other GitHub Actions.
Terraform has resource aws_iam_openid_connect_provider available starting from AWS provider version 3.26.0 Using this resource and IAM role with required permissions we can access our AWS resources from Github action. After years of using Github Action we have some common cases to access AWS resources and instead of copying aws_iam_openid_connect_provider from repo to repo we decided to create Terraform module what covers our basic organisation needs:
- access S3 bucket with read only permissions
- access S3 bucket with write permissions
- access ECR  with read only permissions
- access ECR  with write permissions
- access some AWS service with some specific permissions set

The following diagram gives an overview of how GitHub's OIDC provider integrates with your workflows and cloud provider: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#getting-started-with-oidc
![img.png](img.png)

Based on our work in Github and AWS using Terraform we created Terraform module what helps us access AWS from Github actions https://github.com/scribd/terraform-oidc-module - Connect to preview it cover our needs and even more it can attache any of your IAM policies what you pass as an parameter into module.

One of the usage examples:
using this code we can create  IAM role and trust relations with a conditional usage and using custom_policy_arns parameter we can pass a list of our IAM policies what will be attached into IAM role.

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

