---
layout: post
title: Defining the Real-time Data Platform
author: rtyler
tags:
- kafka
- aws
- data
team: Core Platform
---

> **Editors note:** *This is a cross-post from Tyler's [personal blog](https://brokenco.de/2019/08/28/real-time-data-platform.html)*

One of the harder parts about building new platform infrastructure at a company
which has been around a while is figuring out exactly _where_ to
begin. At [Scribd](https://www.scribd.com/about/engineering) the company has
built a good product and curated a large corpus of written content, but
where next? As I alluded to in [my previous
post](/blog/2019/platform-engineering-at-scribd.html) about the Platform
Engineering organization, our "platform" components should help scale out,
accelerate, or open up entirely new avenues of development. In this article, I
want to describe one such project we have been working on and share some of the
thought process behind its inception and prioritization: the Real-time Data
Platform.

(sounds fancy huh?)

My first couple weeks at the company were intense. 
The idea of "Core Platform" was sketched out as a team "to scale apps and data" but that
was about the extent of it. The task I took on was to learn as much as I could,
as quickly as I could, in order to get the recruiting and hiring machine
started. Basically, I
needed to point Core Platform in a direction that was correct enough at a high
level in order to know what skills my future colleagues should have. While I
had _tons_ of discussions and did plenty of reading, I almost feel sheepish to
admit this, but much of our direction was heavily influenced by two
conversations, both of which took less than an hour.

The first was with [Kevin Perko](https://www.linkedin.com/in/kperko) (KP), the head
of our [Data Science team](https://www.scribd.com/about/data_science). His team
interacts the most with our current data platform (HDFS, Spark, Hive, etc); in
essence Data Science would be considered one of our customers. I asked some
variant of "what's wrong with the data infrastructure?" and KP unloaded what
must have been months of pent up frustrations shared by his entire team. The
themes that emerged were:

* Developers don't think about the consumers of the data. Garbage in, garbage
  out!
* Many nightly tasks spend a _lot_ of time performing unnecessary pre-processing of data.
* The performance of the system is generally poor. Ad-hoc queries from data
  scientists, depending on the time of day, are competing with resources for
  automated tasks.
* Everything has to be done in this nightly dependent graph of tasks, and when
  something goes wrong, it's very manual to recover from errors and typically
  ruins somebody's day.


Assuring KP that these were problems we would be solving, his next statement
would become a mainstay of our relationship moving forward: "_when will it be
ready?_"

My second influential conversation was with [Mike
Lewis](https://twitter.com/mikkelewis) the (then) head of Product. This conversation
was quite simple and didn't involve as much trauma counseling as the previous.
I asked "what can't you do today because of our technology limitations?" This
is a good question to ask product teams every now and again. They frequently
are optimising within their current constraints. One role of
platform and infrastructure teams is to remove those constraints. We discussed
the way in which users convert from passersby, to trial, to paid subscribers.
He also highlighted the importance of our recommendations and search results in
this funnel, and lamented the speed at which we can highlight relevant content
to new users. The maxim goes: the faster a new user sees relevant and
interesting content, the more likely they are to stick around.


Pattern matching between the current problems and the technology needed to
enable new product initiatives I named and defined the high level objective for
the **Real-time Data Platform** as follows:

> _To provide a streaming data platform for collecting and acting upon behavioral data
> in near real-time with the ultimate goal to enable day zero personalization in
> Scribd's products._


In more concrete terms, the platform is a collection of cloud-based services
(in AWS, more on that later) for ingesting, processing, and storing behavioral
events from frontend, backend, and mobile clients.  The scope of the Real-time
Data Platform extends from event definition and schema, to the layout of events
in persisted into long-term queryable storage, and the tooling which sits on
top of that queryable storage.

As the nominal "product owner" for the effort, I aimed to describe less about
what tools and technologies should be used, and instead forced myself to define
tech-agnostic requirements. Thereby leaving the discovery work for the team I
would ultimately hire.

The Real-time Data Platform must have:

* A high, nearing 100% data SLA. Meaning we must design in such a way to reduce
  data loss or corruption at every point of the pipeline.
* Maintain data provenance through the pipeline from data creation to usage. In
  essence, a Data Scientist should be able to easily track data from where it
  originated, and understand the transformative steps along the way.
* Event streams should be considered API contracts, with schemas suggested or
  enforced when possible. A consumer from an event stream should be able to
  trust the quality of the events in that stream.
* Data processing and transformation must happen as close to ingestion as
  possible. Events which arrive in long-term storage must be structured and
  partitioned for optimal query performance with zero or minimal post-processing
  required for most use-cases.
* The platform must scale as the data volume grows without requiring
  significant redesign or rework.


In essence, we need to change a number of foundational ways in which we
generate, transfer, and consider the data which Scribd uses. As Core Platform
has unpeeled layer after layer of this onion, we have been able to affirm at
each step of the way that we're moving in the right direction, which is by
itself quite exciting.

The design of the Real-time Data Platform which we're currently building out is
something I will share at a high level in a subsequent blog post.

I want to finish this one with some parting thoughts. If you are building
_anything_ foundational in a technology organization, you **must** talk to the
product team. You must also talk to your customers, but I don't like to ask
them what they want, I like to ask what they don't like and don't want. Listen
to that negative feedback, understand what lies beneath the frustrations.
Finally, have a vision for the future, but build and deliver incrementally.
When I first sketched this out, I was forthcoming in stating "this is a 2020
project." I made sure to clarify that this did not mean we wouldn't deliver anything
to the business for 18 months. Instead, I made made sure to explain that to
execute on this overall vision would be a long journey with milestones along
the way.

If you haven't ever watched a skyscraper being built, you would be amazed at
how much of the time is spent digging a great big hole, sinking steel into
bedrock, and pouring concrete. Months of people working in a city block-sized
hole before anything takes shape that even resembles a skyscraper.  Building
strong foundations takes time, but that is in essence the role of any platform
and infrastructure organization. The challenge is to keep the business moving
forward today while _also_ building those fundamental components upon which the
business will stand in a year or two.


It is tough, but that's exactly what I signed up for. :)

