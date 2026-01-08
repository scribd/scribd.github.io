---
layout: post
title: "What Core Platform does at Scribd"
author: rtyler
tags:
- scribd
team:
- Infrastructure Engineering
- Core Platform
---

> **Editors note:** *This is a cross-post from Tyler's [personal blog](https://brokenco.de/2019/03/28/scribd-core-platform.html)*

A number of people have asked me recently what I actually _do_ for a living
these days at [Scribd](https://scribd.com). Due to the very public nature of my
involvement with the [Jenkins](https://jenkins.io/) project and the [Continuous
Delivery Foundation](https://cd.foundation), a few of my friends have seemingly
forgotten that CI/CD is not actually my full time job! My career has largely
been focused on two axis: building high-functioning engineering teams, and
building backend API/service infrastructure.

At Scribd, I'm ratcheting up the responsibility with the Core Platform
team. The team exists to "provide robust and foundational software,
increasing Scribd's operational excellence to scale apps and data." Our primary
customer is Scribd Engineering, and we're focused on building, testing,
deploying apps and infrastructure which will help other teams rapidly scale,
inter-operate, integrate with real-time (streaming) data sources and models.

I think of Core Platform as logically a step up from operational infrastructure
such as AWS VPCs, networks, load balancers, Kubernetes clusters, etc, and a
step below business API services such as document rendering, user management,
etc. Services and Infrastructure like messaging (Kafka), stream processing
(Spark), and machine learning model training/delivery coming to mind, along
with all the other nuances of scaling these services technically and
organizationally.

We also have additional application runtime responsibilities such as RPC
tooling including tracing, discovery, and that sort of thing.

Like any internally focused team, Core Platform is also responsible for
education and evangelism of our work within engineering, whether we're writing
thorough documentation for the systems we build, hosting internal workshops,
or providing implementation support to our peers across engineering.
This is where I'm excited to utilize some of the skills I had honed over the
past three years.

---

The first challenge I faced when joining Scribd was actually bootstrapping the
team. Defining the charter, some roadmap, and most importantly: hiring talented
people. With three people already hired, I am excited to be focusing more on
execution for the next couple of months. We have an enormous amount of text
data, and some wild ideas on what we can enable with the right data platform
beneath it, so should be heaps of fun!
