---
layout: post
title: "Importing MySQL Data into Delta Lake"
author: alexk
tags:
- databricks
- spark
- deltalake
team: Data Engineering
---

OLTP databases are a common data source for Data Lake based warehouses which use Big Data tools to run 
batch analytics pipelines. Classic hadoop toolset comes with 
[Apache Sqoop](https://sqoop.apache.org/) - a tool for bulk import/export 
of data between HDFS and relational data stores. Our pipelines were using this tool as well, primarily 
to import MySQL data into HDFS. When Platform Engineering team at Scribd took on a effort 
to migrate our on-premise Hadoop workloads to [Databricks Lakehouse Platform](https://databricks.com/product/data-lakehouse) 
on AWS we had to write our own tool to import data from MySQL directly into S3 backed [Delta Lake](https://delta.io/). 
In this post I will share the details about `sql-delta-import` - an open-source spark utility to import data from any 
JDBC compatible database into Delta Lake. This utility is being open sourced under 
[Delta Lake Connectors](https://github.com/delta-io/connectors/pull/80) project

### Sample import

Importing data into a Delta Lake table is as easy as 

```shell script
spark-submit /
--class "io.delta.connectors.spark.JDBC.ImportRunner" sql-delta-import_2.12-0.2.1-SNAPSHOT.jar /
--jdbc-url jdbc:mysql://hostName:port/database /
--source source.table
--destination destination.table
--split-by id
```

### This looks a lot like `sqoop`... why didn't you just use that?

We considered using `sqoop` at first but quickly dismissed that option for multiple reasons

#### 1. Databricks Lakehouse Platform does not come with `sqoop`
Yes we could have ran our sqoop jobs on EMR clusters but we wanted to run everything in Databricks and
avoid additional technology footprint. But even if we drop that restriction...
 
#### 2. `sqoop` does not support writing data directly to Delta Lake
`sqoop` can only import data as text or parquet. Writing to delta directly allows us to 
optimize data storage for best performance on reads by just adding a couple of configuration options

```shell script
spark-submit /
--conf spark.databricks.delta.optimizeWrite.enabled=true /
--conf spark.databricks.delta.autoCompact.enabled=true /
--class "io.delta.connectors.spark.JDBC.ImportRunner" sql-delta-import_2.12-0.2.1-SNAPSHOT.jar /
--jdbc-url jdbc:mysql://hostName:port/database /
--source source.table
--destination destination.table
--split-by id
```

#### 3. `--num-mappers` just not good enough to control parallelism when working with a database
`sqoop` uses map-reduce under the hood. We can specify `--num-mappers` parameter that controls how many 
mappers will be used to import data. Small number of mappers can result in large volume 
of data per import and long running transactions. Large number of mappers will result in many connections 
to database potentially overloading it especially when there are a lot of `sqoop` jobs running in parallel.
Additionally since there are no reduce stages in `sqoop` jobs large number of mappers will result in large 
number of output files and potentially introducing a small files problem.

`sql delta import` uses `--chunks` parameter to control number of... well... chunks to split the source table 
into and standard spark parameters like `--num-executors` and `--executor-cores` to control data import
concurrency thus allowing you to tune those parameters independently

```shell script
spark-submit --num-executors 15 --executor-cores 4 /
--conf spark.databricks.delta.optimizeWrite.enabled=true /
--conf spark.databricks.delta.autoCompact.enabled=true /
--class "io.delta.connectors.spark.JDBC.ImportRunner" sql-delta-import_2.12-0.2.1-SNAPSHOT.jar /
--jdbc-url jdbc:mysql://hostName:port/database /
--source source.table
--destination destination.table
--split-by id
--chunks 500
```

in the example above source table will be split into 500 chunks resulting in quick transactions and released connections
but no more than 60 concurrent connections will be used for import since max degree of parallelism is 60 (15 executors x 4 cores). 
`delta.optimizeWrite` and `delta.autoCompact` configuration will yield optimal file size output for the destination table

#### 3.1 `--num-mappers` and data skew just don't play nicely together
 
When `sqoop` imports data, source table will be split into ranges based on `--split-by` column and each mapper 
would import its corresponding range. This works good when `--split-by` column has a near uniform distribution 
of data, but that's not always the case with source tables... As tables age we tend to add additional columns to them to
take on new business requirements so over time data in latest rows has a higher fill rate than earlier rows. 

![row density increase over time](/post-images/2021-03-sql-delta-import/row_density_increase.png)

Our source tables here at Scribd definitely have these characteristics. We also have some tables that have entire 
ranges of data missing due to data cleanup. At some point large chunks of data were just deleted from these tables.

![missing rows](/post-images/2021-03-sql-delta-import/missing_rows.png)

This type of data skew will result in processing time skew and output file size skew when you can only control number of 
mappers. Yes we can introduce additional computed synthetic column in the source table as our `split-by` column but now 
there is an additional column that does not add business value, app developers need to be aware of it, computing and 
storing it takes up database resources and if we plan to use it for imports it's better be indexed, thus even more 
compute and storage resources.

With `sql-delta-import` we still split source tables into ranges based on `--split-by` column but if there is data 
distribution skew we can "solve" this problem by making number of chunks much larger than max degree of parallelism.
This way large chunks with high data density are broken up into smaller pieces that a single executor can handle. 
Executors that get chunks with little or no data can just quickly process them and move on to do some real work. 


### Advanced use cases

For advanced use cases you don't have to use provided spark application directly. `sql-delta-import` 
libraries can be imported into your own project. You can specify custom data transformations or JDBC dialect to gain a 
more precised control of data type handling

```scala
import org.apache.spark.sql._
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

import io.delta.connectors.spark.JDBC._
  
implicit val spark: SparkSession = SparkSession.builder().master("local").getOrCreate()


// All additional possible jdbc connector properties described here - https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-configuration-properties.html
val jdbcUrl = "jdbc:mysql://hostName:port/database"

val config = ImportConfig(source = "table", destination = "target_database.table", splitBy = "id", chunks = 10)

// a sample transform to convert all timestamp columns to strings
val timeStampsToStrings : DataFrame => DataFrame = source => {
  val tsCols = source.schema.fields.filter(_.dataType == DataTypes.TimestampType).map(_.name)
   tsCols.foldLeft(source)((df, colName) =>
     df.withColumn(colName, from_unixtime(unix_timestamp(col(colName)), "yyyy-MM-dd HH:mm:ss.S")))
}

// Whatever functions are passed to below transform will be applied during import
val transforms = new DataTransform(Seq(
  df => df.withColumn("id", col("id").cast(types.StringType)), //custom function to cast id column to string
  timeStampsToStrings //included transform function converts all Timestamp columns to their string representation
))

val importer = new JDBCImport(jdbcUrl = jdbcUrl, importConfig = config, dataTransform = transforms)

importer.run()
```

---
Prior to migrating to Databricks Lakehouse Platform we had roughly 300 `sqoop` jobs. We were able to 
successfully port all of them to `sql-delta-import`. Today they happily coexist in production with other spark 
jobs allowing us to use uniform set of tools for orchestrating, scheduling, monitoring and logging for all of our jobs.
