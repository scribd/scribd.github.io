---
layout: post
title: "Automating Databricks with Terraform"
team: Core Platform
author: rtyler
tags:
- databricks
- terraform
- featured
---

The long term success of our data platform relies on putting tools into the
hands of developers and data scientists to “choose their own adventure”. A big
part of that story has been [Databricks](https://databricks.com) which we
recently integrated with [Terraform](https://terraform.io) to make it easy to
scale a top-notch developer experience. At the 2021 Data and AI Summit, Core
Platform infrastructure engineer [Hamilton
Hord](https://github.com/HamiltonHord) and Databricks engineer [Serge
Smertin](https://github.com/nfx) presented on the Databricks terraform provider
and how it's been used by Scribd.

In the session embedded below, they share the details on the [Databricks (Labs)
Terraform
integration](https://github.com/databrickslabs/terraform-provider-databricks)
and how it can automate literally every aspect required for a production-grade
platform: data security, permissions, continuous deployment and so on. They
also discuss the ways in which our Core Platform team enables internal
customers without acting as gatekeepers for data platform changes. Just about
anything they might need in Databricks is a pull request away! 

<center>
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/h8LrVmb4W2Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>


In hindsight, it's mind-boggling how much manual configuration we had to
previously maintain. With the Terraform provider for Databricks we can very
easily test, reproduce, and audit hundreds of different business critical
Databricks resources. Coupling Terraform with the recent "multi-workspace"
support that Databricks unveiled in 2020 means we can also now provision an
entirely new environment in a few hours!

Investing in data platform tools and automation is a key part of the vision for
Platform Engineering which encompasses Data Engineering, Data Operations, and
Core Platform. We have a [number of open positions](/careers/#open-positions)
at the moment, but I wanted to call special attention to the [Data Engineering
Manager](https://jobs.lever.co/scribd/e2187c1c-a1d6-4b77-bde6-acc997f68156)
role for which we're currently hiring. The leader of the Data Engineering team
will help deliver data tools and solutions for internal customers building on
top of Delta Lake, Databricks, Airflow, and Kafka. Suffice it to say, there's a
lot of really interesting work to be done!
