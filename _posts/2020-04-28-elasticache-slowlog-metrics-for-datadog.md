---
layout: post
title: "Sending ElastiCache slowlog metrics to Datadog"
authors:
- jimp
tags:
- terraform
- elasticache
- aws
- monitoring
team: Core Infrastructure
---

All managed services will have trade-offs. When Scribd adopted AWS ElastiCache we
could no longer use Datadog's excellent [Redis
integration](https://docs.datadoghq.com/integrations/redisdb/)
and lost some killer metrics we couldn't live without.
We deployed the [AWS ElastiCache
integration](https://docs.datadoghq.com/integrations/amazon_elasticache/#overview)
for Datadog which returned the desired metrics back to our dashbards
with one notable exception: "slowlog" metrics.

The Redis [`SLOWLOG`](https://redis.io/commands/slowlog) is used to help identify queries
which are taking too long to execute. We use the slowlog metrics provided by the
Datadog Redis integration alert us when a Redis server's behavior starts to go
south, a key indicator of looming user-impactful production issues.

Since AWS ElastiCache is a managed service, we obviously cannot deploy a
Datadog agent onto AWS' servers to run the Datadog Redis integration. The
approach we have taken, which we have now open sourced, is to use AWS Lambda to
periodically query our ElastiCache Redis instances and submit the missing
slowlog metrics _directly_ to Datadog, just as the Redis integration would have
done.  

## The Lambda job

The first part of the equation is our Lambda job:
[elasticache-slowlog-to-datadog](https://github.com/scribd/elasticache-slowlog-to-datadog)
which connects to an AWS ElastiCache host (determined by the `REDIS_HOST` parameter),
gather its slowlogs, and submit a
[`HISTOGRAM`](https://docs.datadoghq.com/developers/metrics/types/?tab=histogram)
metric type to Datadog. Basically mirroring the functionality of the Datadog Redis integration.

The application is packaged with its required libraries as a ready-to-deploy
archive in our [releases
page](https://github.com/scribd/elasticache-slowlog-to-datadog/releases). To
deploy directly to AWS from the console, upload the “Full zip distribution” and
supply the [required
parameters](https://github.com/scribd/elasticache-slowlog-to-datadog#parameters).
I’d recommend using our Terraform module, however.

## The Terraform Module

The second part of the equation is the Terraform module:
[terraform-elasticache-slowlog-to-datadog](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog)
which will apply the elasticache-slowlog-to-datadog Lambda job to target AWS accounts
and ElastiCache instances. 

When Lambda jobs include libraries that must be vendored in, as
`elasticache-slowlog-to-datadog` does, the existing patterns include [building
locally, or uploading artifacts to
S3](https://www.terraform.io/docs/providers/aws/r/lambda_function.html#specifying-the-deployment-package).
However, I like the approach of maintaining a separate repository and build
pipeline, as this works around Terraform’s [intentionally limited build
functionality](https://github.com/hashicorp/terraform/issues/8344#issuecomment-361014199).
The terraform module consumes the
[elasticache-slowlog-to-datadog
artifact](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog/blob/master/main.tf#L97).

## Usage

To deploy elasticache-slowlog-to-datadog via Terraform, add the following to your terraform file: 

```
module slowlog_check {
  source                      = "git::https://github.com/scribd/terraform-elasticache-slowlog-to-datadog.git?ref=master"
  elasticache_endpoint        = "master.replicationgroup.abcdef.use2.cache.amazonaws.com"
  elasticache_security_groups = ["sg-12345"]
  subnet_ids                  = [ "subnet-0123456789abcdef", "subnet-abcdef1234567890", "subnet-1234567890abcdef", ]
  vpc_id                      = "vpc-0123456789abcdef"
  datadog_api_key             = "abc123"
  datadog_app_key             = "abc123"
  namespace                   = "example"
  env                         = "dev"
  tags                        = {"foo" = "bar"}
}
```

## Conclusion

Using AWS Lambda, we can supplement the metrics we get natively from Datadog’s AWS ElastiCache integration. 

Stay apprised of future developments by watching our release pages: 

- [elasticache-slowlog-to-datadog](https://github.com/scribd/elasticache-slowlog-to-datadog/releases)
- [terraform-elasticache-slowlog-to-datadog](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog/releases)
