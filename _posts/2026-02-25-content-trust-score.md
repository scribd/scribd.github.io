---
layout: post
title: "Dual-Embedding Trust Scoring"
tags:
- machinelearning
- scribd
- featured
- content-trust-series
team: Applied Research
author: ericc
---

Scribd is a digital library serving academics and lifelong learners, offering hundreds of millions of documents. This very nature presents a significant concern: **content trust and safety**. Protecting our library from undesirable and unsafe content is a top priority, but the **multilingual and multimodal** (text and images) nature of our platform makes this mission very challenging. Also, while third-party tools exist, they often fall short, lacking the nuance to handle our specific trust and safety categories.

To this end, we capitalized on **Generative AI (GenAI)** signals and our **proprietary multilingual embeddings**, in conjunction with classical machine learning methods, to develop our **Content Trust Score**. This metric reflects the severity of a document violating a specific trust pillar, enabling us to identify high-risk content and take appropriate actions. Ultimately, the score allows us to build a more robust and scalable moderation system, ensuring a safer and more reliable experience for all users while preserving the rich diversity of our UGC.

The data and methodologies presented here are for research purposes and do not represent Scribd's overall moderation or policy implementation.

## Content Trust Pillars
According to our internal Trust & Safety framework, we defined and prioritized our current efforts on four top-level concern pillars:

* **Illegal:** Documents that contain or promote illegal materials or activities
* **Explicit:** Sexual or shocking content
* **Privacy/PII:** Violate privacy or contain Personally Identifiable Information (PII)
* **Low Quality:** Junk, gibberish, low information, or non-semantic documents 

To maintain a clear project scope, we focused our research on these four semantic-heavy pillars where our embedding-based approach offers the greatest impact. The remaining violation types are out of scope and are addressed by other specialized detection algorithms.

## From Embeddings to Trust Score
### Datasets & Features
We leveraged annotated data at Scribd, which includes human-assigned trust labels, to craft our **core modeling dataset** of roughly **100,000 documents**. This dataset was split 90-to-10 for training and testing data and distributed across the four trust pillars. The **training set** was used exclusively to derive the Content Trust Pillar embeddings, while the **testing set** provided the initial basis for comparison between content- and description-based scores. In addition to the four primary Trust Pillars, we also **included documents not violating any trust & safety pillars**. These *clean* documents serve as the **“baseline” in our analyses**. It is important to note that the **data presented here is for discussion purposes and does not represent approximate category distributions within the Scribd corpus**.

<style>
.figure-table {
  width: calc(100% - 3rem);
  max-width: 100%;
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  box-sizing: border-box;
}
.figure-table figcaption {
  margin-bottom: 1em;
}
.figure-table table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.figure-table th,
.figure-table td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: center; box-sizing: border-box; }
.figure-table thead th { background: #f5f5f5; }
</style>
<figure class="figure-table">
  <figcaption><strong>Table 1. Document distribution across Trust Pillars.</strong> This table details the percentage of labeled documents within the training and testing datasets. Note that the <em>Clean</em> documents are included separately as the baseline.</figcaption>
  <table>
    <thead>
      <tr>
        <th>Trust Pillar</th>
        <th>Training Dataset</th>
        <th>Testing Dataset</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Illegal</td>
        <td>1.49%</td>
        <td>1.56%</td>
      </tr>
      <tr>
        <td>Explicit</td>
        <td>0.39%</td>
        <td>0.41%</td>
      </tr>
      <tr>
        <td>PII/Privacy</td>
        <td>5.43%</td>
        <td>5.48%</td>
      </tr>
      <tr>
        <td>Low Quality</td>
        <td>2.18%</td>
        <td>2.17%</td>
      </tr>
      <tr>
        <td><em>Clean</em></td>
        <td>90.51%</td>
        <td>90.38%</td>
      </tr>
    </tbody>
  </table>
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
  <figcaption><strong>Figure 2. Conceptual visualization of Trust Pillar embeddings and document similarity in a high-dimensional space.</strong> Each colored dot represents a single document.</figcaption>
</figure>

### Enhancing Semantics with Description Embeddings
While the **content-based semantic embeddings** are generally effective, they struggle in certain cases where the raw text is not fully informative. Specifically, these embeddings may fail when documents are **extremely long, image-heavy, or contain meaningless repetitive text**.

In these scenarios, a **brief content summary can provide a superior document representation**. For example, Figure 3 illustrates a document containing presentation slides where the raw text is minimal, yet the user-provided description is quite informative. 

<figure>
    <img width="662" alt="Figure 3. Example of an extremely long document with good descriptive metadata." src="/post-images/2026-content-trust/content-trust-score-Figure-3.png">
  <figcaption><strong>Figure 3. Example of an extremely long document with good descriptive metadata.</strong> This example demonstrates how a concise, user-provided description (bottom box) provides more focused, informative text for embedding than the raw content of an extremely long document.</figcaption>
</figure>

However, since users often do not provide adequate descriptions upon document upload, we rely on **large language models (LLMs)** to generate descriptive summaries based on the content. Figure 4 demonstrates this necessity, showing a document with lengthy and repetitive text where the LLM-generated descriptions (**GenAI descriptions**) summarize the core topic effectively.

Consequently, we generated a **second set of document semantic embeddings** and the corresponding **Content Trust Pillar embeddings** based on the **LLM-generated descriptions**. This dual-approach allowed us to compute the content trust score using the alternative, enhanced representation.

<figure>
    <img width="662" alt="Figure 4. Example of a document with meaningless, repetitive content (top)." src="/post-images/2026-content-trust/content-trust-score-Figure-4.png">
  <figcaption><strong>Figure 4. Example of a document with meaningless, repetitive content (top).</strong> The LLM successfully analyzes and summarizes the document, providing a usable description for embedding generation (bottom).</figcaption>
</figure>

### Content- vs. Description-Based Trust Scores
For each trust pillar, we compared the distribution of the content trust scores derived from the document’s content to their GenAI-description-based counterparts, using the approximately 10,000-document testing dataset. To ensure a fair comparison, we included only documents for which both sets of scores were available. Our results reveal that the **content-based trust scores outperformed the scores generated from GenAI descriptions** for **all Trust Pillars** (Figure 5a-c) **except the Low Quality pillar** (Figure 5d).

For the majority of Trust Pillars, the **content-based scores demonstrated strong discrimination:** they were higher for documents truly violating a given pillar (True Positives) than for documents violating other trust pillars or clean documents. Conversely, for these same pillars, the GenAI-description-based scores were indistinguishable from those of other documents, or showed significantly less separation compared to the content-based counterparts. This suggests that while **content-based embeddings offer a superior representation for general trust identification**, the descriptive embeddings provided little added value for these pillars.

This performance pattern is **reversed for Low Quality documents**. Specifically, the content-based scores for Low Quality documents were ineffective, proving to be indistinguishable from those violating other trust pillars or those labeled as clean. The GenAI-based approach, however, showed a distinct advantage: the **GenAI-description-based scores were significantly higher for Low Quality documents** compared to all others. This result indicates that the **descriptive summary is crucial for accurately identifying this specific type of document**.

<figure>
    <img width="662" alt="Figure 5. Trust Score Distribution Comparison of Content vs. GenAI-Description Trust Scores." src="/post-images/2026-content-trust/content-trust-score-Figure-5.jpg">
  <figcaption><strong>Figure 5. Trust Score Distribution Comparison of Content vs. GenAI-Description Trust Scores.</strong> Violin plots showing the distribution of trust scores for documents belonging to a specific violation pillar (blue) compared to all other documents (red; other pillars in scope or clean documents).</figcaption>
</figure>

For completeness and to verify that our results were not skewed by the presence of other violating documents, we conducted a final comparative analysis by isolating the scores of labeled documents **against only the clean, non-violating documents**. As evident in Figure 6, the core patterns persist: The **content-based scores** consistently yield **superior separation** between violating content (blue) and clean content (green) for the **Illegal, Explicit, and PII/Privacy** pillars (Figure 6a-c). In sharp contrast, the GenAI-description-based scores for these same three pillars exhibit significantly greater distribution overlap. Conversely, for the **Low Quality pillar** (Figure 6d), the **GenAI-description method** again established a **much clearer boundary** from the clean documents than the content-based method, further validating our hybrid scoring approach.

<figure>
    <img width="662" alt="Figure 6. Trust Score Distribution Comparing Pillars Exclusively to Clean Documents." src="/post-images/2026-content-trust/content-trust-score-Figure-6.jpg">
  <figcaption><strong>Figure 6. Trust Score Distribution Comparing Pillars Exclusively to Clean Documents.</strong> Violin plots showing the distribution of scores for documents belonging to a specific violation pillar (blue) compared only to Clean documents (green).</figcaption>
</figure>

### Score Generation for All Documents
Based on these differentiating findings, we adopted a **hybrid scoring approach:** we use the **content-based trust scores** for the **Illegal, Explicit, and PII/Privacy** pillars, and the **GenAI-description-based trust scores** for the **Low Quality** pillar. This decision enabled the computation of the most effective Content Trust Scores for all documents in our library across every trust pillar.

## Classification Through Threshold Setting
The content trust score reflects the extent to which a document violates a specific pillar – A high score indicates that the document closely resembles the defined trust violation type. **To build a classification system that flags violations, we must determine an optimal score threshold**.

### Strategic Thresholding: Prioritizing Precision
In this work, we chose to **prioritize precision** to build a high-confidence classification system. Our goal is to maintain a very low mislabeling rate, specifically aiming for a **false positive rate (FPR) close to 1%**. This decision is driven by the need to **minimize user friction** – Incorrectly flagging documents as violating trust pillars would be an undesirable user experience, making the avoidance of high FPR our primary concern.

### Building the Evaluation Dataset
The inherently low document count for certain violation types (e.g., Explicit) prevented us from performing reliable analyses to determine classification thresholds. To address this methodological challenge, we developed an **expanded evaluation dataset**. This was built by taking the original modeling data (both training and testing sets) and augmenting it with a high volume of additional human-annotated documents from our existing corpus. By incorporating this high-volume, high-quality labeled data, we established a more comprehensive baseline for threshold analysis. To ensure fair comparisons between the content-based and GenAI-description-based scores, we filtered the data to only include documents with both scores available. This refinement resulted in a **final working total of approximately 109,000 documents in the evaluation dataset**.

### Final Classification Thresholds
For each of the four in-scope trust pillars, we calculated classification metrics, specifically **recall** and **false positive rate (FPR)**, across a range of thresholds (0.5 to 0.95). Adhering to our rigorous safety standards, we **prioritized Precision** to maintain an **FPR close to 1%**. This conservative thresholding strategy was chosen to minimize user friction associated with false flagging. The final score thresholds for the classification systems of the four Trust Pillars are summarized in Table 2.

<figure class="figure-table">
  <figcaption><strong>Table 2. Classification metrics at the chosen thresholds for the Trust Pillars.</strong></figcaption>
  <table>
    <thead>
      <tr>
        <th>Trust Pillar</th>
        <th>Score Threshold</th>
        <th>Recall</th>
        <th>False Positive Rate</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Illegal</td>
        <td>0.80</td>
        <td>71.83%</td>
        <td>0.79%</td>
      </tr>
      <tr>
        <td>Explicit</td>
        <td>0.80</td>
        <td>10.22%</td>
        <td>1.07%</td>
      </tr>
      <tr>
        <td>PII/Privacy</td>
        <td>0.75</td>
        <td>3.82%</td>
        <td>0.62%</td>
      </tr>
      <tr>
        <td>Low Quality</td>
        <td>0.60</td>
        <td>27.20%</td>
        <td>0.52%</td>
      </tr>
    </tbody>
  </table>
</figure>

The analysis revealed that the **Illegal** pillar achieved the optimal balance of metrics, securing a **high recall of 72%** while maintaining an excellent **FPR of 0.79%**. The **Low Quality pillar**, which relies on the GenAI-description-based scores, achieved a respectable **recall of 27.2%** with a very low **FPR of 0.52%**. This outcome validates our decision to utilize the descriptive embeddings for this challenging content type. 

However, this high-performance scenario was not replicated across all Trust Pillars. Specifically, the strict **FPR** target limited the system's ability to capture certain violations, with **Explicit and PII/Privacy** achieving only a recall of **10% and 4%, respectively**. This disparity highlights the inherent challenges in identifying documents violating these two pillars, as their topical language is much broader and less defined compared to the other classes. 

These results serve as an initial performance baseline. We are actively exploring internal refinements to our **embedding representations and scoring logic**, as well as integrating **complementary models**, to **progressively enhance detection sensitivity**. Our goal is to expand coverage across these more complex pillars while strictly upholding our commitment to a low false-positive environment.

## Discussion
Our work demonstrates a straightforward and flexible content moderation system by effectively leveraging **classical machine learning** principles (cosine similarity, thresholding) alongside **modern Large Language Models (LLMs)** for superior document representation. This hybrid approach offers several key operational and technical advantages:

### Technical and Operational Advantages
* **Scalability and Efficiency:** The final content trust score calculation relies on simple vector mathematics (cosine similarity) against pre-computed pillar embeddings. This allows the system to **run efficiently at scale** with a **low computational cost** for real-time inference.
* **Customizable Representations:** The system is easy to fine-tune, allowing us to quickly update the trust category representations (the Pillar Embeddings) using new data. This flexibility is critical for adapting the system to the unique data and specific violation nuances present in our library.
* **Enhanced Contextual Understanding:** Incorporating LLM-generated summaries provides a level of **contextual understanding** that helps handle the nuance and ambiguity often present in challenging document types (e.g., extremely long documents or those with minimal text).
* **Resilience to Emerging Threats:** The use of semantic embeddings, which capture underlying meaning rather than just keywords, allows the system to **adapt well to new or evolving types of harmful content** without requiring constant manual rule updates.

### Potential Applications
The Content Trust Score and the underlying classification system created in this project open the door to various critical applications at Scribd:
* **Content Safety in Discovery:** Serving as a primary filter to ensure safe content appears prominently in search results and recommendation feeds. Our N-way testing experiments revealed that filtering unsafe content from search results **significantly increases core business metrics** (e.g., signup) and user engagement (e.g., read time).

## Further Reading
This project was recently presented at TrustCon 2025. For those interested in a visual walkthrough of the dual-embedding approach, you can view the [full presentation slides on Slideshare](https://www.slideshare.net/slideshow/enhancing-content-moderation-with-dual-embedding-trust-scoring-using-llm-summarization/286257301?utm_source=clipboard_share_button&utm_campaign=slideshare_make_sharing_viral_v2&utm_variation=control&utm_medium=share).

## Acknowledgments
This work was a collaborative effort, and we are incredibly grateful to the following individuals and teams for their invaluable contributions:
* **[Rafael Lacerda](https://www.linkedin.com/in/raflac/)**, **[Monique Alves Cruz](https://www.linkedin.com/in/moniquealvescruz/)**, and **[Seyoon Kim](https://www.linkedin.com/in/seyoonkim/)** for their strategic guidance and steadfast support throughout the project.
* **[John Strenio](https://www.linkedin.com/in/johnstrenio/)** for his foundational research and exploratory work that paved the way for this initiative.
* **[Kara Killough](https://www.linkedin.com/in/kara-killough/)** for her diligent efforts in building the high-quality annotated datasets that powered our models.
* The **Search and Recommendation Teams** for their partnership and agility in integrating the trust scores, directly driving the measurable improvements in our user experience and business metrics.