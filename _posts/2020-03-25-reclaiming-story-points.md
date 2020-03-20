---
layout: post
title: "Reclaiming Story Points"
tags:
- featured
- agile
team: Technical Project Management
author: lbuschbaum
---

Scribd has been in an agile transition for two years now and as we iterate and
improve with company growth we have needed to reevaluate a number of practices
such as utilizing **story points**.

[Story points](https://agilefaq.wordpress.com/2007/11/13/what-is-a-story-point/) in agile are a way of estimating how much work something is. They
are deliberately _not_ exact functions of difficulty and time because you never
know all the complications when you start a project. Even something as simple
as making dinner can get tripped up by a missing ingredient or a dirty pot, so
too can software delivery. The issue that we ran into is that we rolled it out with an
early set of folks who were clear on it and how to use it but we didn't
socialize that change both across the organization and upwards.

It's very easy to say 'that's 8 points' and hard to translate that out into a
meeting where we cover all the projects in flight with a target and actual done
date attached to it. Business gets attached to those dates and makes plans
using them and then a team comes back with a slip and suddenly everyone is
upset. The team is upset because they knew that 8 points was an estimate that
accommodated a period of time in which they could deliver. Management is upset
because things slipped and now they feel things are late when that was never
really going to be the time anyway.

<center>
<img src="/post-images/2020-03-story-points/stop.png" alt="Stop!" align="center"/>
(<em><a href="https://publicdomainvectors.org/en/free-clipart/Stop-speech-bubble/82516.html" target="_blank">source</a></em>)
</center>

So story points got banned from the management meeting. Project managers could
now only speak to deadline dates and added language that mentioned things like
'best estimate' and 'could slip' to hedge around the fact that software
development isn't an exact science as much as we would like it to be. We still
talked about them and used them in the team meetings but it was a verboten term
outside that space which led to its own tensions. 

One of the related reasons story points got banned was the nature of the
imprecision. Yes, points should be specific to the team but our velocity was
completely unpredictable from team to team. Sometimes it would be 20 points and
others 50. Regression passes were sometimes included and pointed, sometimes
they weren't. It started with a team of more junior developers and QA that had
one of the aforementioned velocity issues. We asked them how big a 3/5/8 was
and got a different answer from each of them. We had found the underlying
problem that had given story points a bad name.

It was time to go back to basics. We had a story pointing workshop with that
team that already had strong communication and was a safe space to talk through
in the retrospectives why they were all over the map. Some of it was because
they were more junior and were less likely to know where the problems were in
the code base but some of it was because we had just assumed that everyone knew
what a 5 might entail. An hour later we had a white-board covered in notes with
items under each number in the Fibonnaci sequence. Items that included things
from each of the developers, QA and the chapter lead (in this case a senior
technical developer). We did it again with the entire mobile QA team, sharing
some of the findings after we first did the brainstorm fresh, sharing where
that team had seen points falling. It turned into a wiki page that was shared
within the project management team and spread from there. 

<center>
<img src="/post-images/2020-03-story-points/efforts.png" alt="Different efforts are different!" align="center"/>
(<em><a href="https://www.slideshare.net/arkanaan/agile-relative-sizing-v2" target="_blank">source</a></em>)
</center>

We were clear throughout this process that points were still team specific and
that none of this was to be taken as hard and fast rules but it gave teams a
place in which to start the conversation and have common ground. We don't want
to make it sound like all the teams were terrible at pointing or having
reliable velocity but the variability often exceeded 10% which made it hard for
management to show trust in our date estimates. It became easier for teams to
have more accuracy which led to more trust in deadlines which in turn led to a
way where we could talk about story points again.

When the deadlines shifted to being reliable within a day or two it was less
charged of a conversation to mention that we'd done a good breakdown on the
work and it was reflected in Jira that way. We do a project lifecycle that
starts with a product brief, goes through design iterations, and then goes into
story breakdown and sizing. Only after those steps are done do we 'put hands on
keyboard' and start writing software. It turns out people really do need time
to think through the problem before solving it. Again, this isn't perfect. We
still have tech debt and brittle code. We will always have people who under or
over estimate work - which is why we use points.

With bringing in words like velocity and showing that over time teams were
getting more reliable in their estimates we were able to show management that
the method was worth trusting and we were again able to use the term story
points in our meetings with them. The reaction to the phrase early on was
justifiable from the point of view and what we did to fix the underlying issue
led to us being able to reclaim it.
