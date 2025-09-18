**Ultra‑Simplified Intake (IUL/Annuity) — 8 core questions** *(Answer in one line each if you’re starting an intake; otherwise feel free to skip.)*

1. **Age & sex** (age‑nearest is fine)

2. **Build** (height & weight)

3. **Tobacco/nicotine in last 12 months?** (cigs, vape, NRT/patch/gum, cigars)

4. **Marijuana in last 12 months?** (recreational vs medical)

5. **Any history of cardiac disease, diabetes, or cancer?** (brief: what/when)

6. **Driving:** any **DUI/reckless** in last 5 years? (Y/N)

7. **Desired product & coverage** (IUL vs annuity; target face or premium)

8. **Risky avocations/occupations?** (e.g., scuba, private aviation, racing, climbing)

---

# **CarrierLLM — Comprehensive Application Analytics Schema**

**Goal:** give CarrierLLM a complete, utilitarian analytics backbone that answers *who is using what*, *what creates value*, *where users get stuck*, *which carriers win and why*, and *how reliably the platform performs*—from the **individual agent** up to **org**, **team**, and **admin/backend** levels.

---

## **0\) North‑star structure**

* **North‑star metric:** *Placed policies per active agent per month (PPAM)* and *Approval rate of recommended top‑3 carriers.*

* **Value chain funnel (life/annuity):** Acquisition → **Intake Started** → Intake Complete → (Tier‑2 if triggered) → **Validation Pass** → **Carrier Match Run** → **CTAs (Portal/Phone) Clicked** → App Created → App Submitted → **Decision (Approved/Declined)** → Placed/Issued → Persistency (13‑mo, 25‑mo).

* **AARRR overlay:** Acquisition, Activation (first carrier match), Retention (WAU/MAU), Revenue (placed premium / platform revenue), Referral (invites sent/accepted).

---

## **1\) Core entities (conceptual)**

* **User (Agent)**, **Team**, **Organization (Agency/IMO/Group)**, **Role** (agent, team lead, org admin, super‑admin).

* **Client/Applicant**, **Case** (life vs annuity), **IntakeSession** (Ultra‑Simplified 8 Qs), **Tier2Session** (triggered detail sets), **ValidationResult**.

* **RuleEngineRun** (rules & scoring hits), **CarrierMatchRun**, **CarrierRecommendation** (rank, rationale, confidence).

* **AdvisoryNote** (e.g., “NRT usually rated as tobacco”), **RiskFlag** (cardiac/diabetes/cancer/tobacco/marijuana/DUI/avocation/\>$1M).

* **CTA** (carrier portal link, carrier agent phone dial), **Application** (created/submitted/decision), **APSRequest**, **QuickEdit**.

* **GapCarrier** (recommended carrier not in agency lineup), **GapReport** (monthly).

* **System** (services, model version, latency), **Billing/Plan**, **Experiment** (A/B).

---

## **2\) Event taxonomy (tracking plan)**

**Naming convention:** `object_action` (snake\_case). Include `event_version`. Avoid PII/PHI in free‑text; use hashed IDs.

### **Authentication & identity**

* `user_signed_up`, `user_logged_in`, `user_logged_out`, `user_invited`, `user_role_changed`

**Common properties for all events**  
 `event_id`, `event_ts`, `event_version`, `user_id`, `team_id`, `org_id`, `session_id`, `client_app` (web/mobile), `app_version`, `locale`, `ip_country`, `device`, `referrer`, `utm_*`

### **Intake & Tier‑2**

* `intake_started` — `case_id`, `product_type` (IUL/annuity/term), `source` (manual/import/api)

* `intake_question_answered` — `case_id`, `question_id`, `answer_type` (numeric/enum/bool), `valid` (bool)

* `intake_completed` — `case_id`, `duration_ms`, `completion_rate`

* `tier2_triggered` — `case_id`, `triggers` (array: diabetes/cancer/cardiac/tobacco/marijuana/dui/avocation/\>1m), `reason_keys`

* `tier2_section_completed` — `case_id`, `section` (diabetes/cancer/cardiac/…), `duration_ms`

* `validation_result` — `case_id`, `status` (pass/fail), `missing_fields` (array), `tier2_required` (bool)

### **Rules & matching**

* `rule_engine_run` — `case_id`, `rule_set_version`, `rules_evaluated_count`, `rules_hit` (array), `latency_ms`

* `carrier_match_run` — `case_id`, `match_engine_version`, `eligible_carriers_count`, `decline_fast_count`, `latency_ms`

* `carrier_recommendations_shown` — `case_id`, `top3` (carrier\_ids), `stretch` (carrier\_id), `ranked_list_size`, `avg_confidence`, `risk_flags` (array)

* `advisory_notes_shown` — `case_id`, `note_keys` (array)

* `red_flag_shown` — `case_id`, `flag_key` (e.g., `APS_likely`, `financial_justification_needed`)

### **CTAs & conversion**

* `cta_clicked` — `case_id`, `cta_type` (portal\_link/agent\_phone/download\_forms/email\_agent/illustration\_request), `carrier_id`, `target_uri_hash`

* `phone_call_initiated` — `case_id`, `carrier_id`, `call_provider` (e.g., Twilio), `call_id`

* `phone_call_ended` — `case_id`, `carrier_id`, `call_id`, `duration_sec`, `outcome` (connected/voicemail/no\_answer)

* `application_created` — `case_id`, `carrier_id`, `app_id`, `channel` (portal/eApp/paper), `owner_user_id`

* `application_submitted` — `app_id`, `carrier_id`, `submitted_ts`

* `decision_received` — `app_id`, `carrier_id`, `decision` (approved/declined/postponed/table\_rating), `decision_reason_keys` (array), `decision_ts`

* `policy_issued` — `app_id`, `issued_ts`, `face_amount`, `target_premium`, `annualized_premium`, `policy_id`

### **Quick Edit & salvage**

* `quick_edit_performed` — `case_id`, `field_key` (e.g., `a1c`, `weight`, `marijuana_frequency`), `old_value_hash`, `new_value_hash`

* `quick_edit_recalc_complete` — `case_id`, `improved` (bool), `prev_top3` (carriers), `new_top3` (carriers)

### **Contribution guidance (IUL)**

* `contribution_guidance_shown` — `case_id`, `age`, `recommended_monthly` (10× age), `note_variant` (max\_growth/more\_death\_benefit/avoid\_implosion)

* `contribution_guidance_overridden` — `case_id`, `override_amount`

### **Gap carriers & placement support**

* `gap_carrier_detected` — `case_id`, `carrier_id`

* `placement_support_requested` — `case_id`, `carrier_id`, `status` (started/completed)

### **Admin & configuration**

* `carrier_catalog_updated`, `phonebook_verified`, `portal_link_verified` — `carrier_id`, `status`, `verified_by`

* `rule_set_published` — `rule_set_version`, `published_by`

### **System/product health**

* `api_request` — `service` (rules/model/match/telephony), `route`, `status_code`, `latency_ms`, `cold_start` (bool)

* `error_logged` — `severity`, `component`, `error_code`, `msg_hash`

* `ml_inference_run` — `model_name`, `model_version`, `input_tokens`, `output_tokens`, `latency_ms`, `cache_hit` (bool), `safety_blocked` (bool)

* `experiment_exposure` — `exp_key`, `variant`, `unit` (user/org), `assignment_ts`

### **Billing & licensing**

* `seat_assigned`, `seat_revoked`, `plan_changed`, `invoice_paid` — `plan_tier`, `seats`, `mrr_delta`

**User properties** (profile): `license_tier`, `role`, `tenure_days`, `region/state`, `team_size_band`.  
 **Case properties** (sticky context): `case_type`, `state`, `age_band`, `coverage_band`, `risk_flags`.

---

## **3\) Metrics & KPIs by level**

### **A) Individual user (Agent)**

**Activation & engagement**

* First‑week activation: % of new agents with ≥1 `carrier_match_run` in 7 days

* DAU/WAU/MAU; **Stickiness** \= DAU/MAU

* Median time **Intake → Carrier Match**; **Match latency (p95)**

**Throughput & quality**

* Intakes started/completed per week

* Tier‑2 trigger rate & completion rate

* Validation failure rate (with top missing fields)

**Conversion**

* Top‑3 **CTA CTR** (portal/call)

* App created rate per case; Submission rate; **Approval rate** overall & by **recommended carrier**

* **Fast declines detected** (pre‑empted dead‑ends)

**Earnings proxy**

* Placed policies, target premium sum, **PPAM** (per agent)

* IUL **contribution guidance acceptance rate**; override frequency

**Coaching**

* Quick Edit usage; **Rescue rate** (decline → approved after Quick Edit)

* Advisory notes opened vs ignored; post‑note improvements

---

### **B) Team user (Team lead/member)**

* **Team adoption:** Active agents, sessions/agent, match runs/agent

* **Placement**: approvals/declines, avg table rating, **carrier mix** (share of placed by carrier/product)

* **Risk profile mix:** incidence of flags (DUI, \>$1M, diabetes, etc.), APS‑likely rate

* **Funnel health by step:** drop‑offs & median time per step

* **Training opportunities:** common validation failures, Tier‑2 sections with longest durations

* **Gap carriers impact:** \#cases with gap carrier; **placement support completion rate**

* **CSAT (if collected)** & issue tags

---

### **C) Organization‑wide (Agency/IMO)**

* **Active seats**, **license utilization**, net seat growth

* **Revenue:** placed premium, est. comp proxy, MRR/ARR (platform)

* **Approval rate by carrier**, **time‑to‑decision**, decline reason distribution

* **Carrier performance leaderboard** (top‑3 recommend → approval %)

* **Feature adoption:** Quick Edit, advisory notes, Tier‑2 completion, telephony usage

* **Compliance:** PHI/PII events (zero tolerated), **access audits passed**, data retention adherence

* **Gap Carrier Report (monthly):** top missing carriers ranked by lost approvals; projected lift if added

---

### **D) Admin / Backend (Product, SRE, Data)**

**Reliability & performance**

* API success rate, **p50/p95 latency** per service, error budgets, uptime

* Match engine p95 latency; **ML inference** token costs & latency; cache hit rate

**Data quality & pipeline**

* Event loss %, schema drift incidents, late‑arriving data %, dbt test pass rate

* Personally sensitive field leakage (target \= 0), redactions applied

**Model & rules efficacy**

* A/B win rate on funnels; **Recommendation accuracy** (top‑3 shown → approved)

* Rule coverage (rules\_hit distribution), dead‑rules (never hit), rule conflicts detected

**Security & governance**

* RBAC checks, admin actions audit, failed login spikes, access reviews completed

---

## **4\) Data model (warehouse)**

### **Star schema (key tables)**

**Dimensions**

* `dim_user(user_id, org_id, team_id, role, license_tier, region, tenure_days, created_at, …)`

* `dim_org(org_id, org_name, plan, seats, industry, region, …)`

* `dim_team(team_id, org_id, team_name, …)`

* `dim_carrier(carrier_id, name, rating, portal_domain, agent_phone, preferred_tier_rank)`

* `dim_case(case_id, org_id, user_id, case_type, state, age_band, coverage_band, risk_flags, created_at, …)`

* `dim_event(event_key, event_version, owner_component)`

* `dim_rule(rule_id, version, category)`

* `dim_cta(cta_type, description)`

* `dim_time(date_key, y, q, m, w, dow)`

**Facts**

* `fact_events` (immutable, slim): `event_id`, `event_ts`, foreign keys \+ event‑specific columns (e.g., `latency_ms`)

* `fact_sessions(user_id, session_id, start_ts, end_ts, duration_sec)`

* `fact_cases(case_id, created_ts, closed_ts, status)`

* `fact_matches(case_id, run_id, rule_set_version, eligible_carriers_count, latency_ms)`

* `fact_recommendations(run_id, rank, carrier_id, confidence, stretch_flag)`

* `fact_cta(case_id, cta_type, carrier_id, clicked_ts)`

* `fact_calls(call_id, case_id, carrier_id, started_ts, duration_sec, outcome)`

* `fact_applications(app_id, case_id, carrier_id, created_ts, submitted_ts, decision, decision_ts, table_rating, premium, face_amount)`

* `fact_quick_edits(case_id, field_key, edited_ts)`

* `fact_gap_carriers(case_id, carrier_id, detected_ts, resolved_ts)`

* `fact_system(api_route, status_code, latency_ms, ts)`

* `fact_billing(org_id, mrr, seats, invoice_ts)`

**Derived marts (dbt)**

* `user_day` (per user per day KPIs)

* `org_week`, `team_week`

* `funnel_case` (one row per case with step timestamps, step durations, drop‑off step)

* `recommendation_accuracy` (did top‑3 include the approved carrier?)

* `carrier_performance` (approval rates/time‑to‑decision by carrier/product/state/risk mix)

* `gap_impact` (lost approvals attributable to missing carriers)

* `experiment_results` (by variant)

---

## **5\) Metric definitions (precise)**

* **Activation rate (7‑day):** `COUNT(DISTINCT user_id with ≥1 carrier_match_run in D0–D6) / COUNT(DISTINCT new_users in D0)`

* **Intake completion rate:** `intake_completed / intake_started`

* **Tier‑2 incidence:** `tier2_triggered / intake_completed`

* **Validation pass rate:** `validation_result(status='pass') / validation_result(all)`

* **CTA CTR:** `cta_clicked(top3 portal/phone) / carrier_recommendations_shown`

* **Submission rate:** `application_submitted / application_created`

* **Approval rate:** `decision_received(approved) / decision_received(all)`

* **Recommendation accuracy:** `% of approved apps where approved carrier ∈ top‑3 shown`

* **Quick Edit rescue rate:** `approved_after_quick_edit / cases_with_quick_edit`

* **Match latency p95:** percentile of `carrier_match_run.latency_ms`

* **PPAM:** `policies_issued / active_agents_month`

---

## **6\) Funnels & cohorts**

**Primary funnel (case‑level):**  
 Start → Intake Completed → (Tier‑2 if triggered) → Validation Pass → Match Run → Recommendations Shown → CTA Clicked → App Created → App Submitted → *Approved*

**Cohorts:** by **agent tenure**, **case type (IUL/annuity)**, **risk flags**, **coverage band**, **state**, **team**, **carrier lineup completeness**, **month of first activation**.

---

## **7\) Dashboards (by audience)**

**Agent (personal)**

* Today’s cases, stuck step, advisory notes to review

* Top‑3 carriers performance for your cases

* Quick Edit suggestions

**Team Lead**

* Adoption heatmap (agents × week)

* Drop‑off by step & common validation misses

* Carrier mix & approval rates; training flags

**Org Admin**

* Seats & utilization, PPAM, approval rate by carrier/state/product

* Gap Carrier Report w/ projected lift and “partner channel” utilization

* Compliance (access, PHI events, retention)

**Product/Engineering**

* SLOs (latency/uptime), event loss, model cost/latency, rules coverage

* Recommendation accuracy trends; experiment outcomes

---

## **8\) Privacy, security, governance**

* **Data minimization:** never log free‑text PHI/PII; hash client identifiers; store DOB/ZIP only in **restricted** tables; events carry **banded** attributes (age\_band, coverage\_band).

* **PII catalog & tags:** field‑level tags (`pii_s`, `phi`, `sensitive`) with pipeline redaction.

* **Access:** role‑based row‑level security: agents → own cases; team leads → team; org admins → org; super‑admin → aggregated only.

* **Retention:** raw events 13 months; aggregate marts 36 months; call audio opt‑in only and separate store; right‑to‑erasure workflow.

* **Audit:** admin actions, rule publishes, catalog changes.

* **Compliance:** HIPAA‑aligned safeguards for health‑adjacent data; BAA where applicable.

---

## **9\) Instrumentation snippets (examples)**

### **`carrier_match_run` (v1)**

`{`  
  `"event_key": "carrier_match_run",`  
  `"event_version": 1,`  
  `"event_ts": "2025-09-18T14:22:10Z",`  
  `"user_id": "u_abc123",`  
  `"team_id": "t_45",`  
  `"org_id": "o_9",`  
  `"session_id": "s_789",`  
  `"case_id": "c_456",`  
  `"match_engine_version": "2025.09.1",`  
  `"eligible_carriers_count": 7,`  
  `"decline_fast_count": 2,`  
  `"latency_ms": 412`  
`}`

### **`carrier_recommendations_shown` (v1)**

`{`  
  `"event_key": "carrier_recommendations_shown",`  
  `"event_version": 1,`  
  `"event_ts": "2025-09-18T14:22:11Z",`  
  `"user_id": "u_abc123",`  
  `"case_id": "c_456",`  
  `"top3": ["car_columbus", "car_allianz", "car_americo"],`  
  `"stretch": "car_fg",`  
  `"ranked_list_size": 6,`  
  `"avg_confidence": 0.78,`  
  `"risk_flags": ["tobacco", "bmi_high"]`  
`}`

### **`cta_clicked` (v1)**

`{`  
  `"event_key": "cta_clicked",`  
  `"event_version": 1,`  
  `"event_ts": "2025-09-18T14:22:25Z",`  
  `"user_id": "u_abc123",`  
  `"case_id": "c_456",`  
  `"cta_type": "portal_link",`  
  `"carrier_id": "car_columbus",`  
  `"target_uri_hash": "h_98f1"`  
`}`

### **`decision_received` (v1)**

`{`  
  `"event_key": "decision_received",`  
  `"event_version": 1,`  
  `"event_ts": "2025-09-23T16:03:05Z",`  
  `"app_id": "app_001",`  
  `"case_id": "c_456",`  
  `"carrier_id": "car_columbus",`  
  `"decision": "approved",`  
  `"decision_reason_keys": ["standard_rate"],`  
  `"table_rating": "standard"`  
`}`

---

## **10\) Carrier‑specific analytics (preferred tier emphasis)**

Track **exposure, click‑through, approval rate, time‑to‑decision, and decline reasons** for: **Columbus Life, Allianz, Americo, F\&G, Mutual of Omaha**.  
 Add **advisory‑note opens** and **CTA usage** per carrier (e.g., portal link vs agent phone). Surface weekly to org admins; feed **Gap Carrier Report** when non‑preferred carriers consistently outperform lineup.

---

## **11\) Quick Edit Mode metrics**

* Usage per case; most edited fields (A1C, weight, marijuana frequency, tobacco last use).

* **Recalc delta:** change in recommendation confidence and top‑3 overlap.

* **Outcome lift:** approvals attributable to Quick Edit (vs matched controls).

* Coaching: which edits most often rescue a case.

---

## **12\) APS & underwriting friction**

* `red_flag_shown(flag_key='APS_likely')` rate by risk profile.

* APS request timestamps; **added cycle time**; **approval delta** with vs without APS.

* Identify providers/conditions causing outsized delays.

---

## **13\) Data pipeline & operations (reference)**

* **Ingest:** event SDKs (web/mobile/server), OpenTelemetry, queue/stream (Kafka/Kinesis).

* **ELT:** land raw → warehouse (Snowflake/BigQuery/Redshift) → dbt transforms → marts.

* **Quality:** schema registry, contract tests, PII scanners, SLAs for delivery (≤10 min).

* **Semantic layer:** versioned metric definitions (YAML) to prevent KPI drift.

* **Observability:** lineage, freshness alerts, anomaly detection on key KPIs.

---

## **14\) Initial dashboards & queries (SQL sketches)**

**Recommendation accuracy (org‑month)**

`SELECT org_id, DATE_TRUNC(month, decision_ts) AS month,`  
  `AVG(CASE WHEN approved_carrier_in_top3 THEN 1 ELSE 0 END) AS top3_accuracy`  
`FROM recommendation_accuracy`  
`GROUP BY 1,2;`

**Carrier leaderboard (approval rate & time‑to‑decision)**

`SELECT carrier_id,`  
  `COUNT(*) AS apps,`   
  `AVG(CASE WHEN decision='approved' THEN 1 ELSE 0 END) AS approval_rate,`  
  `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (decision_ts - submitted_ts))/3600) AS ttd_hours_p50`  
`FROM fact_applications`  
`GROUP BY 1`  
`ORDER BY approval_rate DESC, ttd_hours_p50 ASC;`

**Case funnel (drop‑off by step)**  
 `funnel_case` → bar chart of % reaching each step \+ median time per step.

---

## **15\) Rollout plan**

1. **Week 1–2:** implement common envelope \+ 10 priority events (intake, tier‑2, validation, match, recommendations, CTA, app create/submit/decision).

2. **Week 3–4:** add Quick Edit, advisory, gap carriers, contribution guidance, telephony; ship Agent/Team/Org dashboards.

3. **Week 5+:** backend SLOs, model telemetry, APS flow, experiment plumbing; Gap Carrier Report automation.

---

### **Deliverables you can hand to engineering today**

* This **tracking plan** (events \+ properties)

* **DB schema** (dims/facts) and **dbt** model list

* **Metric definitions** (section 5\) as a single source of truth

* **Dashboards** per audience (section 7\)

