---
layout: post
title: Zooming out to Platform Engineering at Scribd
author: rtyler
tags:
- scribd
- dataeng
- data
team: Core Platform
---

> **Editors note:** *This is a cross-post from Tyler's [personal blog](https://brokenco.de/2019/08/22/platform-engineering-at-scribd.html)*


The team that I joined [Scribd](https://scribd.com) to build, [Core
Platform](/blog/2019/scribd-core-platform.html) is now up and running with
five incredibly talented people. I could not be more pleased with the very
friendly and highly functional group of people we have been able to assemble.
With that team's projects underway, my focus has been shifting, zooming out
to "Platform Engineering" as a comprehensive part of the engineering
group. In this post, I want to expand on what Platform Engineering is planned
to be and discuss some of the teams and their responsibilities.

I was hired as the "Director of Platform Engineering", which at the time was an
especially ostentatious title considering an entire group didn't yet exist. It
was so wacky that "Director" has been something I'm almost ashamed to
reference. It is not in my email signature and it doesn't show up in Slack; I
don't want it to interfere with my ability to discuss ideas or hack on
something with my colleagues. The role did however have intent behind it: for
me to focus on growing the organization. A big challenge which I'm fastidiously
working towards addressing. As currently scoped the teams which compose
Platform Engineering are:

* **Core Platform**, provides foundational infrastructure to help Scribd scale
  applications and data.
* **Data Engineering**, treats data as a product, ensuring that high quality
  data sets are accessible to internal users.
* **Ruby Infrastructure**, helps Scribd adopt or upstream major ecosystem changes
  which will improve organizational and operational performance of Ruby and
  Rails.

Defining the scope and charters for these team has been a rather interesting
exercise. Figuring out with the Infrastructure, Data Science, and Internal
Tools teams where the edges of our respective responsibilities lie is one of
those good healthy debates every organization should have as it grows. A year
ago much of engineering was flat with lots of generalists, compare that to
today where both Product and Engineering groups are learning that
specialization when appropriately applied can be quite helpful.

What has also been personally challenging about hiring in Data Engineering is
my relative inexperience in the field. My jam has always been backend service
infrastructure. Across the industry we're seeing data infrastructure melt
into backend production infrastructure. Scribd is no different, but we have a
lot of work to do, changing from a mindset of "dumping in the data lake" to
where Product and other parts of Engineering are viewing data as a more
integral part of their work. Both in generating clean data but also by
utilizing derived data sets to make more personalized or responsive user
experiences.

The barriers between "data platform" and "production engineering" remind me of
the now outdated silos between application developers and operations engineers.
I'm not sure what to call it, DevDataOps? Maybe DataDevOps?

I'll have to figure out the hashtag later.

Anyways, like Core Platform, Data Engineering and Ruby Infrastructure are also
intended to be fully remote teams. I maintain that it is better to hire the
best people available rather than the best people "around here." Hiring
remotely forces the organization to confront all of the collaboration and
communication problems that many growing companies ignore until it's too late.
Recording meeting notes, sharing knowledge, pair problem solving, capturing
decisions, discussing project roles and responsibilities, all of these are crucial for
effective remote work and they are all unsurprisingly qualities of effective
colocated teams too.

The work we have done thus far in Core Platform I believe sets a strong
precedent for other teams within Platform Engineering and outside of it. We
have patterns of work defined and documented, which will make each successive
remote team we hire at Scribd that much easier to get up and running.


While we're hiring across the board (who isn't) the folks I am specifically
hiring for are:

* **Core Platform**
  * [Application Platform
Engineer](https://jobs.lever.co/scribd/78b89735-e4f7-4f44-985e-e028bfca5698)
  * [Data Platform
Engineer](https://jobs.lever.co/scribd/ee84d062-19e8-47aa-9403-1935daae70ff)
* **Data Engineering**
  * [Data Engineering
Manager](https://jobs.lever.co/scribd/7a9e16c6-9cb3-48a0-bf82-2e405a596fcd)
  * [Data
Engineer](https://jobs.lever.co/scribd/46a9ef46-d214-483d-be09-f811c8b19127)
* **Ruby Infrastructure**
  * [Ruby Infrastructure
Engineering](https://jobs.lever.co/scribd/6fff482b-6363-4525-b6b0-6131d6994eef)


We're also hiring an [Infrastructure Team
Manager](https://jobs.lever.co/scribd/d5aa5ade-e520-4c63-947c-d48bee5e748d)
who I would be working heavily with.


If you're curious about these roles, or Platform Engineering type things,
please email me: rtyler at scribd.com

If you're not curious about those roles, but want to share thoughts on remote
engineering, you can also email me for that too! At some  point I want to
write down all the patterns and practices I have learned, adopted, or stopped
using over the past five years for building successful remote engineering
organizations. That idea is pending a surplus of spare time which isn't _currently_
in the budget however. :)

---

I have been afforded a lot of leeway by my boss to publicly discuss not only
the projects that we're working on, but a bit of the work we're doing behind
the scenes. Over the coming months I'm looking forward to sharing even more
about what scaling up an organization like Scribd requires, where we've failed,
and where we're succeeding.
