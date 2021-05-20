---
layout: post
title: "Enter kafka-delta-ingest"
tags: 
- featured
- rust
- deltalake
- kafka
author: christianw
---

This scenario is likely fairly relatable to a lot of folks:

* I'm using Kafka to ingest data from my application that I want to analyze later.
* I want my Kafka data to land in my data warehouse and be queryable pretty soon after ingestion, but I'm fine with some seconds or minutes worth of latency before data lands in my warehouse and becomes queryable.
* I haven't found a blog post or O`Reilly book excerpt yet that makes me feel super confident about my current approach for moving my Kafka streams into my data warehouse. Things I've tried so far _work_ but either cost a lot, are really complicated to setup and maintain, or both.


Scribd is in exactly this position. We use Spark Structured Streaming jobs running in Databricks to write data ingested on Kafka topics into Delta Lake tables. Our monthly AWS bill keeps reminding us that there _should_ be a better solution for this common ETL need.

Spark Structured Streaming is a powerful streaming framework that can easily satisfy the pipeline described above with a few lines of code (about 70 very narrow lines in our case), but the cost profile is pretty high and it isn't auto-scale friendly. Our current ETL solution for moving data from our 40ish Kafka topics to our data warehouse relies on several Databricks streaming jobs with no auto-scaling (because auto-scaling doesn't really work for Databricks streaming jobs). These jobs are hosted in Databricks and run 24x7. Every once in a while, a job will fail with an obscure stack trace that doesn't really point to anything actionable on our side. Our streaming jobs recover just fine and preserve correctness, but the alerts are a bit obnoxious. 

The lack of effective auto-scaling support for Databricks streaming jobs is annoying too. We have peaks and valleys in our ingestion streams. We'd love to be able to scale out to handle extra load dynamically and scale back in to save some dollars. We'd also love to handle long-term growth organically and transparently without having to push new configuration.

Kafka Delta Ingest is an open source application developed at Scribd with the very specific goal of optimizing for this use case and removing the pain points we currently experience with our Databricks streaming jobs. Its written in Rust so the runtime is super efficient. Its fully distributed with no coordination between workers (no driver node hanging out). And it _only_ supports a very specific use case, so errors are clear and actionable.

The cost profile for a set of ECS services running Kafka Delta Ingest tasks to handle the ETL for our topics is much lower than the Databricks streaming job solution. Kafka Delta Ingest does not have nearly the same flexibility that a Spark Structured Streaming application would provide, but _we don't care_. Without Kafka Delta Streams, we use the same jar to handle all of our topics with Databricks and pass in different parameters for each stream anyway. We use the tiniest little slice of the Spark Structured Streaming API to get this job done today. This is a big reason we had high confidence that we could build a replacement in Rust. Basically we're trading a sledge hammer for a custom pin hammer to knock our tiny nails in.

## Some Deets

There is bit of an impedance mismatch between Kafka streams and data warehouse file structure. [Parquet is a columnar format](https://parquet.apache.org/documentation/latest/), and each Parquet file (in fact each row group within a file) in a Delta Lake table should include a lot of rows to enable queries to leverage all the neat optimization features of parquet and run as fast as possible. Messages consumed from a Kafka topic come in one at a time though. To bridge this mismatch, Kafka Delta Ingest spends most of its time buffering messages in memory. It checks a few process arguments to make the largest possible parquet files. Those arguments are:

* allowed_latency - the latency allowed between each Delta write
* max_messages_per_batch - the maximum number of messages/records to include in each Parquet row group within a file
* min_bytes_per_file - the minimum bytes per parquet file written out by Kafka Delta Ingest

Internally, our internal Kafka usage guidelines include these constraints:

* Messages written to Kafka
  * Must be JSON 
  * Must include an ISO 8601 timestamp representing when the message was ingested/created (field name is flexible, but this timestamp must be included somewhere in the message)

* Records written to Delta Lake
  * Must include Kafka metadata
    * We preserve the metadata fields below under a struct field called `meta.kafka`
      * topic
      * partition
      * offset
      * timestamp
  * Must include a date-based partition (e.g. yyyy-MM-dd) derived from the ISO 8601 ingestion timestamp of the message

Other potential users of Kafka Delta Ingest may have different guidelines on how they use Kafka. Because of how we use Kafka internally, the first iteration of Kafka Delta Ingest is very focused on:

* JSON formatted messages
* Buffer flush triggers that thread the needle between query performance and persistence latency
* Very basic message transformations to limit the message schema contraints we push up to our producer applications

### Example

Let's say we have an application that writes messages onto a Kafka topic called `web_requests` every time it handles an HTTP request. The message schema written by the producer application includes fields like `status` (i.e. 200, 302, 400, 404, 500), `method` (i.e. "GET", "POST", "PUT") , `url` (the specific URL requested - i.e. /documents/9 or /books/42) and `meta.producer.timestamp` which is an ISO-8601 timestamp representing the date and time the producer wrote the message. Our Delta Lake table is partitioned by a field called `date` which has a `yyyy-MM-dd` format. We choose not to force our producer application to provide this field explicitly. Instead, we will configure our Kafka Delta Ingest stream to perform a transformation of the `meta.producer.timestamp` field that the producer already intends to send.

To accomplish this with Kafka Delta Ingest, using the "web_requests" stream as an example, we would:

* Create the "web_requests" topic
* Create the schema for our Delta Lake table ("kafka_delta_ingest.web_requests")
* Launch one or more kafka-delta-ingest workers to handle the topic-to-table ETL 

The Delta table `CREATE` looks roughly like:

```
CREATE TABLE `kafka_delta_ingest`.`web_requests` (
	`meta` STRUCT<
		`kafka`: STRUCT<`offset`: BIGINT, `topic`: STRING, `partition`: INT>,
		`producer`: `timestamp`
    >,
	`method` STRING,
	`status` INT,
	`url` STRING,
	`date` STRING
  ) 
USING delta 
PARTITIONED BY (`date`)
LOCATION 's3://path_to_web_requests_delta_table'
```

The Delta Lake schema we create includes more fields than the producer actually sends. Fields not written by the producer include the `meta.kafka` struct and the `date` field.

Launching a Kafka Delta Ingest worker to get this job done looks like:

```
kafka-delta-ingest ingest web_requests s3://path_to_web_requests_delta_table \
  -l 60 \
  -K "auto.offset.reset=earliest" \
  -t 'date: substr(meta.producer.timestamp, `0`, `10`)' \
      'meta.kafka.offset: kafka.offset' \
      'meta.kafka.partition: kafka.partition' \
      'meta.kafka.topic: kafka.topic'
```

To break down the parameters:

* `ingest` is the primary subcommand of kafka-delta-ingest. Basically, this means launch a process to read from a topic and write to a Delta table.
* The two unnamed parameters that immediately follow `ingest` are the topic name and the table name. So in the example, we are saying read from the "web_requests" topic, and write to the Delta table at "s3://path_to_web_requests_delta_table".
* `-l` is the `--allowed_latency` parameter. We are saying, buffer 60 seconds worth of messages before writing a file.
* `-K` is a multi-value argument passed through to [librdkafka](https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md) configuration. In the example, we are configuring our consumer to start from the earliest offsets available in Kafka by default (Kafka Delta Ingest has internal logic to figure out where it left off on previous runs and will seek the consumer manually except on the first run).
* `-t` (aka `--transform`) is a multi-value argument where we can setup all of the message transformations that must be applied to a message _before_ it becomes a Delta record. This is how we add those extra fields we want in our Delta table that are not provided by the producer. Kafka Delta Ingest supports two types of transform parameters. One type applies a JMESPath expression to an existing field in the message, and another type to pull in "well known" metadata fields available in the message processing context (This only supports Kafka message metadata fields like partition, offset, topic and timestamp at the moment).

Kafka Delta Ingest relies on Kafka consumer groups to coordinate partition assignment across many workers handling the same topic. So, if we want to scale out the number of workers handling "web_requests" we can just launch more ECS tasks with the same configuration and respond to Kafka's rebalance events.

Our deployment ends up looking like:

![Kafka Delta Ingest Deployment](/post-images/2021-05-kafka-delta-ingest/kafka-delta-ingest-deployment.png)

So we have one Kafka Delta Ingest ECS service per topic-to-table ETL workload. Each service runs 24x7. We expect high volume topics to require more worker nodes and scale out and in occassionally, and low volume topics to require a single worker (more on that later).

### Contributions

Contributions to Kafka Delta Ingest are very welcome and encouraged. Our core team has been focused on supporting our internal use case so far, but we would love to see Kafka Delta Ingest grow into a more well rounded solution. We have not been using the [GitHub issue list](https://github.com/delta-io/kafka-delta-ingest/issues) for managing work just yet since we are mostly managing work internally until we have our primary workloads fully covered, but we will be paying much more attention to this channel in the very near future.

One especially interesting area for contribution is related to data format. A lot of folks are using Avro and Protobuf instead of JSON these days. We still happen to use JSON on all of our ingestion streams at the moment, but I'd love to see Avro and Protobuf support in Kafka Delta Ingest. I believe we will see usage of one or both of these formats popping up internally at Scribd in the near future, so an enhancement to abstract over Kafka message data format would likely benefit the community in the near term and eventually Scribd as well.

Another big win contribution would be a subcommand intended to run periodically rather than continuously (24x7). I suspect a lot of folks are familiar with a scenario where Kafka is used as a buffer between data warehouse writes that occur periodically throughout the day. We have several low-volume topics that are not a good fit for 24x7 streaming because they only produce a one or two messages per second. Having a 24x7 process buffer these topics in memory would be very awkward. It would make a lot more sense to let these buffer in Kafka and launch a periodic cron-style job to do the ETL a few times a day. This is similar to the "Trigger Once" capability in [Spark Structured Streaming](https://databricks.com/blog/2017/05/22/running-streaming-jobs-day-10x-cost-savings.html).

Another vector for contribution is [delta-rs](https://github.com/delta-io/delta-rs). Delta-rs is another scribd sponsored open source project and is a key dependency of kafka-delta-ingest. Any write-oriented improvement accepted in delta-rs is very likely to benefit kafka-delta-ingest.


### Summary

My favorite thing about Kafka Delta Ingest is its very narrow scope to optimize and replace a _very_ common use case that you _could_ support with Spark Structured Streaming and Databricks, but much less efficiently. Basically, I love that we are creating a very specific tool for a very common need. 

Compare/contrast of Kafka Delta Ingest vs Spark Structured Streaming:

* Kafka Delta Ingest *ONLY* supports Kafka as a source, whereas Spark Structured Streaming supports generic sources.
* Kafka Delta Ingest *ONLY* supports Delta Lake as a sink, whereas Spark Structured Streaming supports generic sinks.
* Kafka Delta Ingest *ONLY* supports JSON messages (so far), whereas Spark Structured Streaming supports a variety of formats.
* Unlike Spark Structured Streaming, Kafka Delta Ingest *DOES NOT* provide any facility for joining streams or computing aggregates.
* Kafka Delta Ingest is an application that makes strong assumptions about the source and sink and is only configurable via command line arguments, whereas Spark Structured Streaming is a library that you must write and compile code against to yield a jar that can then be hosted as a job.
* Kafka Delta Ingest is fully distributed and master-less - there is no "driver" node. Nodes can be spun up on a platform like ECS with little thought to coordination or special platform dependencies.  A Spark Structured Streaming job must be launched on a platform like Databricks or EMR capable of running a Spark cluster.


