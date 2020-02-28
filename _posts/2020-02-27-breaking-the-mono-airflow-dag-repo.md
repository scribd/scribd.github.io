---
layout: post
title: "Breaking the mono Airflow DAG repo"
author: qphou
tags:
- airflow
- featured
- datapipe
team: Core Platform
---

Hopefully you are using some kind of version control system to manage all your
Airflow DAGs. If you are, then it’s very likely that all your DAGs are managed
in one single repository.

Mono DAG repo is simple and easy to operate to start with. But it’s not hard to
see that it doesn’t scale well as number of DAGs and engineers grows.

In this post, I would like to share what Scribd’s Core Platform team did to
bring multi repo DAG development a reality to Airflow.


## Delivering DAGs

Every Airflow component expects all the DAGs to present in a local DAG folder
through a filesystem interface. There are 3 common approaches to meet this
requirement:

* Bake DAGs into Airflow docker image
* Sync DAGs to a networked file system like NFS and mount it as Airflow’s DAG
folder
* Pull DAGs from the network into a local file system before starting Airflow
components

Each of the above approaches comes with its own trade-offs. Baking DAGs into
Airflow images makes DAG deployment slow because you need to rebuild and
release the new Airflow image for every DAG change. Managing a networked
file system for DAG sync seems like an overkill from a performance and operation
point of view given that Airflow only requires read access.

We decided to go with the pulling model. By leveraging AWS S3, we can have a
high uptime guarantee for our DAG store. We also made this whole process
transparent to Airflow by running
[objinsync](https://github.com/scribd/objinsync) [^1], a stateless DAG sync daemon,
as a sidecar container. From Airflow’s point of view, the DAG folder is just a
magical local folder that always contains the up to date DAG definitions
assembled from multiple Git repos.


## The full CI/CD pipeline

To demonstrate how the whole setup works end to end, I think it’s best to walk
through the life cycle of a DAG file.

As shown below, S3 DAG bucket is acting as the bridge between Git repos and
Airflow:

![Using S3 as the bridge](/post-images/2020-03-airflow/s3-as-bridge.png)

All CI/CD pipelines will publish their own DAG files into the same S3 bucket
namespaced by the repo name. On the other end, objinsync[^1] deployed for each
Airflow component will pull the latest DAG files into local file system for
Airflow to consume.

Zooming out to the full picture, all DAG updates go through a multi-stage
testing and promotion process before they eventually land in the production DAG
S3 bucket:

![DAG release pipeline](/post-images/2020-03-airflow/dag-release-pipeline.png)

This gives our engineers the ability to test out changes without worrying about
impacting production data pipelines.

Lastly, to simplify CI/CD setup, we built a small command line tool in Go to
automate DAG to S3 release process. For any repo’s CI/CD pipeline, all an
engineer has to do is adding a single step that runs the following command:

```
airflow-dag-push [dev,staging,production]
```

The airflow-dag-push tool will automatically scan for DAG files in a special
folder named `workflow` under the root source tree and upload them to the right
S3 bucket with the right key prefix based on the provided environment name and
environment variables injected by the CI/CD system.


## Implementation details

Our airflow clusters are orchestrated using both ECS fargate and EKS. ECS is
used to run Airflow web server and scheduler while EKS is what’s powering
Airflow’s Kubernetes executor. Due to differences in different Airflow
components, we need to run objinsync[^1] binary in two container orchestration
platforms with slightly different setups.

For daemon Airflow components like web server and scheduler, we run
objinsync[^1] in a continuous sync mode where it pulls incremental updates from
S3 to local filesystem every 5 seconds. This is implemented using sidecar
container pattern. The DAG folder is mounted as a shared volume between the
Airflow web/scheduler container and objinsync[^1] container. The sidecar
objinsync container is setup to run the following command:

```
/bin/objinsync pull s3://<S3_DAG_BUCKET>/airflow_home/dags <YOUR_AIRFLOW_HOME>/dags
```

For other components like task instance pod that runs to completion, we run
objinsync[^1] in pull once mode where it only pulls the required DAG from S3 once
before the Airflow component starts. This is implemented using Airflow K8S
executor’s builtin git sync container feature. We are effectively replacing git
invocation with objinsync[^1] in this case.

```
Environment variables for Airflow scheduler:

AIRFLOW__KUBERNETES__GIT_REPO=s3://<S3_DAG_BUCKET>/airflow_home/dags
AIRFLOW__KUBERNETES__GIT_SYNC_DEST=<YOUR_AIRFLOW_HOME>/dags
AIRFLOW__KUBERNETES__GIT_SYNC_ROOT=<YOUR_AIRFLOW_HOME>/dags
AIRFLOW__KUBERNETES__GIT_SYNC_CONTAINER_REPOSITORY=<DOCKER_REPO_FOR_GIT_SYNC_CONTAINER>
AIRFLOW__KUBERNETES__GIT_SYNC_CONTAINER_TAG=<DOCKER_TAG_FOR_GIT_SYNC_CONTAINER>
AIRFLOW__KUBERNETES__GIT_SYNC_RUN_AS_USER=0
AIRFLOW__KUBERNETES__GIT_DAGS_FOLDER_MOUNT_POINT=<YOUR_AIRFLOW_HOME>/dags
# dummy branch value to stop Airflow from complaining
AIRFLOW__KUBERNETES__GIT_BRANCH=dummy


Entry point for the git sync container image:

/bin/objinsync pull --once "${GIT_SYNC_REPO}" "${GIT_SYNC_DEST}"
```

Objinsync[^1] is implemented in Go to keep memory footprint very low. It also means
the synchronization code can leverage the powerful parallelism and concurrency
primitives from Go runtime for better performance.


## Take away

Engineering is all about making the right trade-offs. I won’t claim what we have
is the perfect solution for everyone, but I do believe it strikes a good
balance between productivity, operability and availability. If you have any
question regarding the setup, I am available in Airflow’s
[#airflow-creative](https://apache-airflow.slack.com/messages/airflow-creative)
slack channel under the handle QP. You can get access to the slack workspace
through [this link](https://apache-airflow-slack.herokuapp.com/).

This is the second blog post from our series of [data pipeline
migration](https://tech.scribd.com/blog/2020/modernizing-an-old-data-pipeline.html)
blog posts. If this sounds interesting to you, the Core platform team is
hiring!

Come join us if you love building scalable data/ML platforms using open source
technologies. :)


[^1]: Ojinsync is a generic S3 to local file system sync daemon [open sourced](https://github.com/scribd/objinsync) by scribd.
