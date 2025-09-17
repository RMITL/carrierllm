# Orion GPT Integration Guide

This guide documents the integration of Orion GPT's carrier recommendation analysis engine into the CarrierLLM codebase. The integration implements a professional-grade AI-powered carrier placement system with evidence-based recommendations.

## Overview

The Orion integration transforms CarrierLLM from a basic recommendation system into a sophisticated AI-powered carrier placement platform with:

- **8-Question Intake System**: Streamlined client assessment focused on key underwriting factors
- **Tier-2 Triggered Expansion**: Intelligent follow-up questions based on risk factors
- **RAG-Powered Recommendations**: Evidence-backed carrier matching with citations
- **Professional UI Components**: Citation system with evidence popovers
- **Comprehensive Analytics**: Admin-only placement tracking and performance metrics

## Architecture Changes

### Database Schema Enhancements

The database has been expanded from a simple 3-table structure to a comprehensive 11-table system:

#### Core Tables
- `carriers` - Carrier information with portal URLs and contact details
- `products` - Insurance products linked to carriers
- `documents` - Carrier underwriting guides and documentation
- `chunks` - Document segments for RAG retrieval
- `rules` - Business rules extracted from documents

#### Intake & Recommendations
- `intakes` - Orion-structured intake data with tier-2 support
- `recommendations` - Enhanced recommendations with citations
- `outcomes` - Placement results tracking
- `advisories` - Risk and underwriting advisories

#### Multi-tenancy & Compliance
- `tenants` - Multi-tenant isolation with billing integration
- `audit_logs` - Comprehensive audit trail for compliance

### API Enhancements

#### New Endpoints
- Enhanced `/api/intake/submit` with Orion schema support
- Updated `/api/recommendations/:id` with citation data
- Admin-protected `/api/analytics/summary`
- Document management `/api/carriers/upload`

#### Data Structures
```typescript
// Orion Core Intake (8 questions)
type OrionCoreIntake = {
  age: number;
  state: string;
  height: number;
  weight: number;
  nicotine: { lastUse, type?, frequency? };
  marijuana: { lastUse, type?, medical? };
  cardiac?: { hasHistory, conditions?, details? };
  diabetes?: { hasCondition, type?, a1c? };
  cancer?: { hasHistory, type?, stage? };
  drivingAndRisk: { duiHistory?, riskActivities?, details? };
  coverageTarget: { amount, type };
};

// Enhanced Recommendations with Citations
type CarrierRecommendation = {
  carrierId: string;
  carrierName: string;
  product: string;
  fitPct: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  citations: CarrierCitation[];
  advisories: string[];
  apsLikely: boolean;
  ctas: { portalUrl, agentPhone };
};
```

### UI Components

#### New Components
- `OrionIntakeForm` - 8-question intake with intelligent Tier-2 triggers
- `EvidencePopover` - Citation display with document references
- Enhanced `CarrierCard` - Citations, advisories, confidence indicators

#### Key Features
- **Accessibility**: WCAG AA compliant with proper ARIA labels
- **Citation System**: Evidence-backed recommendations with source tracking
- **Responsive Design**: Mobile-optimized forms and popovers
- **Professional Styling**: Fintech-grade UI with consistent design tokens

## Setup Instructions

### 1. Environment Configuration

Copy and populate the environment variables:

```bash
cp .env.example .env
```

Required variables for Orion features:
```bash
# Cloudflare Services
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_R2_BUCKET=carrierllm-docs
CLOUDFLARE_VECTORIZE_INDEX=carrierllm-index

# Authentication
CLERK_SECRET_KEY=your_clerk_secret

# Application URLs
APP_URL=https://app.carrierllm.com
WWW_URL=https://www.carrierllm.com

# Stripe Billing
STRIPE_SECRET=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Migration

Apply the enhanced schema:

```bash
cd apps/worker
wrangler d1 execute carrierllm --file=./schema.sql
```

This creates all Orion tables while maintaining backward compatibility with existing data.

### 3. Cloudflare Resources

Create required Cloudflare resources:

```bash
# Create D1 database (if not exists)
wrangler d1 create carrierllm

# Create R2 bucket for documents
wrangler r2 bucket create carrierllm-docs

# Create Vectorize index for RAG
wrangler vectorize create carrierllm-index --dimensions=1536 --metric=cosine
```

### 4. Development Setup

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev
```

This starts:
- Marketing site: http://127.0.0.1:5174
- Main app: http://127.0.0.1:5175
- Worker API: http://127.0.0.1:8787 (run separately with `pnpm --filter @carrierllm/worker dev`)

## Key Features

### 1. Orion 8-Question Intake

The intake system implements Orion's methodology:

1. **Age & State** - Basic demographics
2. **Height & Weight** - Build assessment
3. **Nicotine Use** - Tobacco/NRT history (24-month lookback)
4. **Marijuana Use** - Cannabis usage (12-month lookback for accelerated UW)
5. **Cardiac History** - Heart conditions requiring disclosure
6. **Diabetes** - Type 1/2 diabetes screening
7. **Cancer History** - Oncology history
8. **DUI/Risk Activities + Coverage** - Driving record, avocations, and coverage target

### 2. Tier-2 Triggering Logic

Automatic expansion occurs when:
- Diabetes, cardiac, or cancer history indicated
- Any nicotine or marijuana use
- DUI history or high-risk activities
- Coverage amount > $1,000,000

### 3. Evidence-Based Recommendations

Each recommendation includes:
- **Fit Percentage** - Quantified match score
- **Confidence Level** - High/medium/low based on data quality
- **Detailed Reasons** - Specific factors supporting the recommendation
- **Citations** - Direct references to carrier underwriting guides
- **Advisories** - Important considerations (APS likelihood, exclusions)
- **Call-to-Action** - Direct links to carrier portals and phone numbers

### 4. IUL Premium Guidance

For IUL products, implements the "age × 10" rule:
- Monthly premium = client age × $10
- Includes structuring guidance for death benefit vs. accumulation
- Warnings about policy lapse risks

### 5. Citation System

The evidence popover displays:
- Document title and effective date
- Page number and section reference
- Exact text snippet from source
- Traceability for compliance and validation

## Carrier Knowledge Base

The system includes mock implementations of carrier-specific logic based on the inner workings document:

### F&G Life
- Exam-free IUL for ages 0-60, amounts ≤ $1M
- Clean build requirements
- No severe impairments for accelerated path

### Mutual of Omaha
- Flexible cigar allowances (≤24/year for non-tobacco)
- Marijuana consideration for Preferred/Standard+ classes
- Strong build chart accommodations

### Foresters Financial
- Accelerated UW for ages 18-55, $100k-$1M
- Marijuana within 12 months disqualifies acceleration
- Fallback to full underwriting available

### Protective Life
- Dual-manual underwriting advantage
- Better outcomes for complex cases
- Aviation/avocation handling with flat extras

## Security & Compliance

### Data Minimization
- Only essential underwriting data collected
- No unnecessary PHI retention
- Secure document storage in R2

### Audit Trail
- Complete logging of all intake submissions
- Recommendation tracking with model versions
- Outcome recording for placement analysis

### Access Controls
- Admin-only analytics endpoints
- Role-based permissions (planned with Clerk integration)
- Tenant isolation for multi-customer deployments

### Privacy Protection
- No proprietary carrier information in marketing
- Generic descriptions and capabilities only
- Source citations maintain transparency without exposing sensitive data

## Next Steps

The current implementation provides a solid foundation for the Orion system. Planned enhancements include:

1. **RAG Pipeline Implementation** - Replace mock data with actual Vectorize-powered retrieval
2. **Carrier Document Ingestion** - PDF processing and chunk generation
3. **Authentication Integration** - Complete Clerk implementation with role-based access
4. **Advanced Analytics** - Placement optimization and gap analysis
5. **Tier-2 Forms** - Dynamic expansion forms for triggered conditions

## Testing

Run the test suite to validate Orion integration:

```bash
# Run all tests
pnpm test

# Test specific components
pnpm --filter @carrierllm/app test
pnpm --filter @carrierllm/ui test
```

## Deployment

Deploy the enhanced system:

```bash
# Build all packages
pnpm build

# Deploy worker
cd apps/worker
pnpm deploy
```

The system maintains backward compatibility, so existing data and functionality remain intact during the upgrade.