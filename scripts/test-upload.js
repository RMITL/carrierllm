import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_API_BASE = 'http://127.0.0.1:8787/api';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'carrier-docs');

async function testUpload() {
  try {
    // Test with a small file first
    const files = fs.readdirSync(DOCS_DIR);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    // Sort by file size and take the smallest 3
    const fileStats = pdfFiles.map(file => ({
      name: file,
      size: fs.statSync(path.join(DOCS_DIR, file)).size
    })).sort((a, b) => a.size - b.size);

    console.log('Testing upload with 3 smallest files:');
    fileStats.slice(0, 3).forEach(file => {
      console.log(`- ${file.name} (${Math.round(file.size / 1024)}KB)`);
    });

    for (let i = 0; i < 3; i++) {
      const filename = fileStats[i].name;
      const filePath = path.join(DOCS_DIR, filename);

      // Extract carrier info from filename
      const name = filename.replace('.pdf', '').toLowerCase();
      let carrierId = 'test-carrier';
      let carrierName = 'Test Carrier';

      if (name.includes('allianz')) {
        carrierId = 'allianz';
        carrierName = 'Allianz';
      } else if (name.includes('americo')) {
        carrierId = 'americo';
        carrierName = 'Americo';
      } else if (name.includes('foresters')) {
        carrierId = 'foresters';
        carrierName = 'Foresters';
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Content = fileBuffer.toString('base64');

      const payload = {
        carrierId,
        carrierName,
        filename,
        effectiveDate: new Date().toISOString().split('T')[0],
        content: base64Content
      };

      console.log(`\nUploading ${filename}...`);

      const response = await fetch(`${WORKER_API_BASE}/carriers/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed: HTTP ${response.status}: ${errorText}`);
      } else {
        const result = await response.json();
        console.log(`✅ Success: ${result.message}`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

  } catch (error) {
    console.error('Test upload failed:', error);
  }
}

console.log('🧪 Testing carrier document upload...');
testUpload();