# CarrierLLM Development Master Plan

This plan sequences the work needed to deliver the CarrierLLM carrier placement assistant and marketing site. It ties together the requirements across the PRD, developer guide, and design specs.

## Phase 0 - Foundations
- Establish monorepo scaffolding (app, marketing, shared packages).
- Configure pnpm workspaces, strict TypeScript, ESLint/Prettier, and git hooks.
- Prepare Cloudflare account, Wrangler config, and secrets management for local and staging.

## Phase 1 - Knowledge Base & Data Ops
- Compile carrier underwriting docs; define metadata schema (carrier, product, effective dates).
- Build ingestion pipeline to normalize documents into markdown chunks stored in R2 with references in D1.
- Configure Cloudflare Vectorize + AutoRAG indexing jobs; schedule refresh and change alerts.
- Set governance guardrails for document provenance, approvals, and versioning.

## Phase 2 - Intelligence Core
- Choose initial Workers AI model (7B fine-tuned) and create evaluation harness.
- Prototype retrieval chain covering the 8 intake questions with citations and reasoning output.
- Implement feedback loop storing recommendation runs, agent adjustments, and policy outcomes.
- Stand up offline evaluation metrics (precision@k, citation coverage, latency) to gate releases.

## Phase 3 - Application Experience
- Build intake wizard and chat interface per UI spec; wire Clerk/Auth0 and tenant-aware Stripe provisioning.
- Deliver recommendations view with carrier cards, fit percentages, citations, and workflow CTAs.
- Implement audit log dashboard, analytics summaries, and outcomes logging APIs.
- Harden roles/permissions and enforce PII minimization with encryption in transit and at rest.

## Phase 4 - Marketing & Growth
- Launch marketing site with the defined sections (Home, Features, Pricing, Compliance, Enterprise).
- Connect global call-to-action buttons to Stripe Checkout and app onboarding flows.
- Produce launch assets: brand kit, component screenshots (from Storybook), compliance messaging.

## Phase 5 - Quality & Observability
- Publish Storybook with accessibility and optional visual regression gating.
- Add automated testing (Vitest unit tests, Playwright intake flow, API contract checks).
- Deploy observability dashboards (Workers Logs, analytics) and incident response playbooks.

## Phase 6 - Launch & Iteration
- Run beta with pilot agencies; compare CarrierLLM fit scoring to human baselines.
- Iterate on pricing, usage metering, enterprise integrations, and model fine-tuning with captured feedback.
- Prepare post-launch roadmap: dark mode, custom carrier uploads, CRM integrations.

## Milestones & Dependencies
- **M1 (Weeks 1-3):** Repo and data ingestion MVP working; vector index built with sample docs.
- **M2 (Weeks 4-6):** Recommendation API plus intake UI running end-to-end with audit trail.
- **M3 (Weeks 7-8):** Marketing site deployed; Stripe + onboarding ready; Storybook available.
- **M4 (Week 10):** Compliance review completed, performance target (<=4s P95 latency) met, beta launch go/no-go.

Track progress via repo issues linked to these phases and update the plan as specifications evolve.
