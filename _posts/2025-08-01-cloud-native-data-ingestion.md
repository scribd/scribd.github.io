---
layout: post
title: "Let's save tons of money with cloud-native data ingestion!"
author: rtyler
tags:
- databricks
- aws
- deltalake
- featured
team:
- Infrastructure Engineering
- Core Platform
---

Delta Lake is a fantastic technology for quickly querying massive data sets,
but first you need those massive data sets! In [this
talk](https://www.youtube.com/watch?v=g1BZH8sbZWk) from [Data and AI
Summit](https://dataandaisummit.com) 2025 I dive into the cloud-native
architecture Scribd has adopted to ingest data from AWS Aurora, SQS, Kinesis
Data Firehose and more! 

By using off-the-shelf open source tools like kafka-delta-ingest, oxbow and
Airbyte, Scribd has redefined its ingestion architecture to be more
event-driven, reliable, and most importantly: cheaper. No jobs needed!
Attendees will learn how to use third-party tools in concert with a Databricks
and Unity Catalog environment to provide a highly efficient and available data
platform.

This architecture will be presented in the context of AWS but can be adapted
for Azure, Google Cloud Platform or even on-premise environments. The
[slides](https://www.scribd.com/document/874418144/Data-and-AI-Summit-2025-Presentation)
are also available on Scribd!


<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/g1BZH8sbZWk?si=HM9MXf4nNrGBfHAR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
