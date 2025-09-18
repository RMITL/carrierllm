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

## Data Policy

**NO MOCK DATA**: The application must never use mock, demo, or fake data for display purposes. All data should start with real zeros and populate through actual API usage.

- Analytics endpoints return empty arrays and zero values until real data is available
- History endpoints return empty arrays until users have actual activity
- Subscription endpoints return null/empty values until users have real subscriptions
- All UI components handle empty states gracefully
- Recommendation generation is the only exception (core business logic)

This ensures users see accurate, real data and prevents confusion from fake information.

[See Developer Guide section for DB schema, Stripe provisioning commands, webhook code, etc.]

