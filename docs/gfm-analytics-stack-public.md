# GoFundMe Analytics Stack — Public-Info Research

**Date crawled:** 2026-05-28
**Scope note:** This file covers what GoFundMe has said publicly about their internal data pipeline (dashboards, BI tools, warehouse, experimentation workflows, data team setup). It complements `docs/gfm-observed-metrics.md`, which covers client-side observable signals. Sources are job postings, vendor case studies, and tech-stack registries — no proprietary access used.

---

## Summary — What We Learned vs. Didn't

**Learned with confidence:** Data warehouse is Snowflake (confirmed by multiple job postings). BI layer is Looker-primary (confirmed). dbt is the transformation standard. Airflow is the orchestration tool. mParticle is confirmed as the CDP/event bus feeding Amplitude and ad destinations. Amplitude is used for self-serve product analytics and A/B test read-out. Optimizely and GrowthBook are mentioned as SQL-based experimentation platforms used alongside Amplitude.

**Did not find:** No public engineering blog or conference talks by GoFundMe data engineers. No detail on their experimentation analysis workflow beyond Amplitude's self-serve funnels. No confirmed data team size. No public mention of Snowplow, Segment, or homegrown tracking-plan tooling. No detail on alerting/anomaly detection tooling.

---

## Public Evidence

### Q1 — Data Warehouse

- **Snowflake confirmed as primary warehouse** (multiple job postings, 2024–2025):
  - Staff Analytics Engineer (Greenhouse, 2025): "optimizing query performance within Snowflake" — https://job-boards.greenhouse.io/gofundme/jobs/7779227
  - Senior Staff Data Platform Architect (Greenhouse, 2025): lists "Snowflake, Databricks" as modern cloud-native platform examples with Delta Lake / Iceberg as preferred lakehouse formats — https://job-boards.greenhouse.io/gofundme/jobs/7839650
  - Staff Data Engineer listing (search-aggregated, 2024): "comfort with Snowflake performance tuning and managing large datasets"
  - Staff Data Scientist, Finance (Greenhouse, 2024–2025): "strong experience with data warehousing platforms, particularly Snowflake" — https://job-boards.greenhouse.io/gofundme/jobs/7379251
- **Databricks mentioned** as a secondary or comparable platform in senior architect postings; Iceberg and Delta Lake are explicitly preferred table formats, suggesting a lakehouse expansion beyond pure Snowflake.
- **BigQuery** appears in one data scientist posting as an alternative familiarity ask but is not listed as primary.
- **Himalayas.app tech profile** lists Apache Spark, Hadoop, Kafka as data processing tools alongside dbt and Airflow — https://himalayas.app/companies/gofundme/tech-stack

### Q2 — BI / Dashboarding Tool

- **Looker is primary** — mentioned by name in every analytics/data scientist job posting reviewed:
  - Staff Data Engineer: "familiarity with BI tools like Looker, Hex, Mode, and Tableau" (Looker listed first)
  - Staff Data Scientist, Finance: "strong data visualization and BI skills (Looker preferred)"
  - Staff Data Scientist (performance marketing): "Looker or equivalent BI tools"
- **Hex and Mode** appear as secondary mentions in the data engineer posting, suggesting they may be used for ad-hoc or notebook-style analysis.
- **Tableau** appears only as a fallback alternative, not a primary requirement.
- No public mention of Metabase or a homegrown BI tool.

### Q3 — Experimentation Workflow

- **Amplitude is the primary experimentation read-out layer** (Amplitude case study, published ~late 2022 / updated 2025):
  - Went from 2–3 tests/month to 10 tests/month after adopting Amplitude.
  - PM self-service via Amplitude funnels, cohorts, and A/B Test View freed data team from one-off SQL requests.
  - Amplitude's anomaly detection used for "keeping eyes on the ecosystem."
  - Sources: https://amplitude.com/case-studies/gofundme and https://amplitude.com/blog/gofundme
- **Optimizely is confirmed as a flag/assignment layer** (observed client-side and corroborated by job postings).
- **GrowthBook mentioned alongside Optimizely** in Staff Data Scientist job posting as a "SQL-based experimentation platform" the team is familiar with — suggests they may run GrowthBook for some statistical analysis on top of raw event data.
- The Staff Data Scientist (performance marketing) posting calls out "enhancing experimentation frameworks to ensure scalable causal measurement" — indicating that vanilla Optimizely/Amplitude is supplemented by in-house causal inference models (uplift modeling, propensity scoring, Markov-chain attribution).
- Source: https://app.welcometothejungle.com/jobs/SLWqzGZL (cached version of GFM Staff Data Scientist posting)

### Q4 — Data Team Structure

- Job postings reveal functional sub-teams within a "Data Platform" org:
  - **Analytics Engineering squad** (inside Data Platform team) — owns dbt models, Snowflake performance, semantic/metrics layer.
  - **Data Science** — sub-specialties include Marketing/Growth, Finance, Pricing, and a general product data science track.
  - **ML Engineering** — separate from data science; owns model serving, MLflow, Airflow-based pipelines.
  - **Data Platform Architecture** — senior/staff architect role modernizing the warehouse and streaming layers.
- International presence: Buenos Aires appears alongside San Francisco in listings, suggesting some data roles are distributed globally.
- No public team-size number found. The Amplitude case study describes "a small analytics team" that was bottlenecked on SQL requests pre-2019.
- Sources: https://job-boards.greenhouse.io/gofundme/jobs/7839650, https://job-boards.greenhouse.io/gofundme/jobs/7779227

### Q5 — Event Modeling / Tracking-Plan / CDP Layer

- **mParticle confirmed as the CDP/event router** — GoFundMe Pro release notes explicitly state: "added and validated analytics instrumentation using mParticle events for certain search interactions."
  - This aligns with client-side observation of the mParticle SDK. mParticle fans out events to Amplitude, ad pixels, and likely the data warehouse.
  - Source: GoFundMe Pro release notes (behind 403 at time of fetch; mentioned in search snippet) — https://prosupport.gofundme.com/hc/en-us/articles/37726683210267-Release-notes
- **No public mention of Snowplow or Segment** — mParticle appears to be the sole CDP layer.
- **Kafka + Flink** appear in a 2024 Staff Data Engineer job description as core streaming infrastructure, suggesting mParticle events flow into a Kafka bus internally before landing in Snowflake. Source: search snippet from https://job-boards.greenhouse.io/gofundme/jobs/6573649
- The Senior Staff Data Platform Architect posting calls out "real-time reporting and streaming architectures" as a key build area — consistent with a Kafka → Snowflake (or Kafka → Flink → Snowflake) pipeline.

### Q6 — Logging Display, Alerting, Anomaly Detection

- **Amplitude anomaly detection** is explicitly mentioned in the Amplitude blog post as GoFundMe's mechanism for "keeping eyes on the ecosystem" — https://amplitude.com/blog/gofundme
- **New Relic** is listed in the Himalayas tech profile for application monitoring — https://himalayas.app/companies/gofundme/tech-stack
- **Algolia analytics dashboard** used specifically for search performance monitoring (confirmed in Algolia case study) — https://www.algolia.com/customers/gofundme
- **DataGrail** used for privacy/DSR automation with "instant insight into 500+ systems" — used as a data inventory/governance tool, not a BI tool — https://www.datagrail.io/customers/gofundme-spotlight/
- No public mentions of Monte Carlo, Great Expectations, Anomalo, or other dedicated data observability tools. The data platform architect posting calls for building "data observability, pipeline reliability, and proactive monitoring" — suggesting this may be a gap they are actively building.

---

## Inferred Picture

**[Inference — not confirmed by any single public source]**

The most likely internal pipeline based on all public signals:

```
Client events (web/mobile)
  → mParticle SDK (CDP / routing layer)
      → Amplitude (self-serve product analytics, A/B readout, anomaly alerting)
      → Kafka (internal event bus for real-time use cases)
          → Flink (stream processing / enrichment)
          → Snowflake (primary data warehouse via Kafka connector or batch load)
      → Ad pixels (Adjust, AppsFlyer, Meta/Google via mParticle forwarding)
      → Braze (lifecycle marketing events)

Snowflake
  → dbt (transformation + metrics/semantic layer)
      → Looker (primary BI / self-serve dashboards for business teams)
      → Hex / Mode (analyst-tier exploratory notebooks, inferred from job listing mention)
      → Airflow (orchestration of dbt + ML batch jobs)
      → MLflow (ML experiment tracking, model registry)

Optimizely / GrowthBook
  → flag assignment baked into client events
  → experiment analysis done in Amplitude (self-serve) AND
     custom causal models in Python/Snowflake (data science team)
```

---

## Gaps / What's Still Opaque

1. **Warehouse schema conventions** — no public tracking plan, data catalog tool, or event taxonomy documentation found.
2. **Experimentation statistics engine** — unclear whether Amplitude's built-in stats or a custom frequentist/Bayesian framework handles significance; GrowthBook mention hints at a SQL-based secondary analysis layer but is unconfirmed.
3. **Real-time alerting** — beyond Amplitude anomaly detection and New Relic APM, no public info on data pipeline alerting (PagerDuty integration, dbt test alerting, etc.).
4. **Data team headcount** — no public org chart or team-size disclosure; the Amplitude case study only implies a small team (~2019 snapshot).
5. **Looker vs. Hex usage split** — Hex and Mode appear only as secondary mentions; unclear if they are production tools or exploratory alternatives.
6. **No GoFundMe engineering blog found** — no Medium publication or engineering.gofundme.com with technical posts; all evidence comes from third-party vendor case studies and job postings.
