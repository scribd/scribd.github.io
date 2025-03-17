---
layout: post
title: "Terraform module to manage Oxbow Lambda and its components"
tags:
- Oxbow
- Terraform
- AWS
- deltalake
- rust
team: Core Infrastructure
author: Oleh Motrunych
---


[Oxbow](https://github.com/buoyant-data/oxbow) is a project to take an existing storage location which contains [Apache Parquet](https://parquet.apache.org/) files into a [Delta Lake table](https://delta.io/).
It is intended to run both as an AWS Lambda or as a command line application.
We are excited to introduce [terraform-oxbow](https://github.com/scribd/terraform-oxbow), an open-source Terraform module that simplifies the deployment and management of AWS Lambda and its supporting components. Whether you're working with AWS Glue, Kinesis Data Firehose, SQS, or DynamoDB, this module provides a streamlined approach to infrastructure as code (IaC) in AWS.

### ✨ Why terraform-oxbow?
Managing event-driven architectures in AWS can be complex, requiring careful orchestration of multiple services. Terraform-oxbow abstracts much of this complexity, enabling users to configure key components with simple boolean flags and module parameters. This is an easy and efficient way to have Delta table created using Apache Parquet files.
### 🚀Features

With **terraform-oxbow**, you can deploy:

- AWS Oxbow Lambda with customizable configurations
- Kinesis Data Firehose for real-time data streaming
- SQS and SQS Dead Letter Queues for event-driven messaging
- IAM policies for secure access management
- S3 bucket notifications to trigger Lambda functions
- DynamoDB tables for data storage and locking
- AWS Glue Catalog and Tables for schema management


### ⚙️ How It Works

This module follows a modular approach, allowing users to enable or disable services based on their specific use case. Here are a few examples:

- To enable AWS Glue Catalog and Tables: ```hcl
enable_aws_glue_catalog_table = true
```

- To enable Kinesis Data Firehose delivery stream ```hcl
enable_kinesis_firehose_delivery_stream = true
```

- To enable S3 bucket notifications ```hcl
enable_bucket_notification = true
```

- To enable advanced Oxbow Lambda setup for multi-table filtered optimization ```hcl
enable_group_events = true
```

- AWS S3 bucket notifications have limitations: Due to AWS constraints, an S3 bucket can only have a single notification configuration per account. If you need to trigger multiple Lambda functions from the same S3 bucket, consider using event-driven solutions like SNS or SQS.


- IAM Policy Management: The module provides the necessary permissions but follows the principle of least privilege. Ensure your IAM policies align with your security requirements.


- Scalability and Optimization: The module allows fine-grained control over Lambda concurrency, event filtering, and data processing configurations to optimize costs and performance

