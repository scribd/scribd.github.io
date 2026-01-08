---
layout: post
title: "Accelerating Looker with Databricks SQL Serverless"
tags:
- looker
- databricks
- featured
author: hamiltonh
team:
- Infrastructure Engineering
- Core Platform
---

We recently migrated Looker to a Databricks SQL Serverless, improving our
infrastructure cost and reducing the footprint of infrastructure we need to
worry about! “Databricks SQL” which provides a single load balanced Warehouse
for executing Spark SQL queries across multiple Spark clusters behind the
scenes. “Serverless” is an evolution of that concept, rather than running a SQL
Warehouse in our AWS infrastructure, the entirety of execution happens on the
Databricks side. With a much simpler and faster interface, queries executed in
Looker now return results much faster to our users than ever before!

When we originally provisioned our “Databricks SQL” warehouses, we worked
together with our colleagues at Databricks to ensure [the terraform provider
for Databricks](https://github.com/databricks/terraform-provider-databricks) is
ready for production usage, which as of today is Generally Available. That
original foundation in Terraform allowed us to more easily adopt SQL Serverless
once it was made available to us.

```hcl
resource "databricks_sql_warehouse" "warehouse" {
  name                      = "Looker Serverless"
  # ...
  enable_serverless_compute = true
  # ...
}
```

The feature was literally brand new so there were a few integration hurdles we
had to work through with our colleagues at Databricks, but we got things up and
running in short order. By adopting SQL Serverless, we could avoid setting up
special networking, IAM roles, and other resources within our own AWS account,
we can instead rely on pre-provisioned compute resources within Databricks' own
infrastructure.  No more headache of ensuring all of the required infra is in
place and setup correctly!

The switch to Serverless reduced our infra configuration and management
footprint, which by itself is an improvement. We also noticed a significant
reduction in cold start times for the SQL Serverless Warehouse compared to the
standard SQL Warehouse. The faster start-up times meant we could configure even
lower auto-terminate times on the warehouse, savings us even more on
unproductive and idle cluster costs.

On the Looker side there really wasn’t any difference in the connection
configuration other than a URL change. In the end, after some preparation work
a simple 5 minute change in Looker, and a simple 5 minute change in Terraform
switched everything over to Databricks SQL Serverless, and we were ready to
rock! Our BI team is very happy with the performance, especially on cold start
queries. Our CFO is happy about reducing infrastructure costs. And I’m happy
about simpler infrastructure!
