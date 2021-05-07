---
layout: post
title: "Growing the Delta Lake ecosystem with Rust and Python"
tags:
- featured
- rust
- deltalake
- python
author: rtyler
team: Core Platform
---


Scribd stores billions of records in [Delta Lake](https://delta.io) but writing
or reading that data was constrained to a single tech stack, all of that
changed with the creation of Rust and Python support via
[delta-rs](https://github.com/delta-io/delta-rs). Historically, using Delta
Lake required applications be implemented with or accompanied by [Apache
Spark](https://spark.apache.org) and many of our batch and streaming data
processing applications are all Spark-based. In mid-2020 it became clear to me
that Delta Lake would be a powerful tool in areas adjacent to the domain that
Spark occupys: we would soon need to bring data into and out of Delta Lake in
dozens of different ways. Some discussions and prototyping led to the creation
of "delta-rs", a Delta Lake client written in Rust that can be easily embedded
in other langauges such as
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
    &vec![
        "part-00000-cb6b150b-30b8-4662-ad28-ff32ddab96d2-c000.snappy.parquet",
        "part-00000-7c2deba3-1994-4fb8-bc07-d46c948aa415-c000.snappy.parquet",
        "part-00001-c373a5bd-85f0-4758-815e-7eb62007a15c-c000.snappy.parquet",
    ]
);
```


