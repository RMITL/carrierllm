# CarrierLLM

CarrierLLM is a Retrieval-Augmented carrier placement assistant for insurance agents. This monorepo contains the agent-facing app, marketing site, Cloudflare Worker APIs, and shared UI/theme packages.

## 🏗️ Architecture

### Workspace Structure
- `apps/app` - React + Vite agent console with intake, recommendations, and analytics
- `apps/marketing` - Marketing site with Clerk-integrated pricing and signup
- `apps/worker` - Cloudflare Worker API (D1, R2, Vectorize)
- `packages/ui` - Shared component library with Storybook
- `packages/theme` - Design tokens and CSS variables

### Technology Stack
- **Frontend**: React 18, Vite, TanStack Query, React Router, Tailwind CSS
- **Backend**: Cloudflare Workers, itty-router
- **Database**: Cloudflare D1 (SQLite), R2 (document storage), Vectorize (embeddings)
- **Auth & Billing**: Clerk (with native Stripe integration)
- **Testing**: Vitest, @testing-library/react
- **Process Management**: PM2 for production deployment

### Data Policy
**NO MOCK DATA**: The application never uses mock, demo, or fake data for display purposes. All data starts with real zeros and populates through actual API usage. This ensures users see accurate, real data and prevents confusion from fake information.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PM2 (for production deployment)
- Cloudflare account with Workers, D1, R2, and Vectorize access

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials:
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_API_TOKEN
# - VITE_CLERK_PUBLISHABLE_KEY (production key)
# - VITE_API_BASE_URL
```

### Development

#### Run all services locally
```bash
# Start all services in parallel
pnpm dev

# Or run specific services
pnpm --filter @carrierllm/worker dev    # Cloudflare Worker (wrangler dev)
pnpm --filter @carrierllm/app dev       # React app (port 5175)
pnpm --filter @carrierllm/marketing dev # Marketing site (port 5174)
pnpm --filter @carrierllm/ui dev        # Storybook (port 6006)
```

### Production Deployment

#### PM2 Process Management
The application uses PM2 for production process management with specific port assignments:

```bash
# Start with PM2 (configured for Windows)
pm2 start start-app-pm2.cjs --name carrierllm-app
pm2 start start-marketing-pm2.cjs --name carrierllm-marketing

# View running processes
pm2 list

# Monitor logs
pm2 logs carrierllm-app
pm2 logs carrierllm-marketing

# Restart processes
pm2 restart carrierllm-app carrierllm-marketing

# Save PM2 configuration
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

**Port Configuration:**
- App: Port 5175 (https://app.carrierllm.com)
- Marketing: Port 5174 (https://carrierllm.com)

#### Deploy Cloudflare Worker
```bash
cd apps/worker
pnpm deploy
```

**Note**: After making changes to the worker (`apps/worker/src/`), you must redeploy for changes to take effect. This includes new API endpoints, database changes, or any backend modifications.

## 📁 Project Structure

```
carrierllm/
├── apps/
│   ├── app/                 # Main React application
│   │   ├── src/
│   │   │   ├── main.tsx     # Application entry point
│   │   │   ├── App.tsx      # Root component with Clerk auth
│   │   │   ├── routes/      # Page components
│   │   │   ├── features/    # Feature modules (intake, recommendations)
│   │   │   └── lib/         # API client and utilities
│   │   └── index.html
│   ├── marketing/           # Marketing site
│   │   └── src/
│   │       └── components/
│   │           └── ClerkPricingSection.tsx  # Native Clerk billing
│   └── worker/              # Cloudflare Worker API
│       ├── src/
│       │   └── index.ts     # API routes and handlers
│       ├── schema.sql       # D1 database schema
│       └── wrangler.toml    # Worker configuration
├── packages/
│   ├── ui/                  # Shared components
│   └── theme/              # Design system
├── start-app-pm2.cjs       # PM2 wrapper for app (port 5175)
├── start-marketing-pm2.cjs # PM2 wrapper for marketing (port 5174)
└── CLAUDE.md               # AI assistant instructions
```

## 🔧 Configuration

### Environment Variables

#### App (.env.local)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://carrierllm.com/api
VITE_APP_URL=https://app.carrierllm.com
VITE_MARKETING_URL=https://carrierllm.com
```

#### Worker (.env)
```env
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLERK_SECRET_KEY=...
STRIPE_SECRET=...
STRIPE_WEBHOOK_SECRET=...
```

### Clerk Configuration
- Uses Clerk's native Stripe billing integration
- Production instance at clerk.carrierllm.com
- PricingTable component for subscription management
- UserProfile and OrganizationProfile for account management

## 🧪 Testing & Quality

```bash
# Run tests
pnpm test

# Type checking
pnpm --filter @carrierllm/app tsc --noEmit

# Linting
pnpm lint

# Format code
pnpm format

# Storybook for UI development
pnpm --filter @carrierllm/ui dev
```

## 🌐 API Endpoints

### Core Endpoints (Cloudflare Worker)
**Production:** `https://carrierllm.com/api` (routed via `*.carrierllm.com/api`)
**Development:** `http://localhost:8787/api` (wrangler dev)

- `POST /api/intake/submit` - Process intake forms
- `GET /api/recommendations/:id` - Get carrier recommendations
- `POST /api/outcomes` - Log recommendation outcomes
- `POST /api/carriers/upload` - Upload carrier documents
- `GET /api/analytics/summary` - Analytics dashboard data

## 📊 Performance Requirements
- P95 latency ≤ 4s for recommendations
- Every recommendation must have ≥ 1 citation
- Stripe provisioning within 30s
- TypeScript compilation must pass

## 🐛 Troubleshooting

### White Screen Issues
1. Check for compiled .js files in src/ - remove them if found
2. Verify VITE_CLERK_PUBLISHABLE_KEY is set to production key
3. Ensure PM2 processes are running on correct ports

### Port Conflicts
```bash
# Windows: Find and kill processes on port
netstat -ano | findstr :5175
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :5175
kill -9 <PID>
```

### PM2 Issues
```bash
# Reset PM2 if needed
pm2 delete carrierllm-app carrierllm-marketing
pm2 start start-app-pm2.cjs --name carrierllm-app
pm2 start start-marketing-pm2.cjs --name carrierllm-marketing
```

## 📚 Documentation
- `CLAUDE.md` - AI assistant context and instructions
- `docs/master-plan.md` - Phased roadmap and specifications
- Component documentation in Storybook

## 🤝 Contributing
1. Follow TypeScript and ESLint configurations
2. Ensure tests pass before committing
3. Use pnpm for package management
4. Reference existing patterns in codebase

## 📄 License
Proprietary - All rights reserved