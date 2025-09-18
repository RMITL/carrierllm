import { z } from 'zod';

export interface ProcessedDocument {
  id: string;
  carrierId: string;
  title: string;
  effectiveDate: string;
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  id: string;
  seq: number;
  text: string;
  section?: string;
  page?: number;
  tokens: number;
  embedding?: number[];
}

const CHUNK_SIZE = 1000; // Target tokens per chunk
const CHUNK_OVERLAP = 150; // Overlap between chunks

/**
 * Process a PDF document into chunks for RAG indexing
 */
export async function processDocument(
  file: File | ArrayBuffer,
  metadata: {
    carrierId: string;
    title: string;
    effectiveDate: string;
    docType: string;
  },
  env: any
): Promise<ProcessedDocument> {
  const documentId = crypto.randomUUID();

  // Extract text from PDF
  const text = await extractTextFromPDF(file);

  // Create chunks
  const chunks = createChunks(text, documentId);

  // Generate embeddings for each chunk
  const chunksWithEmbeddings = await generateEmbeddings(chunks, env);

  return {
    id: documentId,
    carrierId: metadata.carrierId,
    title: metadata.title,
    effectiveDate: metadata.effectiveDate,
    chunks: chunksWithEmbeddings
  };
}

/**
 * Extract text from PDF using Cloudflare's PDF processing
 * For now, we'll use a simplified approach
 */
async function extractTextFromPDF(file: File | ArrayBuffer): Promise<string> {
  // TODO: Implement actual PDF text extraction
  // For now, return placeholder text that represents typical underwriting content
  return `
UNDERWRITING GUIDELINES

Section 1: Eligibility Requirements
- Ages: 18-85 years
- Face amounts: $50,000 to $10,000,000
- Medical requirements vary by age and amount

Section 2: Medical Underwriting
- Full medical underwriting required for amounts over $1,000,000
- Simplified issue available for ages 18-60, amounts up to $500,000
- Accelerated underwriting for qualified applicants

Section 3: Build Charts
- Height and weight requirements based on age and gender
- BMI calculations for risk assessment
- Special considerations for athletes and bodybuilders

Section 4: Tobacco and Nicotine
- Non-tobacco rates available after 12 months cessation
- Nicotine replacement therapy treated as tobacco use
- Occasional cigar use may qualify for non-tobacco rates

Section 5: Medical Conditions
- Diabetes: Well-controlled Type 2 may qualify for standard rates
- Cardiac: Recent interventions require detailed medical records
- Cancer: Survivorship periods vary by type and stage

Section 6: Financial Underwriting
- Income requirements: Minimum 10x annual income for death benefit
- Net worth considerations for large policies
- Business insurance requires financial documentation

Section 7: Aviation and Avocations
- Private pilot coverage available with experience requirements
- Scuba diving limits based on depth and certification
- Motorcycle racing and extreme sports may be excluded
`;
}

/**
 * Split text into overlapping chunks
 */
function createChunks(text: string, documentId: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentChunk = '';
  let chunkSeq = 0;
  let currentSection = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // Detect section headers
    if (trimmedSentence.match(/^Section \d+:|^SECTION \d+:|^Chapter \d+:/i)) {
      // Start new chunk if current one has content
      if (currentChunk.trim()) {
        chunks.push(createChunk(currentChunk, documentId, chunkSeq++, currentSection));
        currentChunk = '';
      }
      currentSection = trimmedSentence;
    }

    // Add sentence to current chunk
    const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

    // Check if we need to split (rough token estimation: ~4 chars per token)
    if (potentialChunk.length > CHUNK_SIZE * 4) {
      // Save current chunk
      chunks.push(createChunk(currentChunk, documentId, chunkSeq++, currentSection));

      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 4)); // Rough overlap
      currentChunk = overlapWords.join(' ') + '. ' + trimmedSentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk, documentId, chunkSeq++, currentSection));
  }

  return chunks;
}

function createChunk(
  text: string,
  documentId: string,
  seq: number,
  section?: string
): DocumentChunk {
  return {
    id: `${documentId}-chunk-${seq}`,
    seq,
    text: text.trim(),
    section,
    tokens: Math.ceil(text.length / 4), // Rough token estimation
  };
}

/**
 * Generate embeddings using Cloudflare Workers AI
 */
async function generateEmbeddings(
  chunks: DocumentChunk[],
  env: any
): Promise<DocumentChunk[]> {
  const chunksWithEmbeddings: DocumentChunk[] = [];

  for (const chunk of chunks) {
    try {
      // Use Cloudflare Workers AI for embeddings
      const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: chunk.text
      });

      chunksWithEmbeddings.push({
        ...chunk,
        embedding: response.data[0] || []
      });
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
      // Continue with chunk but no embedding
      chunksWithEmbeddings.push(chunk);
    }
  }

  return chunksWithEmbeddings;
}

/**
 * Store processed document in database and Vectorize
 */
export async function storeProcessedDocument(
  doc: ProcessedDocument,
  env: any
): Promise<void> {
  const now = new Date().toISOString();

  // Store document metadata
  await env.DB.prepare(
    `INSERT INTO documents (id, carrier_id, title, effective_date, version, r2_key, doc_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    doc.id,
    doc.carrierId,
    doc.title,
    doc.effectiveDate,
    '1.0',
    `documents/${doc.carrierId}/${doc.id}.json`,
    'underwriting_guide',
    now
  ).run();

  // Store chunks and insert into Vectorize
  const vectorInserts = [];

  for (const chunk of doc.chunks) {
    // Store chunk metadata in D1
    await env.DB.prepare(
      `INSERT INTO chunks (id, document_id, seq, text, section, tokens, vector_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      chunk.id,
      doc.id,
      chunk.seq,
      chunk.text,
      chunk.section || null,
      chunk.tokens,
      chunk.id, // Use chunk ID as vector ID
      now
    ).run();

    // Prepare for Vectorize insertion
    if (chunk.embedding && chunk.embedding.length > 0) {
      vectorInserts.push({
        id: chunk.id,
        values: chunk.embedding,
        metadata: {
          carrierId: doc.carrierId,
          documentId: doc.id,
          section: chunk.section || '',
          text: chunk.text.substring(0, 500) // Store partial text in metadata
        }
      });
    }
  }

  // Batch insert into Vectorize
  if (vectorInserts.length > 0) {
    try {
      await env.CARRIER_INDEX.upsert(vectorInserts);
      console.log(`Inserted ${vectorInserts.length} vectors for document ${doc.id}`);
    } catch (error) {
      console.error('Failed to insert vectors:', error);
    }
  }

  // Store original document in R2
  await env.DOCS_BUCKET.put(
    `documents/${doc.carrierId}/${doc.id}.json`,
    JSON.stringify(doc),
    {
      httpMetadata: { contentType: 'application/json' }
    }
  );
}

/**
 * Query similar chunks using Vectorize
 */
export async function querySimilarChunks(
  query: string,
  env: any,
  options: {
    topK?: number;
    carrierFilter?: string;
  } = {}
): Promise<Array<{
  chunkId: string;
  text: string;
  score: number;
  carrierId: string;
  documentId: string;
  section?: string;
}>> {
  try {
    // Generate embedding for query
    const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    });

    // Search Vectorize
    const searchResults = await env.CARRIER_INDEX.query(queryEmbedding.data[0], {
      topK: options.topK || 10,
      filter: options.carrierFilter ? { carrierId: options.carrierFilter } : undefined
    });

    // Enrich with chunk data from D1
    const results = [];
    for (const match of searchResults.matches || []) {
      const chunkData = await env.DB.prepare(
        'SELECT text, document_id, section FROM chunks WHERE id = ?'
      ).bind(match.id).first();

      if (chunkData) {
        results.push({
          chunkId: match.id,
          text: chunkData.text,
          score: match.score,
          carrierId: match.metadata?.carrierId || '',
          documentId: chunkData.document_id,
          section: chunkData.section
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to query similar chunks:', error);
    return [];
  }
}