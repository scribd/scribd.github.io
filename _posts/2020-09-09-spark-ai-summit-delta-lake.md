---
layout: post
title: "Spark and AI Summit 2020: The revolution will be streamed"
tags:
- featured
- databricks
- spark
- deltalake
team: Core Platform
author: rtyler
---

Earlier this summer I was able to present at Spark and AI Summit about some of
the work we have been doing in our efforts to build the [Real-time Data
Platform](/blog/2019/real-time-data-platform.html).  At a high level,
what I had branded the "Real-time Data Platform" is really: [Apache
Kafka](https://kafka.apache.org), [Apache Airflow](https://airflow.apache.org),
[Structured streaming with Apache Spark](https://spark.apache.org), and a
smattering of microservices to help shuffle data around. All sitting on top of
[Delta Lake](https://delta.io) which acts as an incredibly versatile and useful
storage layer for the platform.

In the presentation I outline how we tie together Kafka,
Databricks, and Delta Lake.

<center>
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/YmyCOr9Mr9Y" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>

The presentation also complements some of our
blog posts:

* [Streaming data in and out of Delta Lake](/blog/2020/streaming-with-delta-lake.html)
* [Streaming development work with Kafka](/blog/2020/introducing-kafka-player.html)
* [Ingesting production logs with Rust](/blog/2020/shipping-rust-to-production.html)
* [Migrating Kafka to the cloud](/blog/2019/migrating-kafka-to-aws.html)


I am incredibly proud of the work the Platform Engineering organization has
done at Scribd to make real-time data a reality. I also cannot recommend Kafka +
Spark + Delta Lake highly enough for those with similar requirements.

