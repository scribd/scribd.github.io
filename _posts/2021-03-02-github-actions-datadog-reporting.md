---
layout: post
title:  "Unifying developer velocity metrics in Datadog with GitHub Actions"
author: ajhofmann
tags:
- monitoring
- datadog
- featured
team:
- Developer Platform
- Internal Tools
---

At Scribd we have a wide variety of projects and repositories that our developers work on everyday. The Internal Tools team is dedicated to creating tooling and automation that empowers developers to deliver code as swiftly as possible. A standardized and unified method to report metrics around developer velocity and CI/CD is therefore key to being able to identify areas for improvement and measure success in improving developer workflows.

### GitHub Actions

[GitHub Actions](https://github.com/features/actions) offers a CI/CD solution to build, test and deploy code directly in GitHub. One of the key features of GitHub Actions is the ability to create an open source action that can be easily used by any other GitHub Actions workflow in a few lines. The current actions on the market range from installing languages like [Ruby](https://github.com/ruby/setup-ruby), [posting messages to Slack](https://github.com/abinoda/slack-action) and all sorts of other [awesome things](https://github.com/sdras/awesome-actions). Some actions provide the ability to report [custom datadog metrics](https://github.com/marketplace/actions/datadog-action) from a workflow, however there weren't any actions that automatically collected, formatted and reported development or developer velocity metrics to Datadog.

### Datadog Reporting in GitHub Actions

Without a solution on the [GitHub Actions marketplace](https://github.com/marketplace?type=actions) to accomplish what we wanted, the Internal Tools team created a GitHub Action that could be used across all of Scribd’s projects and teams to report metrics that give us a view of how fast we are able to deliver from the organization level all the way down to specific projects.

With our now published [open source GitHub Action](https://github.com/scribd/github-action-datadog-reporting) we provide the ability for a quick lightweight job to be added to the end of any GitHub workflow that reports the duration of every job and the entire duration of the workflow directly to [Datadog](https://www.datadoghq.com/). The action can also be integrated into a standalone workflow that calculates and reports how long pull requests take to open, how many lines are changed, and how long the pull request takes to move from open to merge.

Additionally, all of the metrics are automatically tagged by the Action with information such as whether the durations are from passed or failed jobs, as well as the repository, workflow and job that the durations correspond to. This information allows us to create fully customizable Datadog dashboards that can focus on the velocity of the organization, a single team, a project and even a single job in the workflow.

### Putting the Data to Use

Going forward, these unified metrics across the projects will enable the Internal Tools team to identify potential areas of slow down for developers at Scribd, and measure the success of our efforts to enable developers to ship clean and correct code as efficiently as possible.

When all metrics are reported using the same prefix to Datadog, we can leverage tags and templates to easily make dashboards of any scope, from tracking the organization's velocity, all the way down to that of a single project or workflow. When not filtering anything we can see the developer velocity events across all installed projects:

<img src="/post-images/2021-03-github-datadog/all-velocity-metrics.png" alt="Three graphs showing the data for time to merge and open pull requests, and lines changed per pull request"/>


The time to merge metrics supports tags for team and repository, and so we can easily add filters based on the tags for any single tag or combination of tags.

<img src="/post-images/2021-03-github-datadog/team-time-to-merge.png" alt="The Tools teams time to merge graph"/>

One of the key features of the action is tracking job and workflow timing.

<img src="/post-images/2021-03-github-datadog/bad-workflow.png" alt="A graph showing significant inrease in workflow duration"/>

<img src="/post-images/2021-03-github-datadog/good-workflow.png" alt="A graph showing a stable or decreasing workflow duration"/>

The above graphs represents workflow runtime data collected from two different projects. By filtering the reports using the project and workflow tag, we can watch the workflows for any trends that might be slowing down the workflow and track when the issue started and how significant it is. In the above example it looks like the “First Workflow” is having some performance issues, so let’s break the job duration metric down by the jobs in the workflow.

<img src="/post-images/2021-03-github-datadog/job-comparison.png" alt="Four graphs showing job duration, with one showing a significant recent increase"/>

Looking at the job breakdown makes it very clear where our issue is, Job 3 is causing some performance issues in the workflow starting from friday morning, and will need to be fixed. Note that the above graphs have had their workflow and job names obscured for the purposes of the blog.

### Into the Future

With the GitHub Action published on the public marketplace, Scribd will continue to integrate the action across it’s projects for increased monitoring and issue tracking. The code is now [open sourced and available on GitHub](https://github.com/scribd/github-action-datadog-reporting) and contributions are welcome.

 If you would like to join the Internal Tools team or Scribd on our journey then take a look at our careers page.
