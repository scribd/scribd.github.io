---
layout: post
title: "Dual-Embedding Trust Scoring"
tags:
- machinelearning
- scribd
- content-trust-series
team: Applied Research
author: ericc
---

Scribd is a digital library serving academics and lifelong learners, offering hundreds of millions of documents. This very nature presents a significant concern: **content trust and safety**. Protecting our library from undesirable and unsafe content is a top priority, but the **multilingual and multimodal** (text and images) nature of our platform makes this mission very challenging. Also, while third-party tools exist, they often fall short, lacking the nuance to handle our specific trust and safety categories.

To this end, we capitalized on **Generative AI (GenAI)** signals and our **proprietary multilingual embeddings**, in conjunction with classical machine learning methods, to develop our **Content Trust Score**. This metric reflects the severity of a document violating a specific trust pillar, enabling us to identify high-risk content and take appropriate actions. Ultimately, the score allows us to build a more robust and scalable moderation system, ensuring a safer and more reliable experience for all users while preserving the rich diversity of our UGC.

The data and methodologies presented here are for research purposes and do not represent Scribd's  overall moderation or policy implementation.

## Content Trust Pillars
According to our internal Trust & Safety framework, we defined and prioritized our current efforts on four top-level concern pillars:

* **Illegal:** Documents that contain or promote illegal materials or activities
* **Explicit:** Sexual or shocking content
* **Privacy/PII:** Violate privacy or contain Personal Identifiable Information (PII)
* **Low Quality:** Junk, gibberish, low information, or non-semantic documents 

To maintain a clear project scope, we focused our research on these four semantic-heavy pillars where our embedding-based approach offers the greatest impact. The remaining violation types are out of scope and are addressed by other specialized detection algorithms.

## From Embeddings to Trust Score
### Datasets & Features
We leveraged an annotated data at Scribd, which includes human-assigned trust labels, to craft our core modeling dataset of roughly 100,000 documents. This dataset was split 90-to-10 for training and testing data and distributed across the four trust pillars. The training set was used exclusively to derive the Content Trust Pillar embeddings, while the testing set provided the initial basis for comparison between content- and description-based scores. In addition to the four primary Trust Pillars, we also included documents not violating any trust & safety pillars. These clean documents serve as the “baseline” in our analyses. It is important to note that the data presented here is for discussion purposes and does not represent approximate category distributions within the Scribd corpus.

| Trust Type | Training Dataset | Testing Dataset |
|------------|------------------|-----------------|
| Explicit   | 0.39%            | 0.41%           |
| Illegal    | 1.49%            | 1.56%           |
| PII/Privacy| 5.43%            | 5.48%           |
| Low Quality| 2.18%            | 2.17%           |
| *Clean*    | 90.51%           | 90.38%          |




