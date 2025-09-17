// Script to sync R2 documents to database

const WORKER_API_BASE = 'http://127.0.0.1:8788/api';

async function syncR2ToDatabase() {
  try {
    console.log('🔄 Syncing R2 documents to database...');

    const response = await fetch(`${WORKER_API_BASE}/carriers/sync-r2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Sync completed successfully!`);
    console.log(`📊 Results:`);
    console.log(`  - Total documents: ${result.total}`);
    console.log(`  - Newly synced: ${result.synced}`);
    console.log(`  - Already existed: ${result.skipped}`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

syncR2ToDatabase();