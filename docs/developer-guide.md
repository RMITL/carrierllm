# Developer Guide
Environment variables via .env:

CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_R2_BUCKET=carrierllm-docs
CLOUDFLARE_VECTORIZE_INDEX=carrierllm-index
STRIPE_SECRET=...
STRIPE_WEBHOOK_SECRET=...
APP_URL=https://app.carrierllm.com
WWW_URL=https://www.carrierllm.com
CLERK_SECRET_KEY=...
Core APIs:

/api/intake/submit

/api/recommendations/:id

/api/outcomes

/api/carriers/upload

/api/analytics/summary

Stripe billing:

Plans: Individual, Team, Enterprise

Metered usage: recommendation runs

Webhooks update tenant status (active, past_due, suspended)

Acceptance criteria:

P95 latency <= 4s

Every recommendation has >=1 citation

Stripe provisioning within 30s

[See Developer Guide section for DB schema, Stripe provisioning commands, webhook code, etc.]

