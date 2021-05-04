---
layout: post
title:  "Backing up Delta Lake"
author: kuntalb
tags:
- deltalake
- s3
- data-warehouse
- backup
- featured
team: Core Platform
---


Transitioning from a more traditional database operation (read ACID, RDBMS blah blah) background to a newer data platform is always interesting. As it constantly challenges all yours year old wisdom and kind of forces you to adapt to newer way of getting things done.

At [Scribd](https://tech.scribd.com/) we have made
[Delta Lake](https://delta.io/) a cornerstone of our data platform. All data in
Delta Lake is stored in [Apache Parquet](https://parquet.apache.org/) format enabling Delta Lake to leverage
the efficient compression and encoding schemes that are native to Parquet. The
Delta Lake transaction log (also known as the `DeltaLog`) is an ordered record of
every transaction that has ever been performed on a Delta Lake table since its
inception. So a particular dataset to work properly it needs to have the
parquet file and the corresponding `DeltaLog`.

When the task of having a workable backup of all those delta lake files fell
into my lap, I decided to look some of the age old concepts of backup in a new
perspective. The concerns I consdiered were:

  1. What am I protecting against? How much I need to protect?
  1. Can I survive with loosing some data during restore and do I have the option of rebuilding them again from that point of time recovery?
  1. What kind of protection I want to put in place for the backed up data?

So what we set as objective as:

  1. I am mainly protecting against human error where by mistake a table can be purged ([VACUUM](https://docs.databricks.com/spark/latest/spark-sql/language-manual/delta-vacuum.html)), which severely hamper my ability to do a time travel if required.
  1. In most cases, if we have a reasonable backup ready we should be able to build the Delta table that got lost between the time the backup was taken and a drop table has occurred.


## The Devil is in the Details

After deliberating a lot, we decided to do this whole backup operation
independent of [Delta Lake](https://delta.io/) and go to the lowest layer
possible, in our case which was S3. I never thought I would say this ever in my
life (being a RDBMS DBA) but the moment we get onto S3 layer, the whole thing
become a challenge of copying few S3 buckets (read millions of files) over
instead of a database backup.
So we started looking for an efficient S3 copy operation and found [AWS S3
batch
operation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/batch-ops-examples-xcopy.html)
and its feature for Copying objects across AWS account. This was like match
made in heaven for us.
You can use [AWS S3 batch operation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/batch-ops-examples-xcopy.html) to perform large-scale batch operations on Amazon S3 objects. S3 Batch Operations can perform a single operation on lists of Amazon S3 objects that you specify. A single job can perform a specified operation (in our case copy) on billions of objects containing large set of data. This operation has following features,

  1. Automatically tracks progress.
  1. Stores a detailed completion report of all or selected actions in a user defined bucket.
  1. Provides a fully managed, auditable, and serverless experience.

Once we decided to use  [AWS S3 batch operation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/batch-ops-examples-xcopy.html), the next biggest challenge was how to generate the inventory list that will feed the AWS S3 batch operation. We decided to use [AWS S3 inventory](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-inventory.html) to generate the inventory list. There are some challenges associated with that as well.

**Pros**:

* Simple setup, we can terraform it easily
* Much more efficient operation compare to generating our list as that list object API only returns 1000 rows per call that means we have to keep iterating till we get the full list.

**Cons**:

* We do not control when it can be run, it will generate a report on a daily basis but the timings is not in our hand.
* It runs in an eventually consistent model, i.e. All of your objects might not appear in each inventory list. The inventory list provides eventual consistency for PUTs for both new objects and overwrites, and DELETEs. Inventory lists are a rolling snapshot of bucket items, which are eventually consistent (that is, the list might not include recently added or deleted objects)

To overcome the downsides, we decided to run the backup at a later date, e.g. for a backup of March 31st we based that off a manifest generated on April 2nd. This manifest would certainly have all data up until March 31st and some of April 1st's files as well.

Once we have settled on this model, the rest of the work was similar to any
other backup process. We also set up the Source and the Destination to have
protective boundaries so that we don't accidentally propogate any deletes to
the backups.

### New Account New Beginning

To stop this accidental deletion of the backed up data we decided to put the
backed up data set in completely separate bucket in a different AWS account
with stringent access controls in place. With the new account it was much easier to
control the access level from the beginning rather than controlling access in
an already existing account where people already have certain degree of access
and hard to modify that access levels. In the new account we ensured only a few handful of people will actually have
access to backed up data, further reducing chances of any manual error.

### Backup Process

#### Destination Side

  1. Backup will be taken on a complete separate AWS account from the source
     account. Hardly few admin will have access to this account to reduce the
     chance of manual mistake.
  1. The whole backup process will be automated with less human intervention to reduce the scope of manual error.
  1. Destination Side we will have to create buckets to store the inventory reports based on which the batch job will be run.
  1. Destination Side we will have to create buckets to store the actual backup
     where the batch job will store the backup objects. While terraforming it
     we have that bucket name dynamically created with the date appended at the
     end of the bucket name e.g. `<Source-Bucket-Name>-<dd-mmm-yyyy>`, so that
     before each full snapshot we can create this buckets. Otherwise there is a
     risk of earlier full snapshots getting overwritten.
  1. Create an IAM role for the batch operation, source will give the copy object permission to this role
  1. We created a lambda on the destination side to scan through all the `manifest.json` files and create the actual batch operation and run it automatically.

#### Source Side

  1. We terraformed an Inventory Management config for all the buckets listed above in Source side.
  1. This inventory config will create the inventory in Designated Manifest bucket in the destination account.
  1. For all the buckets on the source side , we have to add the policy as a bucket level policy to allow the S3 batch operation role created in destination side to do the copy operation


### Limitations

These are mainly the limitation of AWS S3 batch operation,
  1. All source objects must be in one bucket.
      - This is not a challenge for us as we are going to invoke bucket level copy and create a manifest at bucket level meet this requirement
  1. All destination objects must be in one bucket.
      - This is not a challenge for us as we are going to invoke bucket level copy and create a manifest at bucket level meet this requirement
  1. You must have read permissions for the source bucket and write permissions for the destination bucket.
      - Again with proper IAM roles for the S3 batch copy operation can manage this
  1. Objects to be copied can be up to 5 GB in size.
      - S3 Batch is using put method so its limited up to 5GB. If there is any manual upload of files that is more than 5GB we will skip it. The behaviour is tested and we found that batch operation is throwing the following error and continue with the rest of the operation.
      ```Some-file-name,,failed,400,InvalidRequest,The specified copy source is larger than the maximum allowable size for a copy source: 5368709120 (Service: Amazon S3; Status Code: 400; Error Code: InvalidRequest; Request ID: FHNW4MF5ZMKBPDQY; S3 Extended Request ID: /uopiITqnCRtR1/W3K6DpeWTiJM36T/14azeNw4q2gBM0yj+r0GwzhmmHAsEMkhNq9v8NK4rcT8=; Proxy: null)```

  1. Copy jobs must be created in the destination region, which is the region you intend to copy the objects to.
      - Again for our purpose this is what we intended to do any way
  1. If the buckets are un-versioned, you will overwrite objects with the same key names.
      - We will create new buckets for each full snapshots to mitigate this.

## Conclusion

The above approach worked well for our purpose, and if we follow the process
properly it should suffice for many of our use-cases. This approach can work quite well if like us you do not have
the luxury of doing a "Stop the World" on your data warehouse writes, and still
need to have a backup with certain degree of confidence. This method does not
provide an accurate point on time snapshot due to the “eventually consistent”
model of manifest generation, but I believe this method covers most of the use-cases for
any Delta Lake backups.

---

Within Scribd's Platform Engineering group we have a *lot* more services than
people, so we're always trying to find new ways to automate our infrastructure.
If you're interested in helping to build out scalable data platform to help
change the world reads, [come join us!](/careers/#open-positions)
