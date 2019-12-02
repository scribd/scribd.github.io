---
layout: post
title: "We're building the largest library in history"
author: rtyler
tags:
- featured
- scribd
- 2020
---

Sharing millions of documents and books with the world is a daunting
technological challenge, one we're solving here at Scribd.  Our stack of tools
is as varied as the library itself. A reading experience built for iOS,
Android, and web browsers of all sizes. To serve those apps: a blend of Ruby
and Go services, with information pulled from various caches, search indices,
and databases. We use large data sets to run A/B tests, compute
recommendations, and train models. It is one thing to curate a large
collection, it's quite another to bring it to the world in an enjoyable and
easy-to-use package. "**Change the way the world reads**", that's the challenge
ahead of us.


Today [we
announced](https://blog.scribd.com/home/scribd-announces-58-million-strategic-investment-led-by-spectrum-equity)
a $58 million equity financing round led by Spectrum Equity.

> Over the past two years, Scribd has achieved major milestones, including
> surpassing over one million paying subscribers, introducing localized
> experiences for international markets, and nearly doubling its employee base.
> It has expanded its footprint with offices in San Francisco (HQ), New York,
> Phoenix, Toronto, and Amsterdam.

The future is looking bright, and we have a great opportunity to grow even
further in 2020 and beyond. From a technology standpoint, there's a lot of
exciting work planned for [Infrastructure](#infra), [Web](#web), [Data Platform
and Engineering](#cplat), [Mobile](#mobile), and a number of other teams.



<a name="infra"/>
### Infrastructure

Scaling infrastructure to serve hundreds of millions of people a year while
enabling internal teams to deliver new features safely and efficiently is the
fundamental challenge of growing infrastructure at Scribd. The majority of our
systems currently run in a managed datacenter, with only a few operating in
[AWS](https://aws.amazon.com). When weighed against our goals of
immutability, automatability, and self-serviceability this physical datacenter
presence doesn't fit the bill.

The future of our infrastructure, and our applications, is **entirely in the
cloud**. The migration requires shifting workloads between datacenters with a
tiny error and downtime budget. At our size, that's many terabytes of data and
thousands of requests per second, which dictates serious upfront planning,
automation, testing, and monitoring of every facet of our environment.

Building and maintaining the infrastructure to serve a site the size of
[scribd.com](https://scribd.com) is difficult to begin with, but moving a
something this large from one datacenter to another is its own unique and
exciting problem to solve.

In subsequent blog posts we will share more about our AWS migration as we work
through it!


<h5 class="mb-3">Join Infrastructure Engineering
    <a href="{% link careers.html %}#open-positions" class="float-right monospace fs-md fw-normal no-underline">
        View All <span class="visually-hidden">Jobs</span>
        <svg class="svg-icon"><use xlink:href="{{ '/assets/images/icons/icon-sprite.svg#arrow-right' | relative_url }}"></use></svg>
    </a>
</h5>
<ul class="card-grid card-grid-sm" id="coreinfjobs"></ul>

<a name="web"/>
### Web

Scribd serves a significant amount of traffic to desktop and mobile web
users, for both platforms code size, speed, and aesthetics play a major role in our
success. We carefully deliver new features via experiments, also known as A/B
tests, giving developers a safe path to validate improvements at our tremendous
scale.

Looking forward to 2020, we are going to increase the number, velocity, and
diversity of our experiments. To accommodate these new and different
experiments, our codebase must be nimble, cohesive, and easy to test. We're
building a strong foundation of re-usable [React](https://reactjs.org/) 
components, styles, and utilities for use in everyday product development.

As part of our increased shift into AWS, the web team has the opportunity to
build and deploy [Micro-Frontend](https://micro-frontends.org/)-style Single
Page Applications. Our current web architecture is fairly monolithic with a
React frontend, and a [Ruby on Rails](https://rubyonrails.org/) backend. We're
trending towards backends composed of microservices, with frontends accessing data via
[GraphQL](https://graphql.org/).

Improving web applications visited by 300+ million visitors every month
requires thoughtful design, development, and deployment; that's what the web
team at Scribd does.


<h5 class="mb-3">Join the web team
    <a href="{% link careers.html %}#open-positions" class="float-right monospace fs-md fw-normal no-underline">
        View All <span class="visually-hidden">Jobs</span>
        <svg class="svg-icon"><use xlink:href="{{ '/assets/images/icons/icon-sprite.svg#arrow-right' | relative_url }}"></use></svg>
    </a>
</h5>
<ul class="card-grid card-grid-sm" id="webjobs"></ul>

<a name="cplat"/>
### Data Platform and Engineering

Data is an integral part of building Scribd, whether behavioral, relational, or
natural language data, it is all valuable to the organization. Our data
platform is in a state of transition: moving away from strictly
[ETL](https://en.wikipedia.org/wiki/Extract%2C_transform%2C_load)-style batch
processing, towards more stream and real-time processing. Data is no longer
solely the domain of the analyst, it is increasingly transformed and pumped
back into _live_ applications.


The future of our data platform and data engineering teams revolves around the
[Real-time Data Platform](/blog/2019/real-time-data-platform.html). An
ambitious project aiming to provide a streaming data platform for collecting
and acting upon both behavioral data and events in near real-time, enabling
immediate reaction to changing user needs by Scribd's applications.

The underlying question of "how can we improve our applications with real-time
data" evokes a number of promising answers, which we will answer in the next
6-12 months.

Our batch processing won't disappear in the future, but it will get faster and
easier to work with. As the size of our library and user base have grown,
manually curated and maintained data sets have become a drag. Tools to
improve partitioning, compression, and organization of our data are all
starting to be deployed in our data platform.

The next 12 months are filled with interesting projects and challenging
problems, making now the best time yet to work on our data platform and
engineering.

<h5 class="mb-3">Join Data Platform and Engineering
    <a href="{% link careers.html %}#open-positions" class="float-right monospace fs-md fw-normal no-underline">
        View All <span class="visually-hidden">Jobs</span>
        <svg class="svg-icon"><use xlink:href="{{ '/assets/images/icons/icon-sprite.svg#arrow-right' | relative_url }}"></use></svg>
    </a>
</h5>
<ul class="card-grid card-grid-sm" id="cplatjobs"></ul>
<ul class="card-grid card-grid-sm" id="datasciencejobs"></ul>

<a name="mobile"/>
### Mobile Engineering

For many users their portal to literature is their smart phone or tablet, where
we strive to give Scribd users the best reading and listening experiences
available. We're quite proud of our Android and iOS apps but we also have plans
to dramatically improve their size, platform integration, and performance in
the next year.

We already use [Swift](https://swift.org/) and
[Kotlin](https://kotlinlang.org/) on their respective platforms, but in 2020
we're going even further. On iOS we're writing all new code in Swift, and
proactively removing Objective-C code so we can shift as many runtime problems to
compile-time as possible. For Android, we're also writing new code in
Kotlin and investing in cleaner architecture patterns which will allow us to
adapt more readily to upstream changes in the Android platform.

Our mobile applications allow users to take an enormous library with them
wherever they go, and we're continuing to make Scribd a delight for mobile
users.

<h5 class="mb-3">Join Mobile Engineering
    <a href="{% link careers.html %}#open-positions" class="float-right monospace fs-md fw-normal no-underline">
        View All <span class="visually-hidden">Jobs</span>
        <svg class="svg-icon"><use xlink:href="{{ '/assets/images/icons/icon-sprite.svg#arrow-right' | relative_url }}"></use></svg>
    </a>
</h5>
<ul class="card-grid card-grid-sm" id="androidjobs"></ul>
<ul class="card-grid card-grid-sm" id="iosjobs"></ul>

---


The technology work ahead is interesting, challenging, and ambitious but with a global
team of extremely talented developers, designers, data scientists, and
managers, it is _doable_. We could always use a few [more talented
people](/careers/) though!

We are big fans of the written and spoken word here at Scribd, and we're
looking forward to you joining us to build the largest library in history.



<script type="text/javascript">
<!--
    window.onload = () =>{
        renderJobs(document.getElementById('webjobs'), 'Web Development', 2);
        renderJobs(document.getElementById('cplatjobs'), 'Core Platform', 2);
        renderJobs(document.getElementById('coreinfjobs'), 'Core Infrastructure', 2);
        renderJobs(document.getElementById('datasciencejobs'), 'Data Science - San Francisco', 2);
        renderJobs(document.getElementById('androidjobs'), 'Android', 2);
        renderJobs(document.getElementById('iosjobs'), 'iOS', 2);
    };
-->
</script>
