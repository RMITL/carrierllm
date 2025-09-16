# **CarrierLLM (Orion GPT) — Inner‑Workings Master Document**

Audience: Engineering, ML, Product, DevOps, and Design

Scope: End‑to‑end technical blueprint to stand up a production web application that implements the Orion GPT underwriting intake assistant and RAG‑based carrier placement engine.

---

## **0\) What Orion GPT Must Do (Product Truths)**

* Conversation boot sequence: On every new chat, render the Ultra‑Simplified Intake (IUL/Annuity) — 8 prioritized questions: Age/DOB, Height/Weight (build), Nicotine/Tobacco and Marijuana use, Cardiac history, Diabetes, Cancer, Driving/DUI history, Coverage amount & risky avocations. These mirror the factors carriers weigh most. If any of these indicate risk or if coverage \> $1M, auto‑trigger Tier‑2 intake (expanded drill‑downs per condition/behavior).

   Tier‑2 triggers include: diabetes, cancer, cardiac history, nicotine or marijuana, DUI(s), risky avocations, nicotine replacement therapy (NRT), and coverage \> $1M.

* Validation & auto‑progression: Validate for missing core fields; if none missing and no Tier‑2 triggers, automatically run carrier match. If triggers or gaps exist, collect Tier‑2 first, then run match.

* Carrier match output:

  * Top 3 carriers \+ 1 stretch carrier, with client‑friendly reasoning bullets.

  * Percent likelihood of approval with confidence band (low/med/high).

  * Fast decline detection with one‑line rationale.

  * APS/requirements risk flagging.

  * Advisory notes (e.g., NRT often rated as tobacco).

  * Agent Tips (coaching bullets).

  * CTAs: surface carrier portal link \+ agent phone (from config).

  * IUL contribution guidance: recommend monthly premium \= 10× client age with structuring note about DB vs. accumulation and avoiding policy lapse/implosion.

  * If a recommended carrier isn’t in the agency lineup, present “placement support via partner channel” and silently log the gap.

* Quick Edit Mode: One‑field updates (e.g., A1C, last marijuana use) re‑evaluate the current fit only. If still uninsurable, prompt coverage on spouse/child and provide coaching bullets.

* Data logging: Persist structured JSON/CSV for every case (enables analytics and monthly Agency Carrier Gap Reports).

These behaviors anchor the PRD goals (60‑second intake, evidence‑backed fit %, doc management, outcome tracking, SaaS with billing) and acceptance constraints (P95 ≤ 4s; every recommendation has ≥1 citation; Stripe provisioning ≤ 30s).   

---

## **1\) System Overview & Architecture (Cloudflare‑native)**

Platform: Cloudflare Workers (TypeScript) \+ Workers AI (LLM) \+ Vectorize (vector index) \+ R1 (primary relational) \+ R2 (object storage, PDFs) \+ KV/Queues (caches & async jobs). Auth via Clerk/Auth0. Billing via Stripe (recurring \+ metered). Observability via Workers logs, traces, dashboards. 

Why R1? Use R1 as our mature metadata & content store for documents, chunks, embeddings metadata, rules, tenants, and analytics. Keep R2 for original PDFs and assets. Vectorize holds the dense vectors (ANN). This evolves the earlier D1/R2 layout to an R1‑centric design while retaining Vectorize for similarity search. AutoRAG jobs handle scheduled re‑index and drift checks. 

Required environment:

CLOUDFLARE\_ACCOUNT\_ID=…  
CLOUDFLARE\_API\_TOKEN=…  
CLOUDFLARE\_R2\_BUCKET=carrierllm-docs  
CLOUDFLARE\_VECTORIZE\_INDEX=carrierllm-index  
APP\_URL=https://app.carrierllm.com  
WWW\_URL=https://www.carrierllm.com  
CLERK\_SECRET\_KEY=…  
STRIPE\_SECRET=…  
STRIPE\_WEBHOOK\_SECRET=…

With acceptance: P95 latency ≤ 4s; ≥1 citation per recommendation; Stripe provisioning ≤ 30s. 

Multi‑tenant & billing: Plans \= Individual, Team, Enterprise. Metered usage on recommendation runs. Webhooks set tenant status: active, past\_due, suspended. CTA flow Marketing → Stripe Checkout → App onboarding.   

---

## **2\) Data Design (R1 \+ R2 \+ Vectorize)**

R1 tables (core):

* carriers (id, name, am\_best, portal\_url, agent\_phone, preferred\_tier\_rank, available\_states)

* products (id, carrier\_id, name, type: IUL/Term/Annuity/… , min\_age, max\_age, bands, underwriting\_path)

* documents (id, carrier\_id, title, effective\_date, version, r2\_key, doc\_type: underwriting\_guide/build\_chart/program\_flyer, provenance, hash)

* chunks (id, document\_id, seq, text, section, page, tokens, vector\_id)

* rules (id, carrier\_id, tag, condition\_json, effect\_json, source\_chunk\_id\[\])

* intakes (id, tenant\_id, payload\_json, validated, tier2\_triggered, created\_at)

* recommendations (id, intake\_id, model\_snapshot, fit\_json\[\], citations\[\], latency\_ms)

* outcomes (id, recommendation\_id, status: applied/approved/declined, final\_carrier\_id, notes, premium, face\_amount)

* advisories (id, recommendation\_id, text, source\_chunk\_id\[\])

* tenants (id, stripe\_customer\_id, plan, status, limits\_json)

* audit\_logs (id, actor\_id, event, entity, before, after, at)

R2: carrierllm-docs/{carrier}/{yyyy-mm}/{filename}.pdf for original PDFs and marketing assets. 

Vectorize index: carrierllm-index (embedding: e.g., intfloat/e5-large equivalent on Workers AI). Each vector maps to chunks.vector\_id. 

Governance: Document provenance, approvals, versioning, change alerts, scheduled refresh & indexing via AutoRAG jobs; publish/rollback gates. 

---

## **3\) Ingestion Pipeline (Carrier Docs → Chunks → Index)**

Sources & examples:

* Corebridge/American General (Term & Permanent underwriting matrices, APS rules, AU+ caps) — useful for age/amount requirement features. 

* F\&G Exam‑Free Underwriting — ages 0–60, up to $1M, 99% exam‑free through $1M (with caveats). 

* Foresters Accelerated UW \+ Full Guide — eligibility windows, knockout lists (e.g., marijuana within 12 months; certain cardiac/cancer/diabetes are knockouts for acceleration; also non‑medical limits).   

* Mutual of Omaha Fully UW — flexible cigar/marijuana allowances; build charts; age/amount grids; “Fit” credits. 

* Protective Highlights — dual reinsurance manual, impairment flex; aviation/avocation handling and quick quote desk.   

* Securian / Minnesota Life — WriteFit & mature assessments, build charts, tele‑interview and paramed matrices.   

* Symetra Swift — instant/accelerated/full paths, instant issuance criteria, disqualifiers. 

Normalization:

1. PDF → text (preserve page breaks).

2. Extract metadata (carrier, product, effective date, version, doc type).

3. Chunking: hierarchical: doc \> section \> chunk with chunk \~800–1200 tokens, overlap 10–15%.

4. Generate embeddings via Workers AI; insert into Vectorize with back‑reference to chunks.id.

5. Create rules where tables/knockouts are explicit (e.g., “Foresters Accelerated: marijuana use within past 12 months → no acceleration”) and link to source chunks for citations. 

Versioning & recency: Index latest effective document; keep previous versions for traceability and to explain why a past outcome differed. AutoRAG job checks for new versions and re‑indexes nightly. 

---

## **4\) Retrieval & Reasoning (RAG Chain for Underwriting)**

Query formation:

* Intake → Traits (e.g., age=54, BMI=32, last nicotine 8mo, marijuana=edibles weekly, DUI=2019, coverage=$750k IUL, scuba recreation).

* Build retrieval queries:

  * Eligibility (“accelerated exam‑free IUL age 50–60,” “build chart BMI windows,” “marijuana frequency/last use class impact,” “DUI look‑back”).

  * Requirements (age/amount paramed, APS triggers).

  * Special programs (instant/accelerated/write‑fit/au+ limits).

* Search Vectorize with trait‑augmented queries; add metadata filters (carrier in preferred tier first; product=IUL). Ensure at least one source chunk per recommended carrier for evidence. (Meets “≥1 citation” rule.) 

Ranking & fit scoring:

* Score \= Σ (rule matches × weight) – Σ (conflicts × penalty) \+ recency boost \+ preferred‑tier boost.

* Examples of rule features used:

  * F\&G: exam‑free up to $1M at 0–60; if \>60 or foreign national, caps vary; InstApproval program. 

  * Foresters Accelerated: face $100k–$1M, ages 18–55; knockouts include diabetes, cardiac issues, DUI/bankruptcy history, marijuana within past 12 months, etc. (still may qualify for full UW). 

  * MOO: cigar up to 24/yr allowed for NT with negative HOS; marijuana can be eligible for Preferred/Std+ in some cases; age/amount grid and BNP/EKG at higher ages/amounts. 

  * Securian (WriteFit & Mature): cognitive/mobility screens ≥70; third‑party financial docs \>$3M; tailored tele‑interview/paramed matrices. 

  * Symetra Swift: instant vs. accelerated vs. full UW paths; list of conditions disqualifying instant/accelerated (e.g., diabetes, CAD, cancer). 

  * Protective: dual manual underwriting; avocation/aviation handling with possible preferred even with flat extras. 

Confidence & declines:

* Likelihood of approval derived from match density (supporting chunks), strictness of rules matched, and contradiction count. Confidence band from retrieval dispersion (entropy).

* Fast decline if a hard knockout is triggered and corroborated in ≥2 sources (e.g., certain severe impairments for instant paths).

Citations:

* For each carrier recommendation, include at least one chunk citation with a short rationale and a link to the EvidencePopover in UI. 

---

## **5\) Orion Intake & Tier‑2 Logic**

Initial 8 (rendered as a clean bulleted list in chat UI):

1. Age & State

2. Height & Weight

3. Nicotine (cigs/vape/NRT) in last 24 months

4. Marijuana (type, frequency, last use; recreational vs. medical)

5. Cardiac history (MI, stents, angina, CHF)

6. Diabetes (type, A1C, meds)

7. Cancer history (type, stage, date)

8. Driving/DUI and risky avocations (aviation, scuba, racing; coverage target)

Tier‑2 prompts (only if triggered):

* Diabetes: type, diagnosis date, latest A1C & date, meds/compliance, complications (neuropathy, retinopathy).

* Cardiac: event type/date, interventions (stents/CABG), last echo/stress test, EF, meds, BP/cholesterol control.

* Cancer: site/stage/grade, treatment timeline, surveillance status.

* Tobacco/Nicotine: product, frequency, NRT type/dose/frequency/duration/last use (advise “usually rated as tobacco”).

* Marijuana: form (smoke/vape/edible), frequency, last use, recreational vs. medical (carrier accelerations often sensitive to last‑use window). Foresters explicitly knocks out marijuana within 12 months for acceleration. 

* DUI: dates, count, license status.

* Avocations: certification level, frequency, depth/speeds/heights.

* \>$1M coverage: financial justification (income multiple, estate need, key person); many carriers require financial supplements/TPD at higher amounts. Securian and MOO examples outline financial doc triggers at higher face amounts.   

---

## **6\) API Surface (Workers \+ Hono‑style examples)**

Endpoints (from Developer Guide):

* POST /api/intake/submit → {intake\_id}

* GET /api/recommendations/:id → ranked carriers, rationales, citations, advisories, tips, IUL contribution \= 10× age

* POST /api/outcomes → {recommendation\_id, status, notes, premium, face\_amount}

* POST /api/carriers/upload → ingest a PDF to R2, parse to chunks, index

* GET /api/analytics/summary → usage, fits, placement rate by carrier/line/tenant

   All must support tenant scoping & role checks. 

TypeScript models (abridged):

type Intake \= {  
  id: string; tenantId: string; createdAt: string;  
  core: { age: number; state: string; heightIn: number; weightLb: number; nicotine: {...}; marijuana: {...}; cardiac?: {...}; diabetes?: {...}; cancer?: {...}; dui?: {...}; avocations?: string\[\]; coverageTarget: number; };  
  tier2?: {...};  
  validated: boolean; tier2Triggered: boolean;  
};

type CarrierRec \= {  
  carrierId: string; product: string;  
  fitPct: number; confidence: 'low'|'medium'|'high';  
  reasons: string\[\]; declines?: string\[\];  
  citations: {chunkId: string; snippet: string}\[\];  
  advisories: string\[\]; apsLikely: boolean;  
  ctas: {portalUrl: string; agentPhone: string};  
};

Latency budget: 4s P95 end‑to‑end (ingress → retrieval → reasoning → response). Cache static rules and carrier metadata in KV; warm LLM. 

---

## **7\) Reasoner Implementation (LLM \+ Rules \+ Evidence)**

* Model: Workers AI 7B–13B instruction‑tuned with a small policy‑domain SFT (intake paraphrase; reason trace; evidence binding). Gate with an evaluation harness (precision@k of carrier choices, citation coverage, latency). 

* Prompt contract:

  1. Summarize the intake succinctly.

  2. Request top carriers (prefer Columbus, Allianz, Americo, F\&G, Mutual of Omaha) where plausible; if unsuitable, do not force.

  3. For each candidate, validate against retrieved rules; must attach at least one citation.

  4. Produce Top 3 \+ Stretch with fit% and confidence band; include advisory notes and APS flags.

  5. Compute IUL monthly contribution \= age × 10 and include structuring guidance.

---

## **8\) Carrier Knowledge: Encoding Examples (Rules & Citations)**

* F\&G Exam‑Free IUL: Generally no exams ages 0–60 up to $1M; may ask for phone interview or APS; not “accelerated UW” in the classic sense — it’s exam‑free by design. Use this to boost F\&G when clients fit age/amount and lack severe impairments. 

* Foresters Accelerated: Ages 18–55, faces $100k–$1M with Ht/Wt & lab surrogates; knockouts include diabetes, many cardiac diseases, marijuana within 12 months, DUIs, certain foreign travel, etc.; fallback to full UW or non‑medical lanes as appropriate. 

* MOO (Mutual of Omaha): Cigar up to 24/year can qualify as NT with negative HOS; marijuana may still qualify for Preferred/Std+; strong age/amount grids and Fit credits; specific BNP/EKG escalation by age and face. 

* Securian/Minnesota Life: WriteFit program, mature assessments with cognitive & mobility screens ≥70; TPD above certain face amounts; tele‑interview vs paramed matrices by age/amount. 

* Symetra Swift: Three underwriting paths (instant in \~18–25 min when ultra‑clean), explicit disqualifiers for instant/accelerated (e.g., diabetes, CAD, cancer). 

* Protective: Dual‑manual (Hannover & Swiss Re) — can improve tables for CAD; preferred even with some avocations if flat extra applied; pilot criteria and exclusions. Use in stretch recommendations for edge impairments.   

* Corebridge (AIG): Detailed age/amount term & permanent requirement grids (when labs/BNP/EKG/inspection kick in), AU+ caps. Use to estimate APS/paramed likelihood and set client expectations. 

---

## **9\) Frontend Application (UX, UI Library, A11y, Branding)**

Screens: Intake (stepper; 8 Qs), Chat intake (conversational with auto‑Tier‑2), Results (carrier cards with % fit, citations, APS flags, advisories, CTAs), Outcome logger, Admin (docs & analytics). 

UI system:

* Design tokens & style — professional fintech aesthetic; primary blue \#1E6BF1, accessible color pairs. Typography: Inter; 8px grid; cards 8px radius. 

* Tailwind a11y — AA contrast verified; component recipes for buttons, badges, banners; examples provided. 

* UI library (@carrierllm/ui) — primitives (Button, Badge, Banner, Card) and blocks (UsageMeter, CarrierCard with fitPct, reasons, onViewSource, onApply). 

* Storybook v8 — a11y addon, interactions; CI build/upload; optional visual regression. Include CarrierCard states (high/med/low fit). 

Evidence UX: Use EvidencePopover to show per‑carrier citations (doc title, effective date, page, snippet). Every rec must display ≥1 citation (system acceptance).   

Marketing site (www): Home (hero, trust), Pricing (plan cards, monthly/yearly toggle), Security, Docs/FAQ, Legal, Enterprise lead form. CTAs route to Stripe Checkout → App onboarding. 

---

## **10\) Security, Privacy, Compliance**

* PII minimization: store only fields necessary for underwriting; encrypt in transit; avoid PHI beyond what is in intake; redact free‑text where possible. No sensitive docs in chat history unless explicitly uploaded to the tenant vault. 

* RBAC: tenant‑scoped data access; roles: agent, admin, billing\_admin, read\_only.

* Audit: all ingestion, recommendations, outcomes logged with actor/time/version.

* Provenance: maintain doc provenance, hash, and effective\_date for each citation (chain‑of‑custody).

---

## **11\) Observability, QA, and SLOs**

* SLOs: P95 latency ≤ 4s; ≥1 citation/rec; Stripe provisioning ≤ 30s. Alert if breached. 

* Analytics: conversion (intake→rec→applied→placed), fit calibration, APS incidence, latency histograms.

* Automated tests: Vitest units, Playwright intake flow, contract checks for APIs, Storybook a11y gates.   

* Evaluation harness: offline testbed of synthetic & real (de‑identified) cases; measure precision@k, citation coverage, decline accuracy, time‑to‑first‑token. Gate releases. 

---

## **12\) Carrier CTAs & Config**

Store in carriers table: portal\_url, agent\_phone, available\_states. Keep per‑tenant overrides. This allows rendering Apply Now and Call Underwriting instantly inside Results. (Populate from carrier distribution agreements; editable in Admin.) 

---

## **13\) Runbooks (RDPs) & Operational Playbooks**

A) New carrier onboarding:

1. Add carrier record (name, AM Best, portal, phone).

2. Upload latest guides to R2; run /api/carriers/upload.

3. Validate chunk counts, embeddings, and rules extraction.

4. Publish; re‑run evaluation set; review top‑k drift.

B) Document refresh:

* Scheduled AutoRAG checks; if hash changed → re‑ingest \+ re‑index; notify owners; bump effective\_date. 

C) Incident: Latency regression:

* Check Vectorize p95, LLM cold starts, KV cache hit; roll back to prior model snapshot if needed. SLOs from Developer Guide. 

D) Stripe webhook failure:

* Reconcile tenant statuses (active, past\_due, suspended); replay DLQ; manual override path in Admin. 

E) Carrier Gap Report (monthly):

* Aggregate declined/placed by carrier vs. recommendations; identify top off‑panel carriers responsible for potential lift; produce partner‑placement suggestions per agency. (Admin export.)

---

## **14\) Example: End‑to‑End Flow (Happy Path)**

1. New chat → Orion shows 8 questions (bulleted). Agent responds.

2. No Tier‑2 triggers. Orion validates (DOB/state/ht/wt/tobacco/marijuana/cardiac/diabetes/cancer/DUIs/coverage/avocations present).

3. Retrieval: Query Vectorize for “IUL, ages 50–60 exam‑free/accelerated, BMI thresholds, marijuana last use, DUI lookback, scuba avocation limits,” prefer carriers: Columbus, Allianz, Americo, F\&G, MOO.

4. Rules:

   * F\&G exam‑free likely fits (age ≤60, amount ≤$1M). 

   * MOO may still offer NT with occasional cigar; marijuana possibly Preferred/Std+; build chart tolerated up to specific weights. 

   * If client had marijuana within 6 months and Foresters Accelerated considered, it’s a knockout (but full UW still possible). 

5. Reasoner: Produces Top 3 (say F\&G, MOO, Americo) \+ Stretch (Protective for mild CAD tolerance), with fits, confidence, advisories, APS flags, citations per carrier, and IUL premium \= age × 10\.   

6. Agent clicks Apply → portal link \+ phone from carrier config.

---

## **15\) Delivery Phasing (From Master Plan)**

* Phase 1: R1 schema & ingestion to R2/Vectorize with governance.

* Phase 2: Intelligence core (retrieval chain; evaluation harness).

* Phase 3: Application experience (intake wizard & chat, recommendations, audit, analytics, roles, PII minimization).

* Phase 4: Marketing site & CTAs wired to Stripe.

* Phase 5: Quality & observability (Storybook, a11y, visual tests, dashboards).

* Phase 6: Beta, iterate pricing/meters, fine‑tune model, roadmap.

   Milestones M1–M4 defined with sample timelines. 

---

## **16\) Developer Quick‑Start**

1. Provision Cloudflare account; set Wrangler & secrets; create R1, R2 bucket, Vectorize index. 

2. Seed carriers \+ config; upload sample PDFs (MOO, F\&G, Foresters, Securian, Symetra, Protective, Corebridge).           

3. Run ingestion job; verify chunks \+ embeddings; publish.

4. Bring up app \+ marketing site; wire Clerk/Auth0; Stripe plans & metering; webhook handlers.   

5. Execute evaluation harness with canned intakes; confirm SLOs & citation coverage. 

---

## **17\) Appendix A — Orion’s 8 Questions (Display Copy)**

* What’s the client’s age and state of residence?

* Height & weight today?

* Any nicotine use in the last 24 months (cigs, vape, cigars, chew, nicotine replacement)?

* Any marijuana use (type, frequency, last use; recreational or medical)?

* Any cardiac history (heart attack, stents, angina, heart failure)?

* Any diabetes (Type 1 or 2, last A1C, medications)?

* Any cancer history (type, stage, treatment dates)?

* Any DUIs or risky activities (aviation, scuba, climbing, racing)? Desired coverage amount?

Tier‑2 appears only if a trigger is present; additional questions as per Section 5\.

---

## **18\) Appendix B — Example Recommendation JSON**

{  
  "recommendationId": "rec\_123",  
  "top": \[  
    {  
      "carrier": "F\&G",  
      "product": "IUL",  
      "fitPct": 86,  
      "confidence": "high",  
      "reasons": \["Age ≤ 60 and face ≤ $1M fit exam-free lane", "Clean MVR; BMI within program build"\],  
      "citations": \[{"chunkId":"fg\_chunk\_42","snippet":"Exam-Free... eligible ages 0-60 through $1,000,000..."}\],  
      "advisories": \["Occasional APS possible without exam"\],  
      "apsLikely": false,  
      "ctas": {"portalUrl":"\<from config\>","agentPhone":"\<from config\>"}  
    }  
  \],  
  "stretch": {  
    "carrier": "Protective",  
    "product": "IUL",  
    "conditions": \["If mild CAD emerges, dual-manual approach may improve class"\],  
      "citations": \[{"chunkId":"prot\_chunk\_7","snippet":"dual reinsurance manuals... may improve CAD tables..."}\]  
  },  
  "premiumSuggestion": {"type":"IUL","monthly":550,"note":"10× age rule; adjust DB for accumulation vs payout; avoid lapse"}  
}

Citations reflect the exact chunks from F\&G and Protective docs.   

---

## **19\) Appendix C — UI/UX & Brand Checklist**

* CarrierCard shows fit badge (accessible colors), advisory pill(s), APS likelihood tag, and two CTAs. 

* A11y: run Storybook axe checks (no contrast violations); keyboard focus rings; ARIA roles on popovers/dialogs.   

* Marketing: pricing toggles monthly/yearly, trust strip, Security page with data handling summary, Legal (Terms/Privacy/DPA). 

---

## **20\) Governing Documents Index**

* Master Documentation hub linking PRD, Developer Guide, UI/UX, Style, Tailwind, UI library, Storybook, Master Plan. 

* Product Requirements (PRD) — scope, flows, acceptance criteria. 

* Developer Guide — env vars, core APIs, Stripe provisioning & webhooks, acceptance targets. 

* Development Master Plan — phases, milestones, governance. 

* Marketing Site Spec — content & CTA flow. 

* UI/UX & Component Guides — app screens, tokens, Tailwind recipes, Storybook.         

* Carrier Underwriting Sources — F\&G, Foresters (accelerated \+ full guide), Mutual of Omaha, Securian/Minnesota Life, Symetra Swift, Protective, Corebridge/AIG.                 

---

### **Final Notes for Engineering**

* This document assumes R1 as the primary data store (superset of prior D1 design), R2 for document blobs, Vectorize for embeddings, and Workers AI for LLM & embedding models — exactly the stack envisioned in the Development Master Plan with AutoRAG indexing and evaluation gates. 

* Adhere strictly to acceptance criteria (latency, citations, Stripe provisioning) from the Developer Guide. Wire the UI and APIs as specified and keep all carrier‑specific logic evidence‑backed with citations surfaced to agents in the UI. 