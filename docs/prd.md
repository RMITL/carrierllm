# Product Requirements Document (PRD)
CarrierLLM is a RAG-based underwriting placement assistant. Agents answer 8 knockout questions -> the system retrieves carrier docs -> generates carrier fit % with explanations and citations -> tracks outcomes for feedback.

Goals:

Instant intake (60s)

% fit scoring with citations

Carrier doc management

Outcome tracking -> analytics -> fine-tuning

SaaS (individual/team/enterprise)

Intake Questions (8):

DOB & state

Coverage start + replacing/losing coverage

Nicotine use last 24mo

Hospitalizations/major conditions last 2yrs

Prescriptions + indications

Height & weight

DUIs/felonies/high-risk activities

Household size & income (health) OR occupation/income/coverage (life)

Tech stack:

Frontend: React (chatbot + forms, Tailwind)

Backend: Cloudflare Workers (TypeScript)

Storage: R2 (docs), D1 (metadata)

Retrieval: Vectorize + AutoRAG

Model: Fine-tuned 7B-13B LLM via Workers AI

Auth: Clerk/Auth0

Billing: Stripe (recurring + metered)

Observability: logs, tracing, dashboards

[See detailed PRD section for full scope, flows, and acceptance criteria.]


