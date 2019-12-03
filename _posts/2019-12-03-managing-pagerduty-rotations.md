---
layout: post
title: "Assigning pager duty to developers"
author: hamiltonh
tags:
- oncall
- pagerduty
- incident response
team: Core Platform
---

Nobody likes to be woken up in the middle of the night, but if you've got to do
it, make sure you pick the right person. Scribd has long used
[PagerDuty](https://pagerduty.com) for managing on-call rotations, but only
within the "Core Infrastructure" team. All production incidents were routed to
a single group of infrastructure engineers. Clearly not a good idea. To help
with our migration to AWS, we recognized the need to move to a more
_distributed_ model of incident response, and the Core Platform team ended up
being a suitable test subject.


The idea of transitioning from "nobody is on-call" to "everybody is on-call"
originally seemed too harsh, but we needed to ensure that dreaded production
alerts would end up going to the developers who would be best suited to resolve
the problem. We decided on a compromise: a "day-shift" for our on-call
rotations which would route directly to developers unfamiliar with the rigors
of production incident response. All the while, we still planned on relying on
the Core Infrastructure team's existing rotation to fill in the gaps, covering
the "night shift."


## Trying it out

Getting everyone on board with the day/night shifts was the easy part,
implementing the shifts in PagerDuty turned out far more difficult. To begin, I
created the `Core-Platform` schedule, adding all of the team members. The
schedule was built using Pagerduty's "Restrict On-Call Times" in order to
restrict the schedule's activation, limiting it to 7:00-17:00 PST.

Next I created an "Escalation Policy" with Core Platform as the first level,
and then configuring the existing Core Infrastructure primary schedule as the
next level escalation. In essence, incidents not handled by the Core Platform
team would escalate after a timeout, such as 30 minutes, to the Core
Infrastructure team. Then, _hopefully_, somebody would act on the alert and
resolve the incident.


## Bumpy roads

Having wired the settings together for Core Platform's services as a prototype,
I shared my progress with a developer from PagerDuty; it went
_okay_. I explained the desired end-goal, and we walked through what I expected to
happen. Considering our settings, he explained that what would _actually_
happen:

* During the day, Core Platform developers would be notified when incidents
  happened.
* Outside of the day shift, there would **always** be a 30 minute delay, dead
  air, before anybody would be notified. After that 30 minute delay, the Core
  Infrastructure team would receive the alert.

Definitely not ideal.


## Hack-arounds

The PagerDuty developer and I switched gears and tried to find ways in which we
could arrive at something as close as possible to our desired end-state. We
figured out a couple options:


1. In the `Core-Platform` Schedule, add a Secondary Layer built with the
   members of the `Core-Infra` Team
    * We would get the desired effect of skipping Core Platform developers when outside of business hours.
    * This option would also put the management of part of Core
      Infrastructure's rotation into Core Platform's hands, including the
      management of explicit overrides.
1. In the `Core-Platform` Escalation Policy, add the `Core-Infra` Schedule to
   the first notification in addition to the existing `Core-Platform` Schedule.
    * This would require documented policy for engineers in Core Infrastructure
      to only respond to incidents outside of the day shift, with no automamted
      way for them to know whether they can ignore an alert until they receive it.
1. Create duplicated Services for day time vs night time, with different
   Escalation Policies to rout to different groups. Then with event rules,
   route alerts to the different services based on time of day.
    * This would create a lot of manual configuration bloat. Additionally if we
      ever needed to change anything we'd have to change it on ALL services
      running this style of escalations.
1. Keep the baked-in delayed response for night shift alerts.
    * Obviously not a good choice for situations where every minute counts!
1. Switch the Core Platform schedule to 24/7 by removing the restriction.
    * Pushes developers into new and uncomfortable positions of being on-call
      all the time, making team based escalations less appealing for adoption
      across the company.


## Back to the start


Things **will** go wrong in production. The goal for our incident response and
escalation process is to make sure that we connect problems (incidents) with
solutions (people) as quickly as possible. When we discussed the various
options with the entire team, the only clear path forward was to adopt the last
option: switch to a 24/7 schedule for the developers on Core Platform. We
shared the entire process, and conclusion  with our friends at PagerDuty. I hope that we
see a feature in the future which allows Schedules to be built from both users
_and_ other Schedules in the future. That level of composition would give us
the flexibility to accomplish our _ideal_ end-state for developer incident
response.

Until that feature arrives, we'll just be extra motivated to ensure the
stability and availability of the services we deliver on Core Platform!
