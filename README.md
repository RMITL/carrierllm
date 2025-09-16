# CarrierLLM

CarrierLLM is a Retrieval-Augmented carrier placement assistant for insurance agents. This monorepo contains the agent-facing app, marketing site, Cloudflare Worker APIs, and shared UI/theme packages.

## Workspace layout

- `apps/app` – React + Vite agent console with intake, recommendations, and analytics views.
- `apps/marketing` – Marketing site following the SaaS launch spec.
- `apps/worker` – Cloudflare Worker providing intake, recommendations, analytics, and content endpoints.
- `packages/ui` – Accessible component library used across surfaces with Storybook.
- `packages/theme` – Design tokens and CSS variables for consistent styling.
- `docs/` – Product, engineering, and design reference pulled from the master plan.

## Getting started

```sh
pnpm install
cp .env.example .env
# populate secrets, then run the stacks
pnpm --filter @carrierllm/worker dev
pnpm --filter @carrierllm/app dev
pnpm --filter @carrierllm/marketing dev
```

## Testing & quality

- `pnpm lint` – Run ESLint across packages.
- `pnpm test` – Execute Vitest suites (agent app today; expand as coverage grows).
- `pnpm --filter @carrierllm/ui dev` – Launch Storybook with accessibility add-ons.

Refer to `docs/master-plan.md` for the phased roadmap and the detailed specifications.
