---
layout: post
title: "Moderning a decades old data pipeline"
author: qphou
tags:
- airflow
- spark
- featured
- datapipe
team: Core Platform
---

Our massive data pipeline has helped us process enormous amounts of information
over the past decade, all to help us help our users discover, read, and learn.
In this blog series, I will share how we're upgrading our data pipeline to
give internal customers faster, and more reliable results.

The data pipeline is currently managed using a home grown workflow
orchestration system written in Ruby called "Datapipe." The first commit of our
data pipeline repo dates all the way back to 2010.  We created it
around the time when everybody else was building their own orchestration tools,
such as Pinterest's [Pinball](https://github.com/pinterest/pinball), Spotify's
[Luigi](https://github.com/spotify/luigi), or AirBnB's
[Airflow](https://airflow.apache.org/). These tools all perform the same
basic function: process and execute a directed-acyclic-graph (DAG) of "worK",
typically associated with a ETL data pipelines.

Today, we have 1500+ tasks and 14 DAGs, with the majority of tasks globbed
together in one giant DAG containing more than 1400 tasks:

![It's a large DAG](/post-images/2020-02-airflow/dat-dag-tho.png)


Datapipe has served us well and brought the company
to where it is today. However, it has been in maintenance mode for some time.
As a result, it's struggling to meet the needs of Scribd's fast growing
engineering team,. Since [Scribd is moving more and more into the
cloud](/blog/2019/migrating-kafka-to-aws.html),
decided that now is a good time for us to step back and redesign the system for the
future.

We need a modernized workflow orchestration system to help drastically improve
productivity and unlock the capability to build new product features that were
not previously possible.


## Opportunity for improvement

Here are some of the areas we think would result in big impacts to the
organization:

**Flexibility:** The in house system can only setup run schedule at the granularity
of one day, which sets a limit on freshness of our data. To unlock new
applications, we need to let engineers to define schedules with more
flexibility and granularity.

**Productivity:** Culturally, we would like to shift from mono-repo to multi-repo.
Needless to say, putting all the workflow definitions in a single file is not
scalable. Our workflow config today already contains 6000 lines of code and is
still growing. By building tooling to support multi-repo setup, we hope to
reduce coupling and speed up development cycles.

**Ownership:** Today, we have dedicated engineers keeping eyes on nightly runs to
notify workflow owners if anything goes wrong. The web UI doesn't some of the
common maintenance actions like killing a running tasks. This, combined with
lack of builtin monitoring and alerting support within the orchestration
system, means even if workflow owners want to take full ownership of their
tasks, there is no easy way to accomplish it. We need to flip this around and
empower workflow owners to take care of their own tasks end to end. This is the
only scalable way going forward.

**Scalability and availability:** The orchestration system should be able to handle
the scale of data pipeline for many years to come. It should also be highly
available and function without issue when a minority of the cluster goes down.

**Operability:** Minor failures in the pipeline should not impact the rest of the
pipeline. Recovering failed tasks should be easy and fully self-serviced.

**Extensibility:** It's not surprising that after many years of development, the in
house system comes with many unique and useful features like cross date
dependencies. It should be easy to develop and maintain custom features for the
new system.

**Cloud native:** As we migrate its infrastructure from a datacenter to the cloud, the
new system will need to be able to run smoothly in the cloud and integrate
nicely with various SASS offerings like Datadog, Pagerduty and Sentry.

We basically Had two options: retrofit Datapipe or
pick a well maintained open source project as the building block. After lots of
prototyping and careful evaluation, we decided to adopt [Apache Airflow](https://airflow.apache.org).


## Super-charging Airflow

I wish adopting Airflow is just as simple as doing a `pip install` and pointing
the config to a RDS endpoint. It turns out we had to do a lot of preparation
work to make it meet all our requirements. Just to name a few:

* Implement scalable and highly available setup leveraging both ECS and EKS
* Write tooling to support defining DAGs in multiple repositories
* Scale Airflow to handle one of our gigantic DAG
* Create custom Airflow plugins to replicate some of the unique features from the in house system
* Build DAG delivery pipeline with a focus on speed and separation of environments
* Monitor Airflow itself as well as DAGs and tasks with Datadog, Pagerduty and Sentry.
* Execute multi-stage workflow migration from the in house system

Each one of the above items warrants a blog post of its own. We will be sharing
what we have learned in more detail throughout this series of blog posts.

At Scribd, we embrace open source and try to contribute back to the community
as much as we can. Since start of this internal project, we have contributed
[more than 20 patches
upstream](https://github.com/apache/airflow/pulls?utf8=%E2%9C%93&q=is%3Apr+author%3Ahouqp)
to Airflow including EKS support, Pagerduty hooks, many bug fixes and
performance improvements. We hope to continue this trend and contribute more as
the project progresses.


If this sounds interesting to you, the Core platform team is hiring!

Come join us if you love building scalable data/ML platforms using open source
technologies. :)
