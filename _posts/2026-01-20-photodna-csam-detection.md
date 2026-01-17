---
layout: post
title: "Deploying a Cost-Effective, Scalable PhotoDNA System for CSAM Detection"
tags:
- featured
- aws
- lambda
- databricks
team: ML Data Engineering
author: anishk123
---

Child safety is a non‑negotiable responsibility for any platform that hosts user‑generated content. Over the last year, we designed and deployed a production system that detects known Child Sexual Abuse Material (CSAM) using PhotoDNA perceptual hashes, integrates with the National Center for Missing and Exploted Children’s (NCMEC) reporting system, and scales efficiently across our ingestion surfaces. This post explains the problem we set out to solve, how PhotoDNA hashing works, the online child-protection ecosystem (NCMEC, Tech Coalition, Project Lantern), our architecture and operational model, cost considerations, and key learnings.

Note: This article discusses safety technology at a high level. We intentionally omit sensitive operational details to protect the effectiveness of these defenses.

### Problem: Accurate CSAM detection at scale, within strict safety and cost constraints

We needed to:

- Accurately detect known CSAM at upload and in historical backfills.
- Minimize false positives while keeping latency low on critical paths.
- Meet obligations for reporting to NCMEC and preserve chain‑of‑custody evidence.
- Fit within pragmatic cost envelopes and scale elastically with traffic.
- Integrate into Scribd’s existing ML and batch compute ecosystem for observability, auditability, and maintainability.

### The ecosystem: Tech Coalition, Project Lantern, PhotoDNA, and NCMEC

- **[Tech Coalition and Project Lantern](https://technologycoalition.org/):** An industry consortium and initiative to strengthen cross‑platform child safety, including responsible signal sharing that helps disrupt abusers across services. Lantern focuses on sharing signals that increase detection of predatory accounts and coordinated abuse while respecting privacy and legal constraints.
- **[PhotoDNA](https://www.microsoft.com/en-us/photodna):** A perceptual hashing technology created by Microsoft in collaboration with Dartmouth College. PhotoDNA transforms an image into a robust hash that stays stable across common modifications (resize, recompress, minor color adjustments). Matching is performed against vetted hash sets of known illegal content.
- **[NCMEC (National Center for Missing & Exploited Children)](https://www.missingkids.org/ourwork/ncmecdata):** A US-based nonprofit with a Congressional mandate to serve as the clearinghouse and triage for CSAM reports in the United States via the CyberTipline.NCMEC also serves as the steward of vetted hash CSAM data sets. US-based platforms are required to report confirmed CSAM and retain appropriate artifacts for law enforcement.

### How PhotoDNA CSAM detection works (at a glance)

1. An image is normalized (e.g., resized, converted to a canonical colorspace). For PDFs, we first extract images.
2. A perceptual transformation produces a PhotoDNA hash vector.
3. We compare that hash to vetted hash sets using a distance threshold tuned to minimize both false positives and false negatives.
4. A match triggers automated containment (quarantine/blocks), evidence preservation, safety review, and NCMEC reporting workflows.

### Architecture

At a high level, we separate event driven and highly parallel PhotoDNA hash generation from high throughput GPU based batch PhotoDNA matcher. The components in our design are AWS services but equivalent from any other hyperscaler will suffice.

Key properties:

- The deterministic matching path is GPU‑parallel, horizontally scalable, and isolated from image transform and hash generation.
- Hash set updates are versioned and rolled atomically; match records include hash‑set version.
- Matches are logged and reviewed.

![PhotoDNA CSAM Detection System diagram](/post-images/2026-content-trust/photodna-csam-detection-system.png)

The diagram above shows the high-level architecture of our PhotoDNA CSAM Detection System. The system is designed to be cost-effective, scalable, and efficient. 

### Hasher and matcher details

#### Hasher: event driven and highly parallel

- Image sources: raw images and images extracted from PDFs (embedded image extraction are deterministic and versioned).
- Parallelism: Each PDF document is processed in parallel by evented and isolated compute (AWS Lambda).
- Storage: PhotoDNA hashes are versioned and storage for every extracted image.
- Observability: structured metrics (throughput, error codes, backlog depth) and end‑to‑end lineage identifiers provide for auditability.

#### Matcher: high‑throughput batch

- Vetted hash sets are loaded for matching; where feasible, keep structures memory‑resident to maximize throughput.
- Batched distance computations with conservative thresholds minimize false positives; thresholds and policies are versioned.
- Aggregation: combine duplicate or near‑duplicate image evidence into per‑asset decisions and preserve the strongest evidence for review.
- Events and evidence: emit match events to quarantine/review flows and include hash‑set version and metadata for audit.

### Lessons Learned & Best Practices

#### Which NCMEC hash set to use?

We prioritize vetted, legally curated sources:

- Primary: NCMEC‑provided hash sets for known CSAM.
- Supplementary: Industry‑shared signals via Tech Coalition initiatives (e.g., Project Lantern) where applicable and approved.

Operationally, we version, verify, and roll out hash updates.

#### Where do GPUs come in?

In our final design and implementation, graphical processing units (GPUs) materially improved throughput and unit cost for PhotoDNA hashing when run as SageMaker Batch workloads. We containerized the PhotoDNA pipeline and executed it on GPU‑backed instances to accelerate matching, enabling us to meet tight batch Service-level objectives (SLOs) and backfill schedules with fewer nodes.

- Batched matching on GPU nodes via SageMaker Batch/Processing reduced runtimes significantly.
- GPU‑accelerated transforms improved end‑to‑end throughput.
- Higher throughput per node reduced cost at scale.

#### Learnings from Microsoft’s PhotoDNA guidance

- Preprocessing matters: adhere to canonical normalization steps (grayscale, downsample strategy) or use the vetted cloud service where appropriate.
- Treat thresholds conservatively; don’t repurpose perceptual distances beyond vetted safety use cases.
- Keep auditable logs of match context and system versions; separate operational telemetry from sensitive evidence artifacts.

### Machine learning (ML) deployment at Scribd: Observability and operational rigor

Although PhotoDNA isn’t “a model” we train, we run complementary ML components and rigorous observability:

- **Weights & Biases (W&B)**: Host the versioned model in the W&B Model Registry, lineage, and provenance for audit. SageMaker Batch jobs resolve the model to ensure reproducibility.
- **AWS SageMaker Batch Inference**: Host batch inference jobs using standardized containers, consistent IAM boundaries, and autoscaling.

### Cost model

We sized for steady‑state uploads and periodic backfills:

- **Compute**: GPU‑backed SageMaker Batch for PhotoDNA hashing improved throughput/SLOs and, when saturated, delivered better $/throughput than equivalently provisioned CPU fleets.
- **Storage**: Keep only what is necessary for safety review and legal retention. Use lifecycle policies and tiering for aging artifacts.
- **Queueing and elasticity**: Amazon Simple Queue Service (SQS) buffers absorb bursts; autoscaling workers maintain SLOs without overprovisioning.
- **Hash set operations**: Updates are small; cost is dominated by compute and storage around matches and evidence.

In practice, the unit economics are driven by: input volume, match rate (rare but higher cost per event), retention windows, and backfill cadence.

### Wins

- **Safety‑first by design**: Deterministic matching path is simple, fast, and auditable.
- **Operational clarity**: Clear blast‑radius boundaries between hashing, matching, enrichment, and reporting.
- **Scalable and cost‑effective**: GPU‑accelerated hashing on SageMaker Batch achieved high throughput and favorable unit economics at scale.
- **Stronger together**: Collaboration with the ecosystem improves coverage and response speed.

### Operational guardrails and compliance

- Strict identity and access management (IAM) boundaries; least‑privilege for all safety components.
- Immutable logging with retention; separate telemetry from sensitive evidence.
- Privacy and data minimization: collect only what’s necessary for safety and compliance.

### Acknowledgments

This was truly a cross‑functional effort. Thank you:

- Machine Learning and Data Engineering team
- Product Managers
- Infrastructure
- Legal
- Partners at NCMEC and Microsoft
- [Industry peers via Tech Coalition](https://technologycoalition.org/) initiatives, including [Project Lantern](https://technologycoalition.org/programs/lantern/)

### Collaboration highlights

- Ongoing alignment with NCMEC reporting workflows (evidence packaging, retention, and audit trails).
- Incorporating best practices from Microsoft’s PhotoDNA guidance for normalization and thresholding.
- Participation with industry groups (e.g., Tech Coalition/Project Lantern) to improve cross‑platform defenses.

### Appendix: FAQs

- **Does PhotoDNA require GPUs?** No. However, in our SageMaker Batch implementation, GPUs significantly improved throughput and cost for large‑scale hashing, so we run hashing on GPU for batch workloads.
- **How are false positives handled?** Conservative thresholds plus human‑in‑the‑loop review on any flagged item before reporting or account actions.

