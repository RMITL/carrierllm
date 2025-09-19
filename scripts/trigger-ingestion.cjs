#!/usr/bin/env node

/**
 * Script to trigger document ingestion on the deployed worker
 * This processes uploaded documents and makes them available for RAG queries
 */

const https = require('https');
const http = require('http');

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'https://app.carrierllm.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-super-secret-key';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function triggerIngestion() {
  console.log('🚀 Triggering document ingestion on deployed worker...\n');
  
  try {
    // Step 1: Check worker health
    console.log('1. Checking worker health...');
    const healthResponse = await makeRequest(`${WORKER_URL}/api/health`);
    
    if (healthResponse.status !== 200) {
      throw new Error(`Worker health check failed: ${healthResponse.status}`);
    }
    
    console.log('✅ Worker is healthy\n');
    
    // Step 2: Trigger document ingestion
    console.log('2. Triggering document ingestion...');
    const ingestionResponse = await makeRequest(`${WORKER_URL}/api/ingest-docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': ADMIN_SECRET
      }
    });
    
    if (ingestionResponse.status === 200) {
      console.log('✅ Document ingestion completed successfully');
      console.log('📊 Results:', JSON.stringify(ingestionResponse.data, null, 2));
    } else if (ingestionResponse.status === 401) {
      console.log('❌ Authentication failed. Please check ADMIN_SECRET environment variable.');
      console.log('💡 Set ADMIN_SECRET=your-super-secret-key in your environment');
    } else {
      console.log('❌ Ingestion failed:', ingestionResponse.status);
      console.log('📄 Response:', JSON.stringify(ingestionResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error triggering ingestion:', error.message);
    process.exit(1);
  }
}

async function processDocuments() {
  console.log('🔄 Processing uploaded documents...\n');
  
  try {
    // Process documents in batches
    const processResponse = await makeRequest(`${WORKER_URL}/api/carriers/process-documents?batch=5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (processResponse.status === 200) {
      console.log('✅ Document processing completed');
      console.log('📊 Results:', JSON.stringify(processResponse.data, null, 2));
    } else {
      console.log('❌ Document processing failed:', processResponse.status);
      console.log('📄 Response:', JSON.stringify(processResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error processing documents:', error.message);
  }
}

async function syncR2Documents() {
  console.log('🔄 Syncing R2 documents to database...\n');
  
  try {
    const syncResponse = await makeRequest(`${WORKER_URL}/api/carriers/sync-r2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (syncResponse.status === 200) {
      console.log('✅ R2 sync completed');
      console.log('📊 Results:', JSON.stringify(syncResponse.data, null, 2));
    } else {
      console.log('❌ R2 sync failed:', syncResponse.status);
      console.log('📄 Response:', JSON.stringify(syncResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error syncing R2 documents:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🔧 CarrierLLM Document Ingestion Tool\n');
  console.log(`🌐 Worker URL: ${WORKER_URL}`);
  console.log(`🔑 Admin Secret: ${ADMIN_SECRET ? '***' + ADMIN_SECRET.slice(-4) : 'Not set'}\n`);
  
  switch (command) {
    case 'ingest':
      await triggerIngestion();
      break;
    case 'process':
      await processDocuments();
      break;
    case 'sync':
      await syncR2Documents();
      break;
    case 'all':
      await syncR2Documents();
      await processDocuments();
      await triggerIngestion();
      break;
    default:
      console.log('Usage: node trigger-ingestion.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  ingest  - Trigger full document ingestion (PDF processing + vectorization)');
      console.log('  process - Process uploaded documents in batches');
      console.log('  sync    - Sync R2 documents to database');
      console.log('  all     - Run sync, process, and ingest in sequence');
      console.log('');
      console.log('Environment variables:');
      console.log('  WORKER_URL    - URL of the deployed worker (default: https://app.carrierllm.com)');
      console.log('  ADMIN_SECRET  - Admin secret for authentication (default: your-super-secret-key)');
      console.log('');
      console.log('Examples:');
      console.log('  node trigger-ingestion.js ingest');
      console.log('  WORKER_URL=https://your-worker.dev node trigger-ingestion.js all');
      break;
  }
}

main().catch(console.error);
