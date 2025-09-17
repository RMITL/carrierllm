import { z } from 'zod';

// Carrier data extracted from the documents we have
export const carrierData = [
  {
    id: 'fg-life',
    name: 'F&G Life',
    amBest: 'A',
    portalUrl: 'https://agent.fglife.com',
    agentPhone: '1-800-445-4641',
    preferredTierRank: 1,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'fg-iul-exam-free',
        name: 'IUL Exam-Free',
        type: 'iul',
        minAge: 0,
        maxAge: 60,
        underwritingPath: 'exam_free'
      }
    ]
  },
  {
    id: 'mutual-omaha',
    name: 'Mutual of Omaha',
    amBest: 'A+',
    portalUrl: 'https://agent.mutualofomaha.com',
    agentPhone: '1-800-775-6000',
    preferredTierRank: 1,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'moo-iul-advantage',
        name: 'IUL Advantage',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      },
      {
        id: 'moo-accelerated-uw',
        name: 'Accelerated Underwriting',
        type: 'iul',
        minAge: 18,
        maxAge: 60,
        underwritingPath: 'accelerated'
      }
    ]
  },
  {
    id: 'foresters',
    name: 'Foresters Financial',
    amBest: 'A',
    portalUrl: 'https://www.foresters.com/agent',
    agentPhone: '1-800-423-4026',
    preferredTierRank: 2,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'foresters-accelerated',
        name: 'Accelerated Underwriting',
        type: 'iul',
        minAge: 18,
        maxAge: 55,
        underwritingPath: 'accelerated'
      },
      {
        id: 'foresters-full-uw',
        name: 'Full Underwriting',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'protective',
    name: 'Protective Life',
    amBest: 'A+',
    portalUrl: 'https://agent.protective.com',
    agentPhone: '1-800-866-3555',
    preferredTierRank: 3,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'protective-iul-premier',
        name: 'IUL Premier',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'securian',
    name: 'Securian Financial',
    amBest: 'A+',
    portalUrl: 'https://www.securian.com/agent',
    agentPhone: '1-800-820-4205',
    preferredTierRank: 2,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'securian-writefit',
        name: 'WriteFit Underwriting',
        type: 'iul',
        minAge: 18,
        maxAge: 70,
        underwritingPath: 'simplified'
      }
    ]
  },
  {
    id: 'symetra',
    name: 'Symetra Life',
    amBest: 'A',
    portalUrl: 'https://www.symetra.com/agent',
    agentPhone: '1-800-796-3872',
    preferredTierRank: 2,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'symetra-swift',
        name: 'Swift Term',
        type: 'term',
        minAge: 18,
        maxAge: 70,
        underwritingPath: 'instant'
      },
      {
        id: 'symetra-iul',
        name: 'Symetra IUL',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'allianz',
    name: 'Allianz Life',
    amBest: 'A+',
    portalUrl: 'https://www.allianzlife.com/agent',
    agentPhone: '1-800-950-7372',
    preferredTierRank: 1,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'allianz-iul',
        name: 'Allianz IUL',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'columbus',
    name: 'Columbus Life',
    amBest: 'A',
    portalUrl: 'https://www.columbuslife.com/agent',
    agentPhone: '1-800-677-9696',
    preferredTierRank: 1,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'columbus-iul',
        name: 'Columbus IUL',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'americo',
    name: 'Americo Life',
    amBest: 'A-',
    portalUrl: 'https://www.americo.com/agent',
    agentPhone: '1-800-231-2425',
    preferredTierRank: 1,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'americo-iul',
        name: 'Americo IUL',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  },
  {
    id: 'corebridge',
    name: 'Corebridge Financial',
    amBest: 'A',
    portalUrl: 'https://www.corebridge.com/agent',
    agentPhone: '1-800-445-7862',
    preferredTierRank: 2,
    availableStates: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    products: [
      {
        id: 'corebridge-iul',
        name: 'Corebridge IUL',
        type: 'iul',
        minAge: 18,
        maxAge: 85,
        underwritingPath: 'full'
      }
    ]
  }
];

/**
 * Seed carriers and products into the database
 */
export async function seedCarriers(db: any): Promise<void> {
  console.log('Seeding carriers and products...');

  for (const carrier of carrierData) {
    const now = new Date().toISOString();

    // Insert carrier
    await db.prepare(
      `INSERT OR REPLACE INTO carriers
       (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      carrier.id,
      carrier.name,
      carrier.amBest,
      carrier.portalUrl,
      carrier.agentPhone,
      carrier.preferredTierRank,
      JSON.stringify(carrier.availableStates),
      now,
      now
    ).run();

    // Insert products
    for (const product of carrier.products) {
      await db.prepare(
        `INSERT OR REPLACE INTO products
         (id, carrier_id, name, type, min_age, max_age, underwriting_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        product.id,
        carrier.id,
        product.name,
        product.type,
        product.minAge,
        product.maxAge,
        product.underwritingPath,
        now
      ).run();
    }

    console.log(`✓ Seeded carrier: ${carrier.name}`);
  }

  console.log(`✅ Successfully seeded ${carrierData.length} carriers`);
}

/**
 * Create a default tenant for development
 */
export async function seedDefaultTenant(db: any): Promise<void> {
  const tenantId = 'default-tenant';
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT OR REPLACE INTO tenants
     (id, plan, status, limits_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    tenantId,
    'Team',
    'active',
    JSON.stringify({
      maxRecommendationsPerMonth: 1000,
      maxUsers: 5,
      analyticsAccess: true
    }),
    now,
    now
  ).run();

  console.log('✅ Created default tenant');
}