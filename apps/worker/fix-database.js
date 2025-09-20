#!/usr/bin/env node

/**
 * Database fix script for CarrierLLM worker
 * Run this to fix missing tables and foreign key issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing CarrierLLM database schema...');

try {
  // Read the schema fix file
  const schemaFixPath = path.join(__dirname, 'webhook-schema-fix.sql');
  const schemaFix = fs.readFileSync(schemaFixPath, 'utf8');
  
  console.log('📄 Applying database schema fixes...');
  
  // Apply the schema fixes using wrangler
  execSync(`npx wrangler d1 execute carrierllm --file=${schemaFixPath}`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Database schema fixes applied successfully!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Deploy the updated worker: npm run deploy');
  console.log('2. Test the intake form');
  console.log('3. Check Clerk webhook delivery status');
  
} catch (error) {
  console.error('❌ Error applying database fixes:', error.message);
  console.log('');
  console.log('🔍 Manual steps:');
  console.log('1. Run: npx wrangler d1 execute carrierllm --file=webhook-schema-fix.sql');
  console.log('2. Deploy: npm run deploy');
  process.exit(1);
}
