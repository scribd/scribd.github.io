---
layout: post
title: "Presenting Rust and Python Support for Delta Lake"
tags:
- deltalake
- databricks
- featured
- rust
author: rtyler
team: Core Platform
---

Delta Lake is integral to our data platform which is why we have invested
heavily in [delta-rs](https://github.com/delta-io/delta-rs) to support our
non-JVM Delta Lake needs. This year I had the opportunity to share the progress
of delta-rs at Data and AI Summit. Delta-rs was originally started by my colleague [QP](https://github.com/houqp) just over a year ago and it has now grown to now a multi-company project with numerous contributors, and downstream projects such as [kafka-delta-ingest](/blog/2021/kafka-delta-ingest.html).



In the session embedded below, I introduce the delta-rs project which is
helping bring the power of Delta Lake outside of the Spark ecosystem. By
providing a foundational Delta Lake library in Rust, delta-rs can enable native
bindings in Python, Ruby, Golang, and more.We will review what functionality
delta-rs supports in its current Rust and Python APIs and the upcoming roadmap.

I also try to give an overview of one of the first projects to use it in
production:
[kafka-delta-ingest](https://github.com/delta-io/kafka-delta-ingest), which
builds on delta-rs to provide a high throughput service to bring data from
Kafka into Delta Lake.


<center>
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/scYz12UK-OY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>


Investing in data platform tools and automation is a key part of the vision for
Platform Engineering which encompasses Data Engineering, Data Operations, and
Core Platform. We have a [number of open positions](/careers/#open-positions)
at the moment including a position to work closely with me as [Data Engineering
Manager](https://jobs.lever.co/scribd/e2187c1c-a1d6-4b77-bde6-acc997f68156).
The leader of the Data Engineering team will help deliver data tools and
solutions for internal customers building on top of Delta Lake, Databricks,
Airflow, and Kafka. Suffice it to say, there's a lot of really interesting work
to be done!
