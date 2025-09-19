# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CarrierLLM is a Retrieval-Augmented carrier placement assistant for insurance agents. The monorepo contains:

- **Agent-facing app** (`apps/app`) - React + Vite console with intake, recommendations, and analytics
- **Marketing site** (`apps/marketing`) - SaaS launch site
- **Cloudflare Worker** (`apps/worker`) - API backend for intake, recommendations, analytics, and content
- **UI package** (`packages/ui`) - Accessible component library with Storybook
- **Theme package** (`packages/theme`) - Design tokens and CSS variables

## Development Commands

### Getting Started
```bash
pnpm install
cp .env.example .env  # Populate secrets before running
```

### Running Services
```bash
# Run all services in parallel
pnpm dev

# Run specific services
pnpm --filter @carrierllm/worker dev    # Cloudflare Worker (wrangler dev on port 8787)
pnpm --filter @carrierllm/app dev       # React app (port 5175)
pnpm --filter @carrierllm/marketing dev # Marketing site (port 5174)
pnpm --filter @carrierllm/ui dev        # Storybook on port 6006
```

### Production Deployment (PM2)
```bash
# Start with PM2 - configured ports:
pm2 start start-app-pm2.cjs --name carrierllm-app           # Port 5175
pm2 start start-marketing-pm2.cjs --name carrierllm-marketing # Port 5174

# Restart only (use pm2 reload 26 for marketing app)
pm2 reload 26  # Marketing app
pm2 reload 23  # App
```

### Build & Quality
```bash
pnpm build      # Build all packages
pnpm lint       # ESLint across all packages
pnpm test       # Run Vitest suites (currently app only)
pnpm format     # Prettier formatting
```

### Testing Individual Components
```bash
pnpm --filter @carrierllm/app test      # Run app tests only
pnpm --filter @carrierllm/app build     # Build app only
```

### Worker Deployment
```bash
cd apps/worker
pnpm deploy     # Deploy to Cloudflare Workers
```

**Important**: After making changes to the worker (`apps/worker/src/`), you must redeploy for changes to take effect. This includes new API endpoints, database changes, or any backend modifications.

## Architecture

### Workspace Structure
This is a pnpm workspace with TypeScript, ESLint, and Prettier configured at the root. All packages share the same dev dependencies and linting rules.

### Core APIs (Cloudflare Worker)
**Production:** `https://carrierllm.com/api` (routed via `*.carrierllm.com/api`)
**Development:** `http://localhost:8787/api` (wrangler dev)

- `/api/intake/submit` - Process intake forms
- `/api/recommendations/:id` - Get carrier recommendations
- `/api/outcomes` - Log recommendation outcomes
- `/api/carriers/upload` - Upload carrier documents
- `/api/analytics/summary` - Analytics dashboard data

### Technology Stack
- **Frontend**: React 18, Vite, TanStack Query, React Router, Tailwind CSS
- **Backend**: Cloudflare Workers, itty-router
- **Database**: Cloudflare D1, R2 (document storage), Vectorize (embeddings)
- **Auth**: Clerk
- **Billing**: Stripe with metered usage (recommendation runs)
- **Testing**: Vitest, @testing-library/react
- **Validation**: Zod schemas

### Environment Variables
Required in `.env` for local development:
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_R2_BUCKET=carrierllm-docs`
- `CLOUDFLARE_VECTORIZE_INDEX=carrierllm-index`
- `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`
- `APP_URL`, `WWW_URL`
- `CLERK_SECRET_KEY`

### Performance Requirements
- P95 latency <= 4s for recommendations
- Every recommendation must have >= 1 citation
- Stripe provisioning within 30s

### Billing Structure
- Plans: Individual, Team, Enterprise
- Metered usage: recommendation runs
- Webhooks update tenant status (active, past_due, suspended)

## Development Notes

- Use `pnpm` as the package manager (specified in packageManager field)
- Storybook includes accessibility add-ons for the UI library
- Worker uses wrangler for local development and deployment
- All packages follow strict TypeScript configuration from `tsconfig.base.json`