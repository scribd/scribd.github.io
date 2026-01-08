---
layout: post
title: "Growing the Delta Lake ecosystem with Rust and Python"
tags:
- featured
- rust
- deltalake
- python
author: rtyler
team:
- Infrastructure Engineering
- Core Platform
---


Scribd stores billions of records in [Delta Lake](https://delta.io) but writing
or reading that data had been constrained to a single tech stack, all of that
changed with the creation of [delta-rs](https://github.com/delta-io/delta-rs).
Historically using Delta Lake required applications to be implemented with or
accompanied by [Apache Spark](https://spark.apache.org). Many of our batch
and streaming data processing applications are all Spark-based, but that's not
everything that exists! In mid-2020 it became clear that Delta Lake would be a
powerful tool in areas adjacent to the domain that Spark occupies. From my
perspective, I figured that would soon need to bring data into and out of Delta
Lake in dozens of different ways. Some discussions and prototyping led to the
creation of "delta-rs", a Delta Lake client written in Rust that can be easily
embedded in other languages such as
[Python](https://delta-io.github.io/delta-rs/python), Ruby, NodeJS, and more.


The [Delta Lake
protocol](https://github.com/delta-io/delta/blob/master/PROTOCOL.md) is not
_that_ complicated as it turns out. At an extremely high level, Delta Lake is a
JSON-based transaction log coupled with [Apache
Parquet](https://parquet.apache.org) files stored on disk/object storage.  This means the core implementation of Delta in [Rust](https://rust-lang.org) is similarly quite simple. Take the following example from our integration tests which "opens" a table, reads it's transaction log and provides a list of Parquet files contained within:


```rust
let table = deltalake::open_table("./tests/data/delta-0.2.0")
    .await
    .unwrap();
assert_eq!(
    table.get_files(),
    vec![
        "part-00000-cb6b150b-30b8-4662-ad28-ff32ddab96d2-c000.snappy.parquet",
        "part-00000-7c2deba3-1994-4fb8-bc07-d46c948aa415-c000.snappy.parquet",
        "part-00001-c373a5bd-85f0-4758-815e-7eb62007a15c-c000.snappy.parquet",
    ]
);
```

Our primary motivation for delta-rs was to create something which would
accommodate high-throughput writes to Delta Lake and allow embedding for
languages like Python and Ruby such that users of those platforms could perform
light queries and read operations. 

The first notable writer-based application being co-developed with delta-rs is
[kafka-delta-ingest](https://github.com/delta-io/kafka-delta-ingest). The
project aims to provide a highly efficient daemon for ingesting
Kafka-originating data into Delta tables. In Scribd's stack, it will
effectively bridge JSON flowing into [Apache Kafka](https://kafka.apache.org)
topics into pre-defined Delta tables, translating a single JSON message into a
single row in the table.

From the reader standpoint, the Python interface built on top of delta-rs,
contributed largely by [Florian Valeye](https://github.com/fvaleye) makes
working with Delta Lake even simpler, and for most architectures you only need
to run `pip install deltalake`:

```python
from deltalake import DeltaTable
from pprint import pprint

if __name__ == '__main__':
    # Load the Delta Table
    dt = DeltaTable('s3://delta/golden/data-reader-primitives')

    print(f'Table version: {dt.version()}')

    # List out all the files contained in the table
    for f in dt.files():
        print(f' - {f}')

    # Create a Pandas dataframe to execute queries against the table
    df = dt.to_pyarrow_table().to_pandas()
    pprint(df.query('as_int % 2 == 1'))
```

I cannot stress enough how much potential the above Python snippet has for
machine learning and other Python-based applications at Scribd.  For a number
of internal applications developers have been launching Spark clusters for the
sole purpose of reading some data from Delta Lake in order to start their model
training workloads in Python. With the maturation of the Python `deltalake`
package, now there is a fast and easy way to load Delta Lake into basic Python
applications.



From my perspective, it's only the beginning with [delta-rs](https://github.com/delta-io/delta-rs). Delta Lake is a deceptively simple technology with tremendous potential across the data platform. I will be sharing more about delta-rs at [Data and AI Summit](https://databricks.com/dataaisummit/north-america-2021) on May 27th at 12:10 PDT. I hope you'll join [my session](https://databricks.com/speaker/r-tyler-croy) with your questions about delta-rs and where we're taking it!


