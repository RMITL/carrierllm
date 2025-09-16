import type { CarrierRecommendation, RecommendationResponse } from '../types';

const carriers: CarrierRecommendation[] = [
  {
    carrierId: 'acme-life',
    carrierName: 'Acme Life',
    program: 'Accelerated UW',
    fitPercent: 87,
    reasons: ['Stable coverage history', 'BMI <= 33', 'No major conditions'],
    citations: [
      {
        title: 'Acme UW Guide - 2025',
        url: 'https://example.com/acme-uw'
      }
    ],
    underwritingNotes: 'Prefers applicants without major chronic conditions in past 24 months.',
    status: 'strong'
  },
  {
    carrierId: 'maple-ins',
    carrierName: 'Maple Insurance',
    program: 'Standard Advantage',
    fitPercent: 68,
    reasons: ['Nicotine-free last 24 months', 'Income meets threshold'],
    citations: [
      {
        title: 'Maple Field Guide - 2024 Q4',
        url: 'https://example.com/maple-field-guide'
      }
    ],
    underwritingNotes: 'Requires follow-up for prescription history disclosure.',
    status: 'consider'
  },
  {
    carrierId: 'sentinel',
    carrierName: 'Sentinel Mutual',
    program: 'Premier Health',
    fitPercent: 42,
    reasons: ['Recent hospitalization noted'],
    citations: [
      {
        title: 'Sentinel Medical Guide',
        url: 'https://example.com/sentinel'
      }
    ],
    underwritingNotes: 'May decline due to hospitalization < 12 months.',
    status: 'avoid'
  }
];

export const buildMockRecommendation = (): RecommendationResponse => ({
  submissionId: crypto.randomUUID(),
  recommendations: carriers,
  summary: {
    topCarrierId: carriers[0].carrierId,
    averageFit: Math.round(carriers.reduce((acc, c) => acc + c.fitPercent, 0) / carriers.length),
    notes: 'Mock data generated locally while API is unreachable.'
  }
});
