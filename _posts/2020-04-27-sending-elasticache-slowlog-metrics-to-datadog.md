---
layout: post
title: "Sending Elasticache slowlog metrics to Datadog"
authors:
- jimp
tags:
- terraform
- monitoring
team: Core Infrastructure
---


# Sending Elasticache slowlog metrics to Datadog

We’ve recently migrated our Redis workloads to AWS Elasticache. We really like having a managed service, since we don’t have any more Redis servers to maintain. However, as with all managed services, there are some tradeoffs. One of those tradeoffs was that we no longer had access to all of [Datadog’s Redis integration’s](https://docs.datadoghq.com/integrations/redisdb/) features. Instead, we have [Datadog’s AWS Elasticache integration](https://docs.datadoghq.com/integrations/amazon_elasticache/#overview). One of the most noticeable features we saw as missing was the lack of slowlog metrics in AWS Elasticache. This metric is useful as it gives us valuable data to alert against when Redis behavior starts running afoul. There is no ability to run a Datadog agent on Elasticache’s servers, so we had to obtain the metric some other way. 

We decided to use AWS Lambda to periodically query our Elasticache redis instances and submit those missing slowlog metrics directly to Datadog, much as the datadog-agent integration would have otherwise.  

## The Lambda job

We wrote [https://github.com/scribd/elasticache-slowlog-to-datadog](https://github.com/scribd/elasticache-slowlog-to-datadog) to connect to an AWS Elasticache job (given by the REDIS_HOST parameter), gather its slowlogs, and submit a [HISTOGRAM](https://docs.datadoghq.com/developers/metrics/types/?tab=histogram) metric type to Datadog, consistent with Datadog’s Redis integration. 

The application is packaged with its required libraries as a ready-to-deploy archive in our [releases page](https://github.com/scribd/elasticache-slowlog-to-datadog/releases). To deploy directly to AWS from the console, upload the “Full zip distribution” and supply the [required parameters](https://github.com/scribd/elasticache-slowlog-to-datadog#parameters). I’d recommend using our Terraform wrapper, however.

## The Terraform wrapper

We wrote [https://github.com/scribd/terraform-elasticache-slowlog-to-datadog](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog) to apply the elasticache-slowlog-to-datadog lambda job to target AWS accounts and Elasticache instances. 

When lambda jobs include libraries that must be vendored in, as elasticache-slowlog-to-datadog does, the existing patterns include [building locally, or uploading artifacts to S3](https://www.terraform.io/docs/providers/aws/r/lambda_function.html#specifying-the-deployment-package). However, I like the approach of maintaining a separate repository and build pipeline, as this works around Terraform’s [intentionally limited build functionality](https://github.com/hashicorp/terraform/issues/8344#issuecomment-361014199). Instead, the terraform wrapper merely [consumes the elasticache-slowlog-to-datadog artifact](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog/blob/master/main.tf#L97).

## Usage

To deploy elasticache-slowlog-to-datadog via terraform, add the following to your terraform file: 

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

Using AWS Lambda, we can supplement the metrics we get natively from Datadog’s AWS Elasticache integration. 

Stay apprised of future developments by watching our release pages: 

- [elasticache-slowlog-to-datadog](https://github.com/scribd/elasticache-slowlog-to-datadog/releases)
- [terraform-elasticache-slowlog-to-datadog](https://github.com/scribd/terraform-elasticache-slowlog-to-datadog/releases)
