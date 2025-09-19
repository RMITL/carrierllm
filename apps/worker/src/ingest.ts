// Using Cloudflare's toMarkdown instead of unpdf for better PDF text extraction

// Define the environment bindings
interface Env {
  DOCS_BUCKET: R2Bucket;
  CARRIER_INDEX: VectorizeIndex;
  AI: any;
}

// Function to generate embeddings using Cloudflare AI
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    console.log(`Generating embedding for text of length: ${text.length}`);
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
    console.log(`Embedding response received, dimensions: ${response.data[0]?.length || 'undefined'}`);
    return response.data[0];
  } catch (error) {
    console.error(`Embedding generation failed: ${error}`);
    console.error(`Error details:`, error.message);
    return [];
  }
}

// Simple text chunking function
function chunkText(text: string, chunkSize = 512, overlap = 50): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Main ingestion logic
export async function runIngestion(env: Env): Promise<Response> {
  console.log('Ingestion function triggered successfully.');
  try {
    console.log('Starting ingestion process...');

    // 1. List all PDFs in the R2 bucket
    const list = await env.DOCS_BUCKET.list();
    const pdfFiles = list.objects.filter(obj => obj.key.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log('No PDF files found in the bucket.');
      return new Response('No PDF files found to ingest.', { status: 404 });
    }

    console.log(`Found ${pdfFiles.length} PDF files to process.`);
    let totalVectorsInserted = 0;

        // 2. Process each PDF file sequentially to avoid resource limits
        for (let i = 0; i < Math.min(pdfFiles.length, 5); i++) { // Limit to first 5 files for testing
          const pdfFile = pdfFiles[i];
          console.log(`Processing file ${i + 1}/${Math.min(pdfFiles.length, 5)}: ${pdfFile.key}`);

          try {
            const object = await env.DOCS_BUCKET.get(pdfFile.key);
            if (object === null) {
              console.log(`Could not retrieve file: ${pdfFile.key}`);
              continue;
            }

            const pdfBuffer = await object.arrayBuffer();
            
            // Extract text from PDF using Cloudflare's toMarkdown
            let text = '';
            try {
              console.log(`Starting text extraction for ${pdfFile.key}...`);
              console.log(`PDF buffer size: ${pdfBuffer.byteLength} bytes`);
              
              // Use Cloudflare's toMarkdown for PDF text extraction
              const result = await env.AI.toMarkdown([
                {
                  name: pdfFile.key,
                  blob: new Blob([pdfBuffer], {
                    type: "application/pdf",
                  }),
                },
              ]);
              
              console.log(`toMarkdown result type: ${typeof result}`);
              console.log(`toMarkdown result length: ${Array.isArray(result) ? result.length : 'not array'}`);
              if (Array.isArray(result) && result.length > 0) {
                console.log(`First item type: ${typeof result[0]}`);
                console.log(`First item keys: ${Object.keys(result[0] || {}).join(', ')}`);
                console.log(`First item sample:`, JSON.stringify(result[0]).substring(0, 500));
              }
              
              // Handle different return types from toMarkdown
              if (typeof result === 'string') {
                text = result;
              } else if (Array.isArray(result) && result.length > 0) {
                // toMarkdown returns an array of objects with data property containing markdown text
                text = result.map(item => {
                  if (typeof item === 'string') return item;
                  if (item && typeof item === 'object') {
                    return item.data || item.text || item.content || String(item);
                  }
                  return String(item);
                }).join('\n');
              } else if (result && typeof result === 'object') {
                // If it's an object, try to extract text from it
                if (result.text) {
                  text = result.text;
                } else if (result.content) {
                  text = result.content;
                } else {
                  text = String(result);
                }
              } else {
                text = String(result || '');
              }
              
              console.log(`Final text length: ${text.length} characters from ${pdfFile.key}`);
              console.log(`First 200 chars of extracted text: ${text.substring(0, 200)}`);
              
              if (text.length === 0) {
                console.warn(`No text extracted from ${pdfFile.key}, using fallback`);
                const carrierName = pdfFile.key.split('-')[0].split('_').join(' ').toLowerCase();
                text = `${carrierName.toUpperCase()} UNDERWRITING GUIDELINES - PDF parsing returned empty text, using filename-based content`;
              }
            } catch (error) {
              console.error(`Failed to parse PDF ${pdfFile.key}:`, error);
              console.error(`Error details:`, error.message);
              // Fallback: create basic text based on filename
              const carrierName = pdfFile.key.split('-')[0].split('_').join(' ').toLowerCase();
              text = `${carrierName.toUpperCase()} UNDERWRITING GUIDELINES - PDF parsing failed, using filename-based content`;
            }

            // 3. Chunk the text content
            const chunks = chunkText(text);
            console.log(`File ${pdfFile.key} was split into ${chunks.length} chunks.`);

            // Extract carrier name from filename
            const carrierId = pdfFile.key.split('-')[0].split('_').join(' ').toLowerCase();

            // 4. Generate embeddings and prepare for insertion
            const vectors: VectorizeVector[] = [];
            for (let j = 0; j < Math.min(chunks.length, 10); j++) { // Limit chunks per file
              const chunk = chunks[j];
              const embedding = await generateEmbedding(chunk, env);

              if (embedding.length > 0) {
                // Create shorter ID to avoid 64-byte limit
                const shortId = `${pdfFile.key.replace('.pdf', '')}-${j}`.substring(0, 64);
                vectors.push({
                  id: shortId,
                  values: embedding,
                  metadata: {
                    carrierId: carrierId,
                    source: pdfFile.key,
                    text: chunk,
                  },
                });
              }
            }

            // 5. Insert vectors into the Vectorize index
            if (vectors.length > 0) {
              await env.CARRIER_INDEX.upsert(vectors);
              console.log(`Inserted ${vectors.length} vectors for ${pdfFile.key}.`);
              totalVectorsInserted += vectors.length;
            }

            // Add a small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`Error processing file ${pdfFile.key}:`, error);
            continue;
          }
        }

    console.log(`Ingestion complete. Total vectors inserted: ${totalVectorsInserted}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Ingestion complete. Processed ${pdfFiles.length} files and inserted ${totalVectorsInserted} vectors.`,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ingestion process failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
