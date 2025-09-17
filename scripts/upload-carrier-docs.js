import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_API_BASE = 'http://127.0.0.1:8787/api';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'carrier-docs');

// Extract carrier name from filename
function extractCarrierInfo(filename) {
  const name = filename.replace('.pdf', '').toLowerCase();

  // Map filenames to carrier identifiers
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

  // Try to match carrier name in filename
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

  // Default fallback - use first word of filename
  const firstWord = name.split(/[\s_-]/)[0];
  return {
    carrierId: firstWord.toLowerCase(),
    carrierName: firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  };
}

async function uploadDocument(filePath, filename) {
  try {
    const carrierInfo = extractCarrierInfo(filename);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');

    const payload = {
      carrierId: carrierInfo.carrierId,
      carrierName: carrierInfo.carrierName,
      filename: filename,
      effectiveDate: new Date().toISOString().split('T')[0], // Today's date
      content: base64Content
    };

    console.log(`Uploading ${filename} for ${carrierInfo.carrierName}...`);

    const response = await fetch(`${WORKER_API_BASE}/carriers/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully uploaded ${filename}`);
    return result;

  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function uploadAllDocuments() {
  try {
    const files = fs.readdirSync(DOCS_DIR);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF files to upload...`);

    let successCount = 0;
    let errorCount = 0;

    for (const filename of pdfFiles) {
      const filePath = path.join(DOCS_DIR, filename);
      const result = await uploadDocument(filePath, filename);

      if (result) {
        successCount++;
      } else {
        errorCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Upload Summary:`);
    console.log(`✅ Successful uploads: ${successCount}`);
    console.log(`❌ Failed uploads: ${errorCount}`);
    console.log(`📝 Total files: ${pdfFiles.length}`);

  } catch (error) {
    console.error('Failed to read documents directory:', error);
  }
}

// Run the upload
console.log('🚀 Starting carrier document upload...');
uploadAllDocuments().then(() => {
  console.log('📋 Upload process completed.');
}).catch(error => {
  console.error('💥 Upload process failed:', error);
});