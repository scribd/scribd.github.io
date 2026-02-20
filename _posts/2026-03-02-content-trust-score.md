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
We leveraged an annotated data at Scribd, which includes human-assigned trust labels, to craft our **core modeling dataset** of roughly **100,000 documents**. This dataset was split 90-to-10 for training and testing data and distributed across the four trust pillars. The **training set** was used exclusively to derive the Content Trust Pillar embeddings, while the **testing set** provided the initial basis for comparison between content- and description-based scores. In addition to the four primary Trust Pillars, we also **included documents not violating any trust & safety pillars**. These *clean* documents serve as the **“baseline” in our analyses**. It is important to note that the **data presented here is for discussion purposes and does not represent approximate category distributions within the Scribd corpus**.

<figure markdown="1">
  <figcaption>Table 1. Document distribution across Trust Pillars. This table details the percentage of labelled documents within the training and testing datasets. Note that the <em>Clean</em> documents are included separately as the baseline.</figcaption>

| Trust Type | Training Dataset | Testing Dataset |
|:----------:|:----------------:|:---------------:|
| Explicit   | 0.39%            | 0.41%           |
| Illegal    | 1.49%            | 1.56%           |
| PII/Privacy| 5.43%            | 5.48%           |
| Low Quality| 2.18%            | 2.17%           |
| *Clean*    | 90.51%           | 90.38%          |
</figure>

<br>
The core feature of our project is the **128-dimensional semantic embeddings for every document**, which were generated using the [LaBSE model](https://huggingface.co/sentence-transformers/LaBSE), fine-tuned on our in-house dataset. Specifically, semantic embeddings are **dense, numerical vector representations of text** in a high-dimensional space. The goal of the embeddings is to map linguistic meaning into this vector space such that pieces of text with similar semantics are positioned mathematically closer together. Moreover, the degree of similarity between texts can be quantified by the distance between their respective vectors. For instance, in Figure 1, the words “circle” and “square” are closer to each other since they are semantically more similar, compared to words like “crocodiles” or “alligators”. This allows us to **represent all the text in our document using a vector of numbers and accurately quantify their semantic relationships**.
<br>
<figure>
    <img width="662" alt="Figure 1. Conceptual visualization of semantic embeddings." src="/post-images/2026-content-trust/content-trust-score-Figure-1.png">
  <figcaption><strong>Figure 1. Conceptual visualization of semantic embeddings.</strong></figcaption>
</figure>

<!-- ![Dual-Embedding Trust Scoring Fig1](/post-images/2026-content-trust/content-trust-score-Figure-1.png)
**Figure 1. Conceptual visualization of semantic embeddings.** -->


### Content Trust Score
The first step in generating the Trust Score was creating the representative vectors for each trust pillar. Using the semantic embeddings, we generated the **Content Trust Pillar embeddings** for each trust pillar by **averaging the embeddings of all documents** with that pillar's label in the **training dataset**. The large size of the training dataset helps ensure the representativeness of these Pillar embeddings.

The content trust score for a **Trust Pillar** was then computed as the **cosine similarity** between the document’s embedding and the corresponding Trust Pillar’s embedding. Crucially, **all scores are generated and evaluated exclusively using the testing dataset** to strictly **avoid data leakage and circularity** in our analysis. Our hypothesis is that documents closely matching a specific trust pillar will yield a high similarity score against that Pillar's embedding, while non-matching documents will yield a low score.

This concept is visualized in Figure 2, where each "Pillar" represents a distinct trust pillar centroid. Individual documents are clustered around their respective pillar, illustrating that the closer a document's embedding is to a specific Trust Pillar embedding, the higher its calculated similarity score, which confirms a stronger thematic match to that pillar.

<figure>
    <img width="662" alt="Figure 2. Conceptual visualization of Trust Pillar embeddings and document similarity." src="/post-images/2026-content-trust/content-trust-score-Figure-2.png">
  <figcaption><strong>Figure 2. Conceptual visualization of Trust Pillar embeddings and document similarity in a high-dimensional space.</strong> Each coloured dot represents a single document.</figcaption>
</figure>

### Enhancing Semantics with Description Embeddings
While the **content-based semantic embeddings** are generally effective, they struggle in certain cases where the raw text is not fully informative. Specifically, these embeddings may fail when documents are **extremely long, image-heavy, or contain meaningless repetitive text**.

In these scenarios, a **brief content summary can provide a superior document representation**. For example, Figure 3 illustrates a document containing presentation slides where the raw text is minimal, yet the user-provided description is quite informative. 

<figure>
    <img width="662" alt="Figure 3. Example of an extremely long document with good descriptive metadata." src="/post-images/2026-content-trust/content-trust-score-Figure-3.png">
  <figcaption><strong>Figure 3. Example of an extremely long document with good descriptive metadata.</strong> This example demonstrates how a concise, user-provided description (bottom box) provides more focused, informative text for embedding than the raw content of an extremely long document.</figcaption>
</figure>
