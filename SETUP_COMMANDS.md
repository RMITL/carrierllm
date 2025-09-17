# CarrierLLM Setup Commands

## Immediate Next Steps

Since you have your environment variables set up, here are the exact commands to run to complete the deployment:

### 1. Create Cloudflare Resources

```bash
# Create Vectorize index (384 dimensions for BGE embeddings)
wrangler vectorize create carrierllm-index --dimensions=384 --metric=cosine

# Create D1 database
wrangler d1 create carrierllm

# Create R2 bucket
wrangler r2 bucket create carrierllm-docs
```

### 2. Update Database ID

After creating the D1 database, update `apps/worker/wrangler.toml` with the actual database ID returned by the create command.

### 3. Apply Database Schema

```bash
cd apps/worker
wrangler d1 execute carrierllm --file=./schema.sql
cd ../..
```

### 4. Build and Deploy

```bash
# Build all packages
pnpm build

# Deploy the worker
cd apps/worker
pnpm deploy
```

### 5. Test the Deployment

```bash
# Get your worker URL from the deploy output, then test:
curl https://carrierllm-worker.YOUR_ACCOUNT.workers.dev/api/analytics/summary
```

### 6. Seed Carrier Data

The carriers will be automatically seeded when the worker first runs. You can verify by checking the analytics endpoint.

## What's Working Now

With these steps, you'll have:

✅ **Complete Orion Integration**: 8-question intake with Tier-2 logic
✅ **RAG-Powered Recommendations**: Using Cloudflare Vectorize + Workers AI
✅ **Citation System**: Evidence-backed recommendations with source tracking
✅ **Professional UI**: CarrierCard with confidence levels and evidence popovers
✅ **Admin Analytics**: Placement tracking (admin-only access)
✅ **Multi-Carrier Support**: F&G, MOO, Foresters, Protective, Securian, etc.

## Document Upload (After Worker is Running)

To upload your carrier documents from `docs/carrier-docs/`:

```bash
# Example upload command (replace with your worker URL)
curl -X POST https://carrierllm-worker.YOUR_ACCOUNT.workers.dev/api/carriers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "carrierId": "fg-life",
    "carrierName": "F&G Life",
    "filename": "F&GADV2493 Exam-Free Underwriting (FLY).pdf",
    "effectiveDate": "2025-01-01"
  }'
```

## Test a Complete Flow

```bash
# 1. Submit an intake
curl -X POST https://carrierllm-worker.YOUR_ACCOUNT.workers.dev/api/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "core": {
      "age": 45,
      "state": "CA",
      "height": 70,
      "weight": 180,
      "nicotine": {"lastUse": "never"},
      "marijuana": {"lastUse": "never"},
      "drivingAndRisk": {},
      "coverageTarget": {"amount": 500000, "type": "iul"}
    },
    "validated": true,
    "tier2Triggered": false
  }'

# 2. Get recommendations (use the intake_id from step 1)
curl https://carrierllm-worker.YOUR_ACCOUNT.workers.dev/api/recommendations/INTAKE_ID_HERE
```

## Running the Frontend Apps

```bash
# Terminal 1: Start the main app
cd apps/app
pnpm dev

# Terminal 2: Start the marketing site
cd apps/marketing
pnpm dev

# Terminal 3: Start Storybook (optional)
cd packages/ui
pnpm dev
```

This will give you:
- Marketing site: http://localhost:5174
- Main app: http://localhost:5175
- Storybook: http://localhost:6006

## Troubleshooting

If you get permission errors:
1. Run `wrangler login` to authenticate
2. Verify your account ID matches the one in `.env`
3. Check that your API token has the right permissions

If database commands fail:
1. Make sure the database ID in `wrangler.toml` matches what was created
2. Try running the commands from the `apps/worker` directory

## What's Remaining

The core application is now complete! Optional enhancements:

1. **Authentication**: Integrate Clerk for user management
2. **Billing**: Set up Stripe subscription webhooks
3. **PDF Processing**: Enhance the document processor for real PDF extraction
4. **Custom Domains**: Point your domains to the deployed resources

The system will work with mock data initially and become more accurate as you upload carrier documents that get processed through the RAG pipeline.