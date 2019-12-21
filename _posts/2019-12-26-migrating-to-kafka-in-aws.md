---
layout: post
title:  "Migrating Kafka to the Cloud"
author: christianw
tags:
- kafka
- msk
- featured
- msk-series
team: Core Platform
---

[Apache Kafka](https://kafka.apache.org) has been part of Scribd's backend
architecture for a long time but only recently has it become a cornerstone in
the exciting future we imagine for ourselves. Persisting messages to topics and
brokering them between both producers and consumers may seem like a dull job.
However, when envisioning an event-driven service-oriented architecture and
numerous stream processing applications, the role Kafka plays becomes exciting,
empowering, and mission-critical. In order to realize this future, we had to
move from our deprecated Kafka deployment, to a newer well-managed Apache
Kafka environment in the cloud.

When I joined Scribd earlier this year, Kafka existed, and that's about it. We
weren't using it to its potential.  Part of the "Kafka avoidance" syndrome that
existed, stemmed from the operational difficulties of _just_ running the thing.
It was almost like we were afraid to touch Kafka for fear it might fall over.
Another part of that avoidance grew out of the functionality not matching
developers' expectations developer expectations.  When we first adopted Kafka,
ours was an on-premise deloyment of version **0.10**. Developers used it for a
few projects, unexpected things occasionally happened that were difficult to
"fix" and we started avoiding it for new projects.

As we considered what we needed to build the [Real-time Data
Platform](/blog/2019/real-time-data-platform.html), Apache Kafka was an obvious
choice. Across the industry companies are building and deploying fantastic
streaming applications with Kafka, and we were confident that it was the right
path forward, we only needed to dispel some of the emotional baggage around our
legacy cluster.

This is the first in a series of posts where we will describe the steps we took
at Scribd to migrate our existing on-premise workloads to [Managed
Streams for Kafka](https://aws.amazon.com/msk/) (MSK) in AWS. In this introductory
article, I will focus on the initial work we did to quantify our existing
workloads and setup our evaluation.

## Kicking the Wheels

Reducing the operational complexity and costs meant we needed to evaluate Kafka cloud and SaaS providers.
Our next step was to evaluate the offerings, contrasting their pros and cons.
Price certainly leaps to mind as one of the comparisons to make, but since we
were focused on features and architecture, we deferred all price comparisons.
I believe that this is actually the only way to do a valid comparison between
cloud providers, since managed service providers do not all offer the same
features.

We focused on a few questions to anchor the evaluation:

* **How will the platform handle our existing workloads?** Naturally we wanted to
  migrate our existing producers and consumers to the new service, so they
  needed to integrate smoothly.
* **How will we grow new workloads in the platform?** Our pre-existing
  workloads are only the start, we have high ambitions for what our Kafka-based
  future looks like, and the provider would need to grow with our needs.
* **How well can we secure and manage it?** Our
  legacy on-premise deployment was wide-open internally 😱. Client applications
  did not need to authenticate to write messages to a specific topic. They only
  needed network access. In our new cluster, we wanted to make sure each client
  was constrained by ACLs (Access Control Lists).

### Prototype Approach

To get some hand-on experience with each platform, we implemented a prototype
to represent one of our larger analytics workloads. Not only was it a big data stream to work with, but it also would benefit from some extensions we could imagine for the future, such as message debatching, routing and validation streams. The
prototype included "event players" to send fake messages at a rate similar to
what we actually receive in production, as well as mock downstream
applications which applied additional stream processing duties.

Each "add-on" extension to the existing stream was implemented as a
[KStreams](https://kafka.apache.org/10/documentation/streams/developer-guide/)
application, reading from the ingress stream and writing to a new downstream
topic. The end-to-end pipeline was realized by this series of KStreams
applications, enriching or directing the original message in some way before
writing it to a topic. From a consumer perspective, this flexibility in the
pipeline was very important to us.  Consumers who only want validated data
could subscribe to the "validated" topic to get messages in real-time, whereas
consumers who wanted the firehose could hook up to the ingress topic.

The final version of our prototype included enough transforms to magnify the
original workload traffic by about 4X. This provided us with useful information
for capacity planning and vendor evaluation, since it gave us a way to see how
the enrichments we desired in our pipeline might impact the overall load and
storage demands on the cluster.  It also gave us some perspective on the
complexity of operating multiple streaming applications to deliver higher
quality data in real-time.

### Vendor Evaluation

Determining the vendor for the future of your streaming data platform is no
light-hearted decision! For each vendor, we went created the topics and ACLs necessary
to support our prototype pipeline, and then we ran the prototype
workload against a cluster created on each vendor's platform.

Configuring ACLs and Kafka client properties, the "authentication mode support"
stood out as one of the big differences AWS MSK and other providers.
AWS MSK
**only** supports TLS authentication using client certificates and [AWS PCAs](https://docs.aws.amazon.com/acm-pca/latest/userguide/PcaWelcome.html)
(Private Certificate Authorities)
TLS authentication is a bit painful at the outset, but as we got more
comfortable it became less problematic. The cluster-side for TLS authentication
is _much_ easier with AWS MSK than attempting to implement client certificates
in a traditional on-premise Kafka deployment.  A separate post in this series
will go into more detail related to our implementation of Kafka TLS
authentication.

Another major consideration for us has been _monitoring_.  AWS MSK turned out
to be a much better fit for us than others, since we were able to pull metrics
directly from MSK clusters into [Datadog](https://datadoghq.com).  This allowed
us to view MSK metrics together with our other operational metics. Datadog's
own [MSK integration](https://docs.datadoghq.com/integrations/amazon_msk/) made
the integration not much harder than a couple button clicks.


---

Feeling confident that we knew how to secure, manage, and grow our Kafka
environments across a number of available offerings, we ultimately settled on
AWS MSK to power the streaming platform of Scribd's future.

I look forward to sharing more about our Kafka migration into the cloud in
subsequent posts in this series. We'll dive deeper into TLS authentication with
MSK, discuss how we prepared our existing producers and consumers for migration
from our old 0.10 Kafka to a _much_ newer version (2.2.1), and how we ended up
implementing the gradual rollover to the new cluster with no data loss and no
downtime!
