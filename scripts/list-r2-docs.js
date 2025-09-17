// Script to list documents in R2 bucket and populate database

const WORKER_API_BASE = 'http://127.0.0.1:8788/api';

async function listR2Documents() {
  try {
    // Test the worker health endpoint first
    console.log('Testing worker connection...');
    const healthResponse = await fetch(`${WORKER_API_BASE}/health`);

    if (!healthResponse.ok) {
      throw new Error(`Worker health check failed: ${healthResponse.status}`);
    }

    const health = await healthResponse.json();
    console.log('✅ Worker is healthy');
    console.log('Has R2 bucket:', health.environment.hasBucket);

    // List R2 objects using our new endpoint
    console.log('\n📋 Listing R2 documents...');
    const listResponse = await fetch(`${WORKER_API_BASE}/carriers/list-r2`);

    if (!listResponse.ok) {
      throw new Error(`Failed to list R2 objects: ${listResponse.status}`);
    }

    const r2Data = await listResponse.json();
    console.log(`Found ${r2Data.objects.length} objects in R2 bucket:`);

    r2Data.objects.forEach(obj => {
      const sizeKB = Math.round(obj.size / 1024);
      console.log(`- ${obj.key} (${sizeKB}KB)`);
    });

    // Now let's create database entries for these existing files
    if (r2Data.objects.length > 0) {
      console.log('\n🗂️ Creating database entries for existing R2 files...');
      await createDatabaseEntries(r2Data.objects);
    }

  } catch (error) {
    console.error('Failed to check worker:', error);
  }
}

async function createDatabaseEntries(objects) {
  // Extract carrier info from R2 keys and create database entries
  for (const obj of objects) {
    try {
      // Parse the key to extract carrier info
      const filename = obj.key.split('/').pop() || obj.key;
      const carrierInfo = extractCarrierInfo(filename);

      const documentEntry = {
        carrierId: carrierInfo.carrierId,
        carrierName: carrierInfo.carrierName,
        filename: filename,
        effectiveDate: new Date().toISOString().split('T')[0],
        r2Key: obj.key
      };

      console.log(`Adding DB entry for ${filename} -> ${carrierInfo.carrierName}`);

      // Here we would call an endpoint to create the DB entry without uploading content
      // Since the file is already in R2

    } catch (error) {
      console.error(`Failed to process ${obj.key}:`, error.message);
    }
  }
}

function extractCarrierInfo(filename) {
  const name = filename.replace('.pdf', '').toLowerCase();

  const carrierMappings = {
    'agl': 'american-general-life',
    'allianz': 'allianz',
    'americo': 'americo',
    'columbus': 'columbus-life',
    'corbridge': 'corbridge',
    'ethos': 'ethos',
    'f&g': 'fidelity-guarantee',
    'foresters': 'foresters',
    'moo': 'mutual-of-omaha',
    'plag': 'pacific-life',
    'plc': 'pacific-life',
    'prudential': 'prudential',
    'securian': 'securian',
    'symetra': 'symetra',
    'transamerica': 'transamerica'
  };

  for (const [key, carrierId] of Object.entries(carrierMappings)) {
    if (name.includes(key)) {
      return {
        carrierId,
        carrierName: carrierId.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      };
    }
  }

  const firstWord = name.split(/[\s_-]/)[0];
  return {
    carrierId: firstWord.toLowerCase(),
    carrierName: firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  };
}

listR2Documents();