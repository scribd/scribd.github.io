---
layout: post
title: "Integrating Databricks jobs with Datadog"
author: qphou
tags:
- featured
- databricks
- datadog
- datapipe
team: Core Platform
---

Batch and streaming Spark jobs are an integral part of our data platform and
like our other production applications, we need
[Datadog](https://datadoghq.com) instrumentation. We rely on
[Databricks](https://databricks.com/customers/scribd) to power those Spark
workloads, but integrating Datadog and Databricks wasn't turn-key. In this
post, I'll share the two code snippets necessary to enable this integration: a custom cluster init script, and a special class to load into the Spark job.

Rather than relying on the Spark UI in Databricks, piping these metrics into
Datadog allows us to build extremely useful dashboards and more importantly
**monitors** for our Spark workloads that can tie into our alerting
infrastructure.


## Configuring the Databricks cluster

When creating a cluster in Databricks, we setup and configure the Datadog
agent with the following init script on the driver node:

```bash
#!/bin/bash
# reference: https://docs.databricks.com/clusters/clusters-manage.html#monitor-performance
#
# This init script takes the following environment variables as input
#   * DATADOG_API_KEY
#   * ENVIRONMENT
#   * APP_NAME

echo "Running on the driver? $DB_IS_DRIVER"

if [[ $DB_IS_DRIVER = "TRUE" ]]; then
  echo "Setting up metrics for spark applicatin: ${APP_NAME}"
  echo "Driver ip: $DB_DRIVER_IP"

  cat << EOF >> /home/ubuntu/databricks/spark/conf/metrics.properties
*.sink.statsd.host=${DB_DRIVER_IP}
EOF

  DD_INSTALL_ONLY=true \
      DD_AGENT_MAJOR_VERSION=7 \
      DD_API_KEY=${DATADOG_API_KEY} \
      DD_HOST_TAGS="[\"env:${ENVIRONMENT}\", \"spark_app:${APP_NAME}\"]" \
      bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/7.22.0/cmd/agent/install_script.sh)"

  cat << EOF >> /etc/datadog-agent/datadog.yaml
use_dogstatsd: true
# bind on all interfaces so it's accessible from executors
bind_host: 0.0.0.0
dogstatsd_non_local_traffic: true
dogstatsd_stats_enable: false
logs_enabled: false
cloud_provider_metadata:
  - "aws"
EOF

  # NOTE: you can enable the following config for debugging purpose
  echo "dogstatsd_metrics_stats_enable: false" >> /etc/datadog-agent/datadog.yaml

  sudo service datadog-agent start
fi
```

The cluster also needs to be launched with the following environment variables
in order to configure the integration:

  * `ENVIRONMENT=development/staging/production`
  * `APP_NAME=your_spark_app_name`
  * `DATADOG_API_KEY=KEY`


Once the cluster has been fully configured with the above init script, you can
then send metrics to Datadog from Spark through the statsd port exposed by the
agent. All your Datadog metrics will be automatically tagged with `env` and
`spark_app` tags.

In practice, you can setup all of this using DCS ([customized containers with
        Databricks
Container Services](https://docs.databricks.com/clusters/custom-containers.html)) as well.
But we decided against it in the end because we ran into many issues with DCS
including out of date base images and lack of support for builtin cluster
metrics.


### Sending custom metrics from Spark

Integrating Statsd with Spark is _very_ simple. To reduce boilerplate, we built
an internal helper utility that wraps `timgroup.statsd` library:


```scala
import com.timgroup.statsd.{NonBlockingStatsDClientBuilder, StatsDClient}
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.streaming.StreamingQueryListener

import scala.collection.JavaConverters._

/** Datadog class for automating Databricks <> Datadog integration.
 *
 * NOTE: this package relies on datadog agent to be installed and configured
 * properly on the driver node.
 */
class Datadog(val appName: String)(implicit spark: SparkSession) extends Serializable {
  val driverHost: String = spark.sparkContext.getConf
    .getOption("spark.driver.host")
    .orElse(sys.env.get("SPARK_LOCAL_IP"))
    .get

  def statsdcli(): StatsDClient = {
    new NonBlockingStatsDClientBuilder()
      .prefix(s"spark")
      .hostname(driverHost)
      .build()
  }

  val metricsTag = s"spark_app:$appName"

  def collectStreamsMetrics(): Unit = {
    spark.streams.addListener(new StreamingQueryListener() {
      val statsd: StatsDClient = statsdcli()
      override def onQueryStarted(queryStarted: StreamingQueryListener.QueryStartedEvent): Unit = {}
      override def onQueryTerminated(queryTerminated: StreamingQueryListener.QueryTerminatedEvent): Unit = {}
      override def onQueryProgress(event: StreamingQueryListener.QueryProgressEvent): Unit = {
        val progress = event.progress
        val queryNameTag = s"query_name:${progress.name}"
        statsd.gauge("streaming.batch_id", progress.batchId, metricsTag, queryNameTag)
        statsd.count("streaming.input_rows", progress.numInputRows, metricsTag, queryNameTag)
        statsd.gauge("streaming.input_rows_per_sec", progress.inputRowsPerSecond, metricsTag, queryNameTag)
        statsd.gauge("streaming.process_rows_per_sec", progress.processedRowsPerSecond, metricsTag, queryNameTag)
        progress.durationMs.asScala.foreach { case (op, v) =>
          statsd.gauge(
            "streaming.duration", v, s"operation:$op", metricsTag, queryNameTag)
        }
      }
    })
  }
}
```

To initializing the helper class takes two lines of code:

```scala
implicit val spark = SparkSession.builder().getOrCreate()
val datadog = new Datadog(AppName)
```

Then you can use `datadog.statsdcli()` to create statsd clients from within
both **driver** and **executors** to emit custom emtrics:


```scala
val statsd = datadog.statsdcli()
statsd.count(s"${AppName}.foo_counter", 100)
```

**Note:** : Datadog agent flushes metrics on a [preset
interval](https://docs.datadoghq.com/developers/dogstatsd/data_aggregation/#how-is-aggregation-performed-with-the-dogstatsd-server)
that can be configured from the init script. By default, it's 10 seconds. This
means if your Spark application, running in a job cluster, exits immediately
after a metric has been sent to Datadog agent, the agent won't have enough time
to forward that metric to Datadog before the Databricks cluster shuts down. To
address this issue, you need to put a manual sleep at the end of the Spark
application so Datadog agent has enough time to flush the newly ingested
metrics.


### Instrumenting Spark streaming app

User of the Datadog helper class can also push all Spark streaming progress
metrics to Datadog with one line of code:

```scala
datadog.collectStreamsMetrics
```

This method sets up a streaming query listener to collect streaming progress
metrics and send them to the Datadog agent. All streaming progress metrics will
be tagged with `spark_app` and `query_name` tags. We use these streaming
metrics to monitor streaming lag, issues with our batch sizes, and a number
of other actionable metrics.

And that’s it for the application setup!

---

In the future a more "native" integration between Databricks and Datadog would
be nice, but these two code snippets have helped bridge a crucial
instrumentation and monitoring gap with our production Spark workloads. Hopefully you find them useful!
