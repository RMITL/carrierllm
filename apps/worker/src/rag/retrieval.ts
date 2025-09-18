import { querySimilarChunks } from './document-processor';

export interface Citation {
  chunkId: string;
  snippet: string;
  documentTitle: string;
  effectiveDate: string;
  page?: number;
  section?: string;
  score: number;
}

/**
 * Retrieve citations for a given query using RAG
 */
export async function retrieveCitations(
  query: string,
  env: any,
  options: {
    topK?: number;
    carrierId?: string;
    scoreThreshold?: number;
  } = {}
): Promise<Citation[]> {
  try {
    // Query similar chunks from Vectorize
    const chunks = await querySimilarChunks(query, env, {
      topK: options.topK || 5,
      carrierFilter: options.carrierId
    });

    // Filter by score threshold
    const relevantChunks = chunks.filter(
      chunk => chunk.score >= (options.scoreThreshold || 0.7)
    );

    // Get document metadata for citations
    const citations: Citation[] = [];

    for (const chunk of relevantChunks) {
      // Get document details from D1
      const docResult = await env.DB.prepare(
        `SELECT d.title, d.effective_date, c.section, c.page
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         WHERE c.id = ?`
      ).bind(chunk.chunkId).first();

      if (docResult) {
        citations.push({
          chunkId: chunk.chunkId,
          snippet: chunk.text.substring(0, 300) + (chunk.text.length > 300 ? '...' : ''),
          documentTitle: docResult.title,
          effectiveDate: docResult.effective_date,
          page: docResult.page,
          section: docResult.section || chunk.section,
          score: chunk.score
        });
      }
    }

    return citations;
  } catch (error) {
    console.error('Failed to retrieve citations:', error);
    return [];
  }
}

/**
 * Generate queries for RAG retrieval based on intake data
 */
export function generateRAGQueries(core: any): string[] {
  const queries: string[] = [];

  // Age and amount queries
  queries.push(
    `age ${core.age} face amount ${core.coverageTarget.amount} ${core.coverageTarget.type} underwriting requirements`
  );

  // Build/BMI queries
  const bmi = (core.weight / (core.height * core.height)) * 703;
  queries.push(
    `BMI ${Math.round(bmi)} height ${core.height} weight ${core.weight} build chart requirements`
  );

  // Tobacco/nicotine queries
  if (core.nicotine.lastUse !== 'never') {
    queries.push(
      `nicotine tobacco use ${core.nicotine.lastUse} ${core.nicotine.type} underwriting guidelines`
    );
  } else {
    queries.push('non-tobacco non-smoker qualification requirements');
  }

  // Marijuana queries
  if (core.marijuana.lastUse !== 'never') {
    queries.push(
      `marijuana cannabis use ${core.marijuana.lastUse} ${core.marijuana.frequency} underwriting impact`
    );
  }

  // Medical condition queries
  if (core.diabetes?.hasCondition) {
    queries.push(
      `diabetes ${core.diabetes.type} ${core.diabetes.controlled ? 'controlled' : 'uncontrolled'} underwriting`
    );
  }

  if (core.cardiac?.hasHistory) {
    queries.push(
      `cardiac heart condition ${core.cardiac.condition} ${core.cardiac.timeFrame} underwriting requirements`
    );
  }

  if (core.cancer?.hasHistory) {
    queries.push(
      `cancer ${core.cancer.type} survivor ${core.cancer.yearsSinceTreatment} years post-treatment underwriting`
    );
  }

  // Underwriting path queries
  if (core.age <= 60 && core.coverageTarget.amount <= 1000000) {
    queries.push('accelerated simplified issue no exam underwriting eligibility');
  }

  // Financial underwriting
  if (core.coverageTarget.amount > 500000) {
    queries.push(
      `financial underwriting income verification face amount ${core.coverageTarget.amount} requirements`
    );
  }

  return queries;
}

/**
 * Evaluate carrier fit with citations
 */
export async function evaluateCarrierWithCitations(
  carrier: any,
  core: any,
  env: any
): Promise<{
  fitScore: number;
  citations: Citation[];
  matchedCriteria: string[];
}> {
  const queries = generateRAGQueries(core);
  const allCitations: Citation[] = [];
  const matchedCriteria: string[] = [];
  let totalScore = 0;
  let queryCount = 0;

  // Process each query
  for (const query of queries) {
    const citations = await retrieveCitations(query, env, {
      carrierId: carrier.id,
      topK: 3,
      scoreThreshold: 0.65
    });

    if (citations.length > 0) {
      // Track matched criteria
      matchedCriteria.push(query.split(' ').slice(0, 3).join(' '));

      // Add best citation
      allCitations.push(citations[0]);

      // Update score based on citation quality
      totalScore += citations[0].score * 100;
      queryCount++;
    }
  }

  // Calculate final fit score
  const fitScore = queryCount > 0
    ? Math.min(95, Math.round(totalScore / queryCount))
    : 50; // Default score if no citations found

  return {
    fitScore,
    citations: allCitations.slice(0, 5), // Return top 5 citations
    matchedCriteria
  };
}

/**
 * Get specific underwriting language for verification
 */
export async function getUnderwritingEvidence(
  carrierId: string,
  criteria: string,
  env: any
): Promise<{
  evidence: string;
  source: string;
  confidence: number;
}> {
  try {
    const citations = await retrieveCitations(criteria, env, {
      carrierId,
      topK: 1,
      scoreThreshold: 0.8
    });

    if (citations.length > 0) {
      const citation = citations[0];
      return {
        evidence: citation.snippet,
        source: `${citation.documentTitle} (${new Date(citation.effectiveDate).getFullYear()})`,
        confidence: citation.score
      };
    }

    return {
      evidence: 'No specific underwriting language found for this criteria',
      source: 'N/A',
      confidence: 0
    };
  } catch (error) {
    console.error('Failed to get underwriting evidence:', error);
    return {
      evidence: 'Error retrieving underwriting evidence',
      source: 'N/A',
      confidence: 0
    };
  }
}