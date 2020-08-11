---
layout: post
title: Backing up Datadog and Performing Bulk Edits
tags:
- datadog
- monitoring
- featured
team: Core Infrastructure
authors:
- jimp
- kamranf

---

# Datadog Backup

What would happen if someone accidentally deleted a dashboard or important
monitor in Datadog? How would we know that it had changed? All of our monitoring
and metrics at Scribd are configured in [Datadog](https://www.datadoghq.com), so
it was important to have a mechanism to **track changes** across all these
resources and be able to **revert back** to a previous state in case of a bad
change. We also wanted the ability to **search and edit** across all dashboards
and monitors (to refactor a tag, for example). 

When composing dashboards and monitors, immediate feedback is critical.
Therefore, as we evaluated existing tools, we looked for the ability to coexist
with Datadog’s native user interface. 

Finding none that exactly fit our needs, we wrote [Datadog
Backup](https://github.com/scribd/datadog_backup), an open source Ruby Gem.
Datadog Backup focuses on the ability to perform global backups and bulk editing
without impeding the free use of the Datadog User Interface.

Aspects of this project were inspired by the likes of
[Doggy](https://github.com/Shopify/doggy). As you consider your approach to
Datadog management, we highly recommend you also take a look at it and other
client libraries at
[https://docs.datadoghq.com/developers/libraries/#datadog-client-community-libraries](https://docs.datadoghq.com/developers/libraries/#datadog-client-community-libraries).


## How to use Datadog Backup

The intended use case for Datadog Backup is as a component of a Github Action
workflow, or similar CD pipeline, that takes regular backups of Datadog, then
commits to a git repository. This enables such a repository to be used as an
audit trail, capturing the state of Datadog configuration at regular intervals.

A local backup will additionally enable performing a search against the YAML or
JSON definitions and performing mass updates which can then be pushed back to
Datadog. To use the tool to make a mass edit to Datadog configuration, one
modifies the repository locally, then runs the command in “restore” mode.


### Running the tool

```
gem install datadog_backup
export DATADOG_API_KEY=abc123 
export DATADOG_APP_KEY=abc123

# Perform backup to optional/path/to/backupdir using YAML encoding
datadog_backup backup --backup-dir optional/path/to/backupdir

# Make some changes

# Just review the changes since last backup
datadog_backup diffs --backup-dir optional/path/to/backupdir

# Review and apply local changes to datadog

datadog_backup restore --backup-dir optional/path/to/backupdir
```

### Using the tool in Github Actions

Included in the git repo for Datadog Backup is an [example Github Actions
workflow](https://github.com/scribd/datadog_backup/tree/master/example) for
periodically backing up your Datadog deployment.

### Further development

Some areas to further expand the gem are:

-   Backup of metadata

If you find this Gem useful, and would like to expand on it, [contributions are
welcome](https://github.com/scribd/datadog_backup)! 

