---
layout: post
title: "Data and AI Summit Wrap-up"
team: Core Platform
author: rtyler
tags:
- databricks
- kafka
- deltalake
- featured
---

We brought a whole team to San Francisco to present and attend this year's Data and
AI Summit, and it was a blast! 
I
would consider the event a success both in the attendance to the Scribd hosted
talks and the number of talks which discussed patterns we have adopted in our
own data and ML platform.
The three talks I [wrote about
previously](/blog/2022/data-ai-summit-2022.html) were well received and have
since been posted to YouTube along with _hundreds_ of other talks. 

* [Christian Williams](https://github.com/xianwill) shared some of the
work he has done developing
[kafka-delta-ingest](https://github.com/scribd/kafka-delta-ingest) in his talk:
[![Streaming Data into Delta Lake with Rust and Kafka](https://img.youtube.com/vi/do4jsxeKfd4/hqdefault.jpg)](https://www.youtube.com/watch?v=do4jsxeKfd4&list=PLTPXxbhUt-YVWi_cf2UUDc9VZFLoRgu0l&index=195)
* [QP Hou](https://github.com/houqp), Scribd Emeritus, presented on
his foundational work to ensure correctness within delta-rs during his session:
[![Ensuring Correct Distributed Writes to Delta Lake in Rust with Formal
Verification](https://img.youtube.com/vi/ABoCnrVWCKY/hqdefault.jpg)](https://www.youtube.com/watch?v=ABoCnrVWCKY&list=PLTPXxbhUt-YVWi_cf2UUDc9VZFLoRgu0l&index=112)
* [R Tyler Croy](https://github.com/rtyler) co-presented with Gavin
Edgley from Databricks on the cost analysis work Scribd has done to efficiently
grow our data platform with **[Doubling the size of the data lake without doubling the
cost](
https://www.youtube.com/watch?v=9QDRD0PzqCE&list=PLTPXxbhUt-YVWi_cf2UUDc9VZFLoRgu0l&index=122)

Members of the Scribd team participated in a panel to discuss the past,
present, and future of Delta Lake on the expo floor. We also took advantage of
the time to have multiple discussions with our colleagues at Databricks about
their product and engineering roadmap, and where we can work together to
improve the future of Delta Lake, Unity catalog, and more.

For those working in the data, ML, or infrastructure space, there are a lot of
_great_ talks available online from the event, which I highly recommend
checking out. Data and AI Summit is a great event for leaders in the industry
to get together, so we'll definitely be back next year!
