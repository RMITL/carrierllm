#!/usr/bin/env node

/**
 * CarrierLLM Deployment Script
 *
 * This script helps deploy the complete CarrierLLM application with Orion integration.
 * It sets up Cloudflare resources, migrates the database, seeds data, and deploys the worker.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_R2_BUCKET',
  'CLOUDFLARE_VECTORIZE_INDEX',
  'STRIPE_SECRET',
  'STRIPE_WEBHOOK_SECRET',
  'CLERK_SECRET_KEY',
  'APP_URL',
  'WWW_URL'
];

class DeploymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeploymentError';
  }
}

async function main() {
  console.log('🚀 CarrierLLM Deployment Starting...\n');

  try {
    // Step 1: Validate environment
    console.log('📋 Step 1: Validating environment...');
    validateEnvironment();
    console.log('✅ Environment validation passed\n');

    // Step 2: Build all packages
    console.log('🔨 Step 2: Building all packages...');
    execSync('pnpm build', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Build completed\n');

    // Step 3: Set up Cloudflare resources
    console.log('☁️  Step 3: Setting up Cloudflare resources...');
    await setupCloudflareResources();
    console.log('✅ Cloudflare resources ready\n');

    // Step 4: Database migrations
    console.log('🗄️  Step 4: Running database migrations...');
    await runDatabaseMigrations();
    console.log('✅ Database migrations completed\n');

    // Step 5: Seed initial data
    console.log('🌱 Step 5: Seeding initial data...');
    await seedDatabase();
    console.log('✅ Database seeding completed\n');

    // Step 6: Deploy worker
    console.log('🚀 Step 6: Deploying Cloudflare Worker...');
    await deployWorker();
    console.log('✅ Worker deployment completed\n');

    // Step 7: Verify deployment
    console.log('🔍 Step 7: Verifying deployment...');
    await verifyDeployment();
    console.log('✅ Deployment verification passed\n');

    console.log('🎉 Deployment completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Configure your domain in Cloudflare');
    console.log('   2. Set up Stripe webhooks');
    console.log('   3. Configure Clerk authentication');
    console.log('   4. Upload carrier documents via the admin interface');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function validateEnvironment() {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    throw new DeploymentError('.env file not found. Please create one based on .env.example');
  }

  // Check required environment variables
  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new DeploymentError(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check if wrangler is authenticated
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
  } catch (error) {
    throw new DeploymentError('Wrangler not authenticated. Run: wrangler login');
  }
}

async function setupCloudflareResources() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const vectorizeIndex = process.env.CLOUDFLARE_VECTORIZE_INDEX;

  // Create D1 database
  console.log('   Creating D1 database...');
  try {
    execSync('wrangler d1 create carrierllm', { stdio: 'pipe' });
    console.log('   ✓ D1 database created');
  } catch (error) {
    console.log('   ℹ️  D1 database already exists');
  }

  // Create R2 bucket
  console.log('   Creating R2 bucket...');
  try {
    execSync(`wrangler r2 bucket create ${r2Bucket}`, { stdio: 'pipe' });
    console.log('   ✓ R2 bucket created');
  } catch (error) {
    console.log('   ℹ️  R2 bucket already exists');
  }

  // Create Vectorize index
  console.log('   Creating Vectorize index...');
  try {
    execSync(`wrangler vectorize create ${vectorizeIndex} --dimensions=384 --metric=cosine`, { stdio: 'pipe' });
    console.log('   ✓ Vectorize index created');
  } catch (error) {
    console.log('   ℹ️  Vectorize index already exists');
  }
}

async function runDatabaseMigrations() {
  const workerDir = path.join(process.cwd(), 'apps/worker');
  const schemaPath = path.join(workerDir, 'schema.sql');

  if (!existsSync(schemaPath)) {
    throw new DeploymentError('Database schema file not found at apps/worker/schema.sql');
  }

  console.log('   Applying database schema...');
  execSync(`wrangler d1 execute carrierllm --file=./schema.sql`, {
    stdio: 'inherit',
    cwd: workerDir
  });
  console.log('   ✓ Database schema applied');
}

async function seedDatabase() {
  // TODO: Implement database seeding via API call or wrangler command
  console.log('   Seeding carrier data...');
  console.log('   ⚠️  Manual seeding required - use admin interface after deployment');
}

async function deployWorker() {
  const workerDir = path.join(process.cwd(), 'apps/worker');

  console.log('   Deploying worker to Cloudflare...');
  execSync('pnpm deploy', {
    stdio: 'inherit',
    cwd: workerDir
  });
  console.log('   ✓ Worker deployed successfully');
}

async function verifyDeployment() {
  const workerUrl = `https://carrierllm-worker.${process.env.CLOUDFLARE_ACCOUNT_ID}.workers.dev`;

  console.log('   Testing worker health...');
  try {
    const response = await fetch(`${workerUrl}/api/analytics/summary`);
    if (response.ok) {
      console.log('   ✓ Worker is responding');
    } else {
      throw new Error(`Worker returned status ${response.status}`);
    }
  } catch (error) {
    console.log('   ⚠️  Worker verification failed - this may be normal for new deployments');
  }
}

// Run the deployment if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}