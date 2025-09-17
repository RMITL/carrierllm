const mockCitations = [
    {
        chunkId: 'chunk-1',
        snippet: 'Applicants with BMI 25-33 are acceptable for standard rates with current health status review.',
        documentTitle: 'Acme Life Underwriting Guide 2025',
        effectiveDate: '2025-01-01',
        page: 15,
        section: 'Build Guidelines'
    },
    {
        chunkId: 'chunk-2',
        snippet: 'Nicotine use cessation must be verified for minimum 24 months for preferred rates.',
        documentTitle: 'Acme Life Underwriting Guide 2025',
        effectiveDate: '2025-01-01',
        page: 22,
        section: 'Tobacco Use'
    }
];
const orionCarriers = [
    {
        carrierId: 'acme-life',
        carrierName: 'Acme Life',
        product: 'Accelerated IUL',
        fitPct: 87,
        confidence: 'high',
        reasons: [
            'BMI within acceptable range (25-33)',
            'No nicotine use history',
            'No major medical conditions reported',
            'Age falls within preferred range'
        ],
        declines: [],
        citations: mockCitations,
        advisories: ['APS may be required for coverage amounts >$500K'],
        apsLikely: false,
        ctas: {
            portalUrl: 'https://agent.acmelife.com/apply',
            agentPhone: '1-800-555-0123'
        }
    },
    {
        carrierId: 'maple-ins',
        carrierName: 'Maple Insurance',
        product: 'Standard Term Life',
        fitPct: 68,
        confidence: 'medium',
        reasons: [
            'Meets basic health requirements',
            'Income supports coverage amount',
            'State of residence acceptable'
        ],
        declines: ['Higher coverage amounts may require additional underwriting'],
        citations: [
            {
                chunkId: 'chunk-3',
                snippet: 'Standard term life available for applicants aged 18-70 with basic health screening.',
                documentTitle: 'Maple Insurance Product Guide Q4 2024',
                effectiveDate: '2024-10-01',
                page: 8,
                section: 'Term Life Products'
            }
        ],
        advisories: ['May require prescription drug inquiry'],
        apsLikely: true,
        ctas: {
            portalUrl: 'https://apply.mapleinsurance.com',
            agentPhone: '1-800-555-0456'
        }
    },
    {
        carrierId: 'sentinel',
        carrierName: 'Sentinel Mutual',
        product: 'Simplified Issue UL',
        fitPct: 42,
        confidence: 'low',
        reasons: [
            'Simplified underwriting available',
            'Limited health questions required'
        ],
        declines: ['May decline due to age and coverage amount combination'],
        citations: [
            {
                chunkId: 'chunk-4',
                snippet: 'Simplified issue available up to $250K for applicants under age 60.',
                documentTitle: 'Sentinel Mutual Simplified Issue Guidelines',
                effectiveDate: '2024-12-01',
                page: 3,
                section: 'Coverage Limits'
            }
        ],
        advisories: ['Coverage amount may be limited', 'Higher premiums apply'],
        apsLikely: false,
        ctas: {
            portalUrl: 'https://sentinel.com/agents',
            agentPhone: '1-800-555-0789'
        }
    }
];
// Legacy carriers for backward compatibility
const legacyCarriers = [
    {
        carrierId: 'acme-life',
        carrierName: 'Acme Life',
        product: 'Accelerated UW',
        fitPct: 87,
        fitPercent: 87, // Legacy compatibility
        confidence: 'high',
        reasons: ['Stable coverage history', 'BMI <= 33', 'No major conditions'],
        citations: mockCitations,
        advisories: ['APS may be required for high coverage amounts'],
        apsLikely: false,
        underwritingNotes: 'Prefers applicants without major chronic conditions in past 24 months.',
        status: 'strong',
        ctas: {
            portalUrl: 'https://agent.acmelife.com/apply',
            agentPhone: '1-800-555-0123'
        }
    },
    {
        carrierId: 'maple-ins',
        carrierName: 'Maple Insurance',
        product: 'Standard Advantage',
        fitPct: 68,
        fitPercent: 68, // Legacy compatibility
        confidence: 'medium',
        reasons: ['Nicotine-free last 24 months', 'Income meets threshold'],
        citations: [
            {
                chunkId: 'chunk-3',
                snippet: 'Standard term life available for applicants aged 18-70 with basic health screening.',
                documentTitle: 'Maple Insurance Product Guide Q4 2024',
                effectiveDate: '2024-10-01',
                page: 8,
                section: 'Term Life Products'
            }
        ],
        advisories: ['May require prescription drug inquiry'],
        apsLikely: true,
        underwritingNotes: 'Requires follow-up for prescription history disclosure.',
        status: 'consider',
        ctas: {
            portalUrl: 'https://apply.mapleinsurance.com',
            agentPhone: '1-800-555-0456'
        }
    },
    {
        carrierId: 'sentinel',
        carrierName: 'Sentinel Mutual',
        product: 'Premier Health',
        fitPct: 42,
        fitPercent: 42, // Legacy compatibility
        confidence: 'low',
        reasons: ['Recent hospitalization noted'],
        citations: [
            {
                chunkId: 'chunk-4',
                snippet: 'Simplified issue available up to $250K for applicants under age 60.',
                documentTitle: 'Sentinel Mutual Simplified Issue Guidelines',
                effectiveDate: '2024-12-01',
                page: 3,
                section: 'Coverage Limits'
            }
        ],
        advisories: ['Coverage may be limited', 'Higher premiums likely'],
        apsLikely: false,
        underwritingNotes: 'May decline due to hospitalization < 12 months.',
        status: 'avoid',
        ctas: {
            portalUrl: 'https://sentinel.com/agents',
            agentPhone: '1-800-555-0789'
        }
    }
];
export const buildMockOrionRecommendation = () => ({
    recommendationId: crypto.randomUUID(),
    top: orionCarriers,
    stretch: {
        carrierId: 'stretch-carrier',
        carrierName: 'Stretch Option Carrier',
        product: 'High-Risk UL',
        fitPct: 65,
        confidence: 'medium',
        reasons: ['Accepts higher risk profiles', 'Flexible underwriting'],
        citations: mockCitations.slice(0, 1),
        advisories: ['Higher premiums apply', 'Extended underwriting process'],
        apsLikely: true,
        ctas: {
            portalUrl: 'https://stretch.carrier.com/apply',
            agentPhone: '1-800-555-9999'
        }
    },
    premiumSuggestion: {
        type: 'IUL',
        monthly: 350, // age × 10 rule
        note: 'Based on age × 10 rule for IUL coverage'
    },
    summary: {
        topCarrierId: orionCarriers[0].carrierId,
        averageFit: Math.round(orionCarriers.reduce((acc, c) => acc + c.fitPct, 0) / orionCarriers.length),
        notes: 'Mock Orion recommendations generated locally while API is unreachable.'
    }
});
export const buildMockRecommendation = () => ({
    submissionId: crypto.randomUUID(),
    recommendations: legacyCarriers,
    summary: {
        topCarrierId: legacyCarriers[0].carrierId,
        averageFit: Math.round(legacyCarriers.reduce((acc, c) => acc + c.fitPct, 0) / legacyCarriers.length),
        notes: 'Mock data generated locally while API is unreachable.'
    }
});
