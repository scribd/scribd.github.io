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

When creating the cluster in Databricks, we use the following init script-based
configuration to set up the Datadog agent. It also likely possible to set this
up via [customized containers with Databricks Container
Services](https://docs.databricks.com/clusters/custom-containers.html) but the
`databricks` runtime images don't get updated as frequently enough for our
purposes.

* Add cluster init script to setup datadog below
* Set following environment variables for the cluster:
  * `ENVIRONMENT=development/staging/production`
  * `APP_NAME=your_spark_app_name`
  * `DATADOG_API_KEY=KEY`

All your Datadog metrics will be automatically tagged with `env` and `spark_app` tags.


```bash
#!/bin/bash
# reference: https://docs.databricks.com/clusters/clusters-manage.html#monitor-performance
#
# This init script takes the following environment variables as input
#   * DATADOG_API_KEY
#   * ENVIRONMENT
#   * APP_NAME

echo "Setting up metrics for spark applicatin: ${APP_NAME}"
echo "Running on the driver? $DB_IS_DRIVER"
echo "Driver ip: $DB_DRIVER_IP"

if [[ $DB_IS_DRIVER = "TRUE" ]]; then
  cat << EOF >> /home/ubuntu/databricks/spark/conf/metrics.properties
*.sink.statsd.host=${DB_DRIVER_IP}
EOF

  DD_INSTALL_ONLY=true \
      DD_AGENT_MAJOR_VERSION=7 \
      DD_API_KEY=${DATADOG_API_KEY} \
      DD_HOST_TAGS="[\"env:${ENVIRONMENT}\", \"spark_app:${APP_NAME}\"]" \
      bash -c "$(curl -L https://raw.githubusercontent.com/DataDog/datadog-agent/7.20.0-rc.10/cmd/agent/install_script.sh)"


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

Once the cluster has been launched with the appropriate Datadog agent support,
we must then integrate a Statsd client into the Spark app itself.

### Instrumenting Spark

Integrating Statsd in Spark is _very_ simple, but for consistency we use a
variant of the `Datadog` class listed below. Additionally, for Spark Streaming applications,
the `Datadog` class also comes with a helper method that you can use to forward
all the streaming progress metrics into Datadog:

```scala
datadog.collectStreamsMetrics
```

By invoking this method, all streaming progress metrics will be tagged with `spark_app` and `label_name`
tags. We use these streaming metrics to understand stream lag, issues with our
batch sizes, and a number of other actionable metrics.

And that’s it for the application setup!


```scala
import com.timgroup.statsd.{NonBlockingStatsDClientBuilder, StatsDClient}
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.streaming.StreamingQueryListener

import scala.collection.JavaConverters._

/** Datadog class for automating Databricks <> Datadog integration.
 *
 * NOTE: this package relies on datadog agent to be installed and configured
 * properly on the driver node.
 *
 * == Example ==
 * implicit val spark = SparkSession.builder().getOrCreate()
 * val datadog = new Datadog(AppName)
 * // automatically forward spark streaming metrics to datadog
 * datadog.collectStreamsMetrics
 *
 * // you can use `datadog.statsdcli()` to create statsd clients from both driver
 * // and executors to emit custom emtrics
 * val statsd = datadog.statsdcli()
 * statsd.count(s"${AppName}.foo_counter", 100)
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

**Note:** : There is a known issue for Spark applications that exits
immediately after an metric has been emitted. We still have some work to do in
order to properly flush metrics before the application exits.

---

In the future a more "native" integration between Databricks and Datadog would
be nice, but these two code snippets have helped bridge a crucial
instrumentation and monitoring gap with our production Spark workloads. Hopefully you find them useful!
