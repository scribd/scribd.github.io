---
layout: post
title: "Stop Building Models. Start Building Systems."
tags:
- featured
- content-trust-series
- machinelearning
- llm
- databricks
- scribd
team: ML Data Engineering
author: anishk123
---

LLM models change. Prompt quality changes. Cost changes. We assumed that from day one.

So instead of building a one-off system tied to a specific model or a single "perfect prompt," we focused on a **repeatable process** that we successfully applied to two large-scale projects (Slideshare and Scribd). That repeatable process is what we're sharing.

---

## What We Achieved

This process enabled projects that normally require far more people and time:

- **Slideshare:** scanned tens of millions of slideshows, classifying each against adult-related content categories (e.g., sexually explicit content, drugs, alcohol, tobacco) and flagging the small fraction that matched.
- **Scribd:** scanned hundreds of millions of documents with a small cross-functional team — 1 engineer, 1 SME (annotations), 1 data scientist — in about two months.

The specific labels and thresholds vary by project and policy requirements. The important part is that the **process** was portable across both efforts.

---

## Hypothesis

LLM models, prompt quality, and cost will change over time. The durable asset is not a single prompt or model — it's a **repeatable human-in-the-loop process**.

![Humans stay in the loop: the model proposes labels at scale, humans have the final say on the disagreements, and corrections grow a versioned golden set that feeds back into the model.](/post-images/2026-fast-llm-hitl/human-in-the-loop.svg)

This idea is:

1. Use a fast model to generate candidate labels and short rationales at scale
2. Use a judge model to flag disagreements and ambiguous cases
3. Focus SME review only on the highest-value slices
4. Ingest SME corrections as a growing golden dataset
5. Iterate prompts and re-run only what you need (slices / disagreements)

> **Fast Model → Judge Model → SME Review → Ingest → Iterate**

---

## How the loop works

### Step 1 — Standardize Inputs (Before You Touch Prompts)

The easiest way to make prompt work repeatable is to standardize what you feed the model. We used a consistent document "snippet" concept so every workflow starts the same way.

**Example fields:**

- `doc_id`
- `title` (if available)
- `pdf`
- `language` (if known)
- optional metadata

**Why this matters:**

- Prompts are simpler and more stable
- Batch sizing is predictable
- You avoid rewriting "how do we feed docs to the model?" for every project

### Step 2 — Fast-Model Bulk Pass (Breadth First)

**Goal:** create candidate labels at scale, cheaply and quickly.

We asked the fast model for:

- **label**
- **short rationale**

Illustrative prompt (example only; actual production prompts were tuned and different):

```
Classify this document as ADULT, NOT_ADULT, or UNKNOWN.
Provide a 1–2 sentence rationale

Document:
<PDF URL>
```

**Why ask for rationales:**

- Makes SME review faster
- Makes judge evaluation more reliable
- Makes debugging prompt failures dramatically easier

### Step 3 — Batch Inference (Keep It Boring)

For very large datasets, asynchronous batch inference is the "boring" choice that unlocks speed. You submit a JSONL file of requests, let it run, then download results later.

**Why it works well:**

- Generally 50% cheaper than realtime inference
- Fewer moving parts than realtime queueing systems
- Fewer timeout/retry headaches
- Easier to reproduce runs
- Easier to parallelize and monitor at the batch level

### Step 4 — Store Everything with Versioning (So You Can Iterate)

Store both raw and parsed outputs with run metadata:

- prompt version
- model name / model version
- run timestamp
- `doc_id`
- label / rationale

This turns iteration into something you can measure and regress-test, not a "vibes-based" exercise.

### Step 5 — Judge Model Pass (Quality Signal at Scale)

The judge model is a higher-capability model used to review a sample and decide whether it agrees with the fast model. It should explicitly:

- **agree or disagree**
- provide a short rationale
- provide a corrected label when it disagrees

Illustrative judge prompt (example only):

```
Here is the document and the fast model's label + rationale.
Do you agree? YES/NO
If NO, correct the label.
Explain briefly.
```

The judge is not a replacement for SMEs — it's a way to:

- concentrate SME attention on the highest-value cases
- surface failure patterns faster
- create measurable disagreement signals for iteration

### Step 6 — SME Loop via Google Sheets (Focused Human Time)

We exported:

- **judge disagreements** (high priority)
- **a small random sample of agreements** (spot checks)

SMEs reviewed the sheet and made edits. This is where human-in-the-loop scales: you're not asking SMEs to label everything — you're asking them to validate a small, high-value slice.

Then we ingested the SME edits back into Databricks and versioned the golden dataset.

---

## Sampling Strategy: 1% Validation + 0.1% Judge Sample

![Breadth first, then concentrate human time: the fast model labels the full corpus, a 1% slice validates generalization, a judge model re-checks a 0.1% sample, and SMEs review only the disagreements.](/post-images/2026-fast-llm-hitl/sampling-funnel.svg)

Why not just rely on the small golden dataset? Because small golden datasets tend to be:

- cleaner than the real corpus
- missing long-tail edge cases
- biased toward examples you already understand

We used:

- **1% of the corpus** as a validation slice for sanity checks
- **0.1% random sample** for judge review (plus targeted slices when needed)

**What this catches:**

- rare content patterns
- languages or formats underrepresented in golden data
- prompt ambiguity that doesn't show up in curated examples
- unexpected "UNKNOWN" spikes due to drift

If random sampling isn't enough, stratify by patterns visible in the rationale and disagreements such as:

- document type/format
- document length
- language

---

## Prompt Engineering: Make It Iterative, Not Fragile

A scalable, repeatable pattern:

1. fast model outputs label + rationale
2. judge model explicitly agrees/disagrees
3. use disagreements as "training data" for prompt improvements:
   - clarify definitions
   - add a few targeted examples (carefully)
   - tighten output formatting rules
   - reduce ambiguity and edge-case confusion

You should see:

- disagreement rate drop over time
- SME correction rate drop over time
- fewer surprise failures on the 1% validation slice

---

## Metrics That Matter (Simple but Effective)

You do not need an overly complex evaluation harness to start. Track:

- disagreement rate (fast vs judge)
- SME correction rate (on judge disagreements)
- throughput (docs processed per job/day)
- iteration trend (disagreement should fall as prompts improve)

The point is not "perfect metrics." The point is to make iteration measurable.

---

## Common Failure Modes (And How We Handled Them)

1. **Overconfident wrong answers**
   Fix: capture context and prioritize big disagreements for SME review.
2. **Google Sheets becomes a bottleneck**
   Fix: keep the sheet schema strict; export smaller batches; parallelize review across multiple sheets.
3. **Batch retries / partial failures**
   Fix: keep batch requests idempotent; retry only failed batches; store intermediate results per batch.

---

## What To Copy If You Want to Replicate This

1. Standardize document inputs (`doc_id` + pdf or excerpt + minimal metadata)
2. Run a small fast-model probe (100–1k annotated docs) to sanity check outputs
3. Run a fast-model batch warmup for a larger slice
4. Run a judge model on 0.1% random sample
5. Export disagreements to Google Sheets and have SMEs review
6. Ingest edits as a versioned golden dataset
7. Iterate prompts, validate on 1%, then scale up

---

## Key Learnings

1. **Fast models give you breadth.** A simple prompt on a fast, low-cost model can label tens of thousands of documents quickly. The results won't be perfect — and that's okay. It turns Subject Matter Expert (SME) work from "label everything from scratch" into "review, correct, and curate."
2. **Batch inference makes scaling simpler.** For large backfills and corpus-scale labeling, asynchronous batch inference is usually both operationally simpler than building realtime request pipelines and meaningfully cheaper.
3. **"Fast model → Judge model" creates a scalable quality loop.** Use a higher-capability model as a judge to agree/disagree with the fast model's output. Use disagreements (and a small sample of agreements) as the highest-leverage items for SME review and prompt iteration.
4. **Validate beyond your small golden set.** Engineer prompts on a small golden dataset, then check generalization using 1% of the corpus, and run judge review on a 0.1% random sample (plus targeted slices when needed).
5. **Use familiar tools to keep a small team moving fast.** Databricks for data sourcing and orchestration → batch LLM calls → Google Sheets for SME validation → ingest back into Databricks → repeat.

---

## The workflow, end to end

Here's the end-to-end loop we repeated:

![The repeatable loop: a fast model labels for breadth, a judge model checks a sample, SMEs make the final call, corrections grow the golden set, and the prompt is iterated — then the loop repeats.](/post-images/2026-fast-llm-hitl/repeatable-loop.svg)

1. **Source documents in Databricks**
2. **Standardize a document PDF** and metadata
3. **Build JSONL batches** for LLM inference
4. **Run batch inference** with a fast model (candidate label + short rationale + context)
5. **Store outputs** with prompt/model versioning
6. **Validate** on 1% of the corpus; run judge on 0.1% random sample
7. **Export disagreements** (and a small sample of agreements) to Google Sheets
8. **SMEs review and correct labels** quickly
9. **Ingest corrections back into Databricks** as the next golden dataset version
10. **Improve prompts** and repeat the loop

---

## Summary

LLM models, prompt quality, and cost will change over time. That's why we built a repeatable process — not a one-off prompt — and validated it across two large real-world projects.

> **Fast Model → Judge Model → SME Review → Ingest → Iterate**

That repeatability is what made it possible for a small cross-functional team to classify ~25M slideshows and ~400M documents in ~2 months — and it's the process we hope others can reuse and adapt as models and pricing evolve.

---

## Appendix

### A) Suggested Google Sheets Columns for SME Review

| doc_id | snippet | fast_label | fast_rationale | judge_agree | judge_label | judge_rationale | sme_label | sme_notes | reviewer | review_ts |
|--------|---------|------------|----------------|-------------|-------------|-----------------|-----------|-----------|----------|-----------|

### B) Mermaid Diagram

```mermaid
flowchart LR
  A["1) Source data in Databricks"] --> B["2) Standardize doc snippets + metadata"]
  B --> C["3) Build JSONL batches (idempotent)"]
  C --> D["4) Batch inference: fast model"]
  D --> E["5) Store candidate label + rationale"]
  E --> F["6) Validate 1% slice; judge 0.1% sample"]
  F --> G["7) SME reviews disagreements in Sheets"]
  G --> H["8) Ingest edits → grow golden set → iterate"]
  H --> C
```

### C) One-Page Checklist

- Standardized doc snippet schema
- JSONL batch builder
- Fast-model batch runner + parser
- Judge-model batch runner + disagreement computation
- Sheets export/import
- Golden dataset versioning
- Dashboard: disagreement rate + SME correction rate + unknown rate
