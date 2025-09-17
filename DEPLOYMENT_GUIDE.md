# CarrierLLM Deployment Guide

This guide will help you deploy the complete CarrierLLM application with Orion GPT integration to production.

## Prerequisites

Before starting, ensure you have:

- [x] Cloudflare account with Workers, D1, R2, and Vectorize access
- [x] Stripe account for billing
- [x] Clerk account for authentication
- [x] Node.js 18+ and pnpm installed
- [x] Wrangler CLI installed and authenticated

## Quick Deployment

### 1. Clone and Setup

```bash
git clone <your-repo>
cd carrierllm
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:
```bash
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_R2_BUCKET=carrierllm-docs
CLOUDFLARE_VECTORIZE_INDEX=carrierllm-index

# Authentication
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_public_key

# Billing
STRIPE_SECRET=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key

# URLs
APP_URL=https://app.carrierllm.com
WWW_URL=https://www.carrierllm.com
```

### 3. Cloudflare Resources Setup

Run the setup script to create all required Cloudflare resources:

```bash
# Make scripts executable (on Unix systems)
chmod +x scripts/setup-vectorize.sh

# Create Vectorize index
./scripts/setup-vectorize.sh

# Create D1 database
wrangler d1 create carrierllm

# Create R2 bucket
wrangler r2 bucket create carrierllm-docs
```

Update `apps/worker/wrangler.toml` with your actual database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "carrierllm"
database_id = "your_actual_database_id_here"
```

### 4. Database Migration

```bash
cd apps/worker
wrangler d1 execute carrierllm --file=./schema.sql
```

### 5. Build and Deploy

```bash
# Build all packages
pnpm build

# Deploy worker
cd apps/worker
pnpm deploy
```

### 6. Seed Initial Data

After deployment, seed the database with carrier data:

```bash
# The carrier data will be automatically loaded when the worker starts
# You can verify by visiting: https://your-worker-url.workers.dev/api/analytics/summary
```

## Detailed Setup Steps

### Cloudflare Configuration

1. **D1 Database**:
   ```bash
   wrangler d1 create carrierllm
   # Note the database ID and update wrangler.toml
   ```

2. **R2 Bucket**:
   ```bash
   wrangler r2 bucket create carrierllm-docs
   ```

3. **Vectorize Index**:
   ```bash
   wrangler vectorize create carrierllm-index --dimensions=384 --metric=cosine
   ```

4. **Workers AI**: Automatically available with your Cloudflare account

### Stripe Setup

1. Create a Stripe account
2. Set up your products and pricing tiers:
   - Individual: $50/month
   - Team: $150/month
   - Enterprise: Custom pricing
3. Create a webhook endpoint pointing to: `https://your-worker-url.workers.dev/api/webhooks/stripe`
4. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Clerk Authentication Setup

1. Create a Clerk application
2. Configure sign-in/sign-up methods
3. Set up your application URLs:
   - Frontend API: `https://app.carrierllm.com`
   - Backend API: `https://your-worker-url.workers.dev`
4. Copy your keys to the environment variables

### Domain Configuration

1. **App Domain** (`app.carrierllm.com`):
   - Point to your main React application
   - Configure SSL/TLS

2. **Marketing Domain** (`www.carrierllm.com`):
   - Point to your marketing site
   - Configure SSL/TLS

3. **API Domain**: Use your worker URL or custom domain

## Document Upload

Once deployed, you can upload carrier documents:

### Using the API

```bash
curl -X POST https://your-worker-url.workers.dev/api/carriers/upload \
  -H "Content-Type: application/json" \
  -d '{
    "carrierId": "fg-life",
    "carrierName": "F&G Life",
    "filename": "fg-underwriting-guide.pdf",
    "effectiveDate": "2025-01-01"
  }'
```

### Bulk Upload Script

For your existing documents in `docs/carrier-docs/`:

```bash
# Create a script to upload all PDFs
# This will process each PDF and create vector embeddings
```

## Testing the Deployment

### 1. Health Check

```bash
curl https://your-worker-url.workers.dev/api/analytics/summary
```

### 2. Test Intake Submission

```bash
curl -X POST https://your-worker-url.workers.dev/api/intake/submit \
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
```

### 3. Test Recommendations

```bash
curl https://your-worker-url.workers.dev/api/recommendations/your-intake-id
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Cloudflare resources created
- [ ] Database migrated and seeded
- [ ] Worker deployed successfully
- [ ] Stripe webhooks configured
- [ ] Clerk authentication working
- [ ] Domains configured with SSL
- [ ] Carrier documents uploaded
- [ ] RAG pipeline tested
- [ ] Analytics dashboard accessible (admin only)
- [ ] Citation system working
- [ ] Performance monitoring enabled

## Monitoring and Maintenance

### Analytics

The system includes comprehensive analytics:
- Intake submission rates
- Recommendation accuracy
- Placement success rates
- System performance metrics

Access via: `https://app.carrierllm.com/analytics` (admin users only)

### Document Management

- Upload new carrier guides via the admin interface
- Documents are automatically processed and indexed
- Old versions are retained for audit purposes

### Performance Monitoring

Monitor key metrics:
- P95 latency < 4 seconds
- Citation coverage > 95%
- RAG retrieval accuracy
- System uptime

## Troubleshooting

### Common Issues

1. **Worker deployment fails**:
   - Check environment variables
   - Verify Cloudflare permissions
   - Ensure wrangler is authenticated

2. **Database connection errors**:
   - Verify D1 database ID in wrangler.toml
   - Check database migration status

3. **Vectorize queries fail**:
   - Ensure index exists and has correct dimensions
   - Check if documents have been processed

4. **No recommendations returned**:
   - Verify carrier data is seeded
   - Check if Vectorize has indexed documents
   - Fallback to mock data should still work

### Logs and Debugging

View worker logs:
```bash
wrangler tail carrierllm-worker
```

Check D1 database:
```bash
wrangler d1 execute carrierllm --command="SELECT COUNT(*) FROM carriers"
```

## Support

For issues with the deployment:
1. Check the troubleshooting section above
2. Review Cloudflare documentation
3. Check individual service status pages

## Next Steps

After successful deployment:
1. Upload your carrier documents
2. Configure custom domains
3. Set up monitoring and alerts
4. Train your team on the new system
5. Begin processing real client intakes