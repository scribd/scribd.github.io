---
layout: post
title:  "Speeding up ECS Fargate deployments"
author: nakulpathak3
tags:
- aws
- deploys
- featured
team: Internal Tools
---

Scribd moved its monolith to AWS in April 2020 and as part of the migration, we had to design and implement a deployment pipeline for our new (and *shiny*) [ECS Fargate](https://aws.amazon.com/fargate/) infrastructure. In this post, we'll share how we improved our deployment speeds from ~40 minutes to less than 20 minutes.

### Original Implementation

Our starting implementation involved a few steps:
- Deploying assets via [Capistrano](https://capistranorb.com/) to our asset-hosting servers *(2.5 minutes)*
- Executing a Fargate task to run any database migrations *(3 minutes)*
- Restarting and waiting on ~500 Fargate tasks via the AWS CLI *(32-35 minutes)*

### Improvements

#### Fargate Service Updates
By far, the slowest part of our deployment was waiting for ECS services to finish updating. We use the default rolling deployment which stops and starts tasks to trigger a re-pulling of the freshly-uploaded [ECR](https://aws.amazon.com/ecr/) image. Here are some changes we implemented -

* **Docker Image Size Reduction** - The first thing everyone thinks of when considering ECS Fargate speedups is how to reduce the image pull time since Fargate (unlike EC2) [has no image caching](https://github.com/aws/containers-roadmap/issues/696). However, unless you can drastically reduce your image size (think 1Gb to 100Mb), this will not lead to significant time reductions. We reduced our compressed image size from ~900Mb to ~700Mb and it led to **little to no improvement**. It did lead to a cleaner image but that wasn't our initial goal.

* [**Deregistration Delay**](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html#deregistration-delay) - This is a property on a load balancer's target group that dictates how long a task stays in *Draining* state after it stops receiving requests. We looked at Datadog APM for the p99 of our longest running request and set the delay to 17s from the **default of 300s**. This reduced service refreshes to ~22 minutes.

* **ECS Throttling** - During deployments, we investigated the "Events" tab of our main web ECS service. There were events with the following messages -
  - *"service production-web operations are being throttled on elb. Will try again later."*
  - *"service production-web operations are being throttled. Will try again later."*

  Due to Scribd's high Fargate task volume, the number of start and stop requests we were making was too high for AWS' default limits. We opened support tickets with the ELB and Fargate teams to get those limits increased. This further reduced service deploy time to 16-18 minutes.

* **Network Load Balancer Health Checks** - From testing in staging, we noticed that reducing our network load balancer's [health-check intervals and thresholds](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/target-group-health-checks.html) helped reduce staging deploy time from ~9 to ~6 minutes. However, it only translated to 1-2 minutes saved in production with much higher number of ECS tasks. You do want to be careful with the value to avoid false-positive health checks and keep in mind that updating these values requires re-creation of the ECS service the load balancer points to.

#### Asset Deployment Improvements
Our asset deployments were run using Capistrano. The job `ssh`-ed onto our asset servers, ran a series of [Rake tasks]((https://guides.rubyonrails.org/v4.2/command_line.html#rake)) to download, unzip, and correctly place assets. There were some issues with this approach -
* Dependency on Capistrano gem forced us to use the monolith Docker image as the job's base image
* Running Rake tasks required loading the application which adds time to the job
* Our ECS service refresh job runs `docker push/pull` tasks to upload the latest image to ECR. This forced us to have separate jobs for asset and service deployments to avoid adding a Docker dependency to the monolith image.

To resolve these issues, we decided to remove Capistrano & Rake as dependencies and wrote pure Ruby and Bash code to perform the tasks. This unified the two jobs and brought asset deploy time from 2.5 minutes to 30s.

#### Database Migration
In our case, running a database migration task in Fargate involved starting a new task instance of our `database_migration` task family. Due to Fargate startup slowness, this task would take 3 minutes to run a simple `bundle exec rails db:migrate`.

To resolve this, we used `git` and [Gitlab environments](https://docs.gitlab.com/ee/api/environments.html#get-a-specific-environment) to look for modified files in the `db/migrate` directory. If none were found, we would skip running the migration task. Since majority of our deployments don't run database migration tasks, this shaved off 3 minutes from most jobs.
```
env_json=$(curl --silent --header "PRIVATE-TOKEN: <your_access_token>" "<gitlab-repository-path>/environments/<id>")
last_deployment_sha=$(echo $env_json | jq -r '.last_deployment.sha')
git diff --name-only $CI_COMMIT_SHA $last_deployment_sha | grep db/migrate
```

#### Other things to look for
If you run sidecar containers like Datadog, make sure that you're providing enough memory and CPU to those containers to avoid waiting on them to be ready while your main container has already started.


We hope this helps you speed up your deployments and gain greater efficiency!
