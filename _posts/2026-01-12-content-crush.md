---
layout: post
title: "Supercharging S3 Intelligent Tiering with Content Crush"
tags:
- rust
- aws
- featured
author: rtyler
team: Infrastructure Engineering
---

Scribd and Slideshare have been using AWS S3 for almost _twenty years_ and
store hundreds of _billions_ of objects making storage management quite a
challenge. My focus at Scribd has generally been around data and storage but
only in the past twelve months have I started to really focus on one of our
hardest technology problems: cost-effective storage and availability for the
hundreds of billions of objects that represent our content library.


Since adopting S3 for our object storage in 2007 a _lot_ has changed with the service, most
notably [Intelligent
Tiering](https://aws.amazon.com/s3/storage-classes/intelligent-tiering/) which [was
introduced in
2018](https://aws.amazon.com/blogs/aws/new-automatic-cost-optimization-for-amazon-s3-via-intelligent-tiering/).
At a very high level Intelligent Tiering allows object access patterns to
dictate the storage tier for a small per-object monitoring fee. Behind the
scenes S3 manages moving objects which are infrequently accessed into cheaper
storage.

For most organizations simply adopting Intelligent Tiering is the right
solution to save on S3 storage costs. For Scribd however the sheer number of
objects in our buckets makes the problem much more complex.

> **Cost management is an architecture problem**
>
> [Mike
> Julian](https://www.linkedin.com/posts/miketjulian_as-pete-alludes-to-cost-management-is-an-activity-7061767041002713088-B1M2)
> of [duckbill](https://www.duckbillgroup.com).

The _small per-object monitoring fee_ adds up to some serious numbers. While
monitoring 100 million objects costs $250/month, the monitoring fees for 100
_billion_ is $250,000/month. Billion is such a big number that it is hard to
make sense of it sometimes.

The difference between million and billion is **a lot**. Intelligent tiering was not going to work for Scribd unless we found a way to reduce or remove hundreds of billions of objects!


## Content Crush

When users upload a document or presentation to Scribd and Slideshare a lot of
machinery kicks in to process the file and converts it into a multitude of
smaller files to ensure clear and correct rendering on a variety of devices.
Further post-processing is done to help Scribd's systems understand the
document with a multitude of generated textual and image-based metadata. As a
result one file upload might result in hundreds or sometimes _thousands_ of
different objects being produced in various storage locations. 

**Content Crush** is the system we have built to bring all these objects back
into a _single_ stored object while preserving a virtualized keyspace and the
discrete retrieval semantics for systems which rely on these smaller files.

Before Content Crush a single document upload could produce something like the following tree:

```
s3://bucket/guid/
               /info.json
               /metadata.json
               /imgs/
                    /0.jpg
                    /1.jpg
               /fmts/
                    /original.pdf
                    /v1.tar.bz2
                    /v2.zip
               /other/
                     /random.uuid
                     /debian.iso
                     /dbg.txt
```

After Content Crush these different objects are collapsed into a single [Apache Parquet](https://parquet.apache.org) file in S3:

```
s3://bucket/guid.parquet
```

We became intimately familiar with the Parquet file format from our work creating [delta-rs](https://github.com/delta-io/delta-rs). The format was designed in a way that really excels in object storage systems like AWS S3. For example:

* S3 allows `GetObject` with byte ranges for partial reads of an object, most
  importantly it allows for _negative offset_ reads. This allows fetching the
  _last_ `N` bytes of a file.
* Parquet stores its metadata at the _end_ of a file, with the last 8 bytes
  indicating the length of the footer. One can read all a file's metadata with
  two calls: `GetObject(-8)` followed by `GetObject(-footer_len)`.
* Parquet's footer metadata indicates which byte offsets of different row
  groups, allowing retrieving one of `N` row groups rather than requiring full
  object reads.
* Additional user-provided metadata in the file footer allows for further optimizations around selective reads.

![Parquet file layout](/post-images/2026-content-crush/parquet-file-layout.gif)
[Parquet file format](https://parquet.apache.org/docs/file-format/)

Without Apache Parquet, Content Crush fundamentally would not work. There is prior art for "compressing objects" into S3 with other formats, but for our purposes they all have downsides:

* **Zip**: Streamable but not suitable for random access inside the file
* **Tar**: Also streamable but same issue as zip, then there's nuance between different implementations.
* **Build your own**: I looked into this but all my designs ended up looking like a less-good version of Apache Parquet.

The original prototype implementation used [S3 Object
Lambda](https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazons3-ol-change.html)
which allowed for a _seamless_ drop-in for existing S3 clients, allowing
applications to switch from on S3 Access Point to another any indication that
they are accessing "crushed" files. Since Object Lambda has ceased to be,
Content Crush is being moved over to an S3 API-compatible service.

### Downsides

No optimization is ever free and crushed assets has a couple of caveats that
are important to consider:

* Retrieval of a single "file" within a crushed object requires at least _two_
  `GetObject` calls to retrieve the appropriate data. The worst case is _three_
  since most Parquet readers will read the footer length, the footer, and
  _then_ fetch the data they seek. We can typically optimize this by hinting at
  the footer size with a 95% estimate.
* This system works well with relatively static objects, since editing a "file"
  inside of a crushed object requires the whole object to be read and then
  re-written. There can be some concurrency concerns with object updates too,
  we must ensure that only one process is updating an object at a time.

A related downside with maintaining an S3 API-compatible service is that
retrieving multiple files inside of single objects cannot be easily pipelined
or streamed. There are a number of ways to solve for this that I am exploring,
but they all converge on a different API scheme entirely to take advantage of
HTTP2.

### Upsides!

The ability to effectively use S3 Intelligent Tiering is by far the largest
benefit of this approach. With a dramatic reduction in object counts we can
adopt S3 Intelligent Tiering for large buckets in a way that provides _major_
cost improvements.

Fewer objects also makes tools like S3 Batch Operations viable for these
massive buckets. 

There are also hidden performance optimizations now available that were not
possible before. For example, for heavily requested objects there is now
AZ-local caching opportunities whether at the API service layer or simply by
pulling popular objects into S3 Express One Zone.

---


Much of this work is on-going and not completely open source. None of this
would have been possible without the stellar work by the folks in the [Apache
Arrow Rust](https://github.com/apache/arrow-rs) community building the
high-performance [parquet](https://crates.io/crate/parquet) crate. After we set
off on this path we learned of their similar work in [Querying Parquet with
Millisecond
Latency](https://arrow.apache.org/blog/2022/12/26/querying-parquet-with-millisecond-latency/).

There remains _plenty_ of work to be done building the foundational storage and
content systems at Scribd which power one of the world's largest digital
libraries. If you're interested in learning more we have a [lot of positions
open](/careers/#open-positions) right now!


## Presentation

Content Crush was originally shared at the August 2025 FinOps Meetup hosted by
[duckbill](https://www.duckbillgroup.com), with the slides from that event
hosted on Slideshare below:

<iframe src="https://www.slideshare.net/slideshow/embed_code/key/aBexzIntT7GcC3" width="610" height="515" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border: var(--border-1) solid #CCC; border-width:1px; margin-bottom:5px; max-width:100%;" allowfullscreen></iframe>

<div style="margin-bottom:5px"><strong><a href="https://www.slideshare.net/slideshow/2025-08-san-francisco-finops-meetup-tiering-intelligently/282679847" title="2025-08-san-francisco-finops-meetup-tiering-intelligently" target="_blank">2025-08 San Francisco FinOps Meetup</a></strong> from <strong><a href="https://www.slideshare.net/RTylerCroy" target="_blank">RTylerCroy</a></strong></div>
