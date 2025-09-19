import { Env } from '../apps/worker/src/index';

export async function seedSampleCarriers(db: any): Promise<void> {
  console.log('Seeding sample carriers...');

  const sampleCarriers = [
    {
      id: 'progressive',
      name: 'Progressive',
      am_best: 'A+',
      portal_url: 'https://progressive.com/agent',
      agent_phone: '1-800-PROGRESSIVE',
      preferred_tier_rank: 1,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']),
    },
    {
      id: 'statefarm',
      name: 'State Farm',
      am_best: 'A++',
      portal_url: 'https://statefarm.com/agent',
      agent_phone: '1-800-STATE-FARM',
      preferred_tier_rank: 2,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA']),
    },
    {
      id: 'allstate',
      name: 'Allstate',
      am_best: 'A+',
      portal_url: 'https://allstate.com/agent',
      agent_phone: '1-800-ALLSTATE',
      preferred_tier_rank: 3,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ']),
    },
    {
      id: 'geico',
      name: 'GEICO',
      am_best: 'A++',
      portal_url: 'https://geico.com/agent',
      agent_phone: '1-800-GEICO',
      preferred_tier_rank: 4,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO']),
    },
    {
      id: 'liberty-mutual',
      name: 'Liberty Mutual',
      am_best: 'A',
      portal_url: 'https://libertymutual.com/agent',
      agent_phone: '1-800-LIBERTY',
      preferred_tier_rank: 5,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR']),
    },
    {
      id: 'farmers',
      name: 'Farmers Insurance',
      am_best: 'A',
      portal_url: 'https://farmers.com/agent',
      agent_phone: '1-800-FARMERS',
      preferred_tier_rank: 6,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR', 'UT']),
    },
    {
      id: 'usaa',
      name: 'USAA',
      am_best: 'A++',
      portal_url: 'https://usaa.com/agent',
      agent_phone: '1-800-USAA',
      preferred_tier_rank: 7,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR', 'UT', 'NV']),
    },
    {
      id: 'nationwide',
      name: 'Nationwide',
      am_best: 'A+',
      portal_url: 'https://nationwide.com/agent',
      agent_phone: '1-800-NATIONWIDE',
      preferred_tier_rank: 8,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR', 'UT', 'NV', 'NM']),
    },
    {
      id: 'travelers',
      name: 'Travelers',
      am_best: 'A++',
      portal_url: 'https://travelers.com/agent',
      agent_phone: '1-800-TRAVELERS',
      preferred_tier_rank: 9,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR', 'UT', 'NV', 'NM', 'ID']),
    },
    {
      id: 'american-family',
      name: 'American Family Insurance',
      am_best: 'A',
      portal_url: 'https://amfam.com/agent',
      agent_phone: '1-800-AMFAM',
      preferred_tier_rank: 10,
      available_states: JSON.stringify(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'VA', 'WA', 'AZ', 'CO', 'OR', 'UT', 'NV', 'NM', 'ID', 'MT']),
    },
  ];

  for (const carrier of sampleCarriers) {
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO carriers (
          id, name, am_best, portal_url, agent_phone, preferred_tier_rank, 
          available_states, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        carrier.id,
        carrier.name,
        carrier.am_best,
        carrier.portal_url,
        carrier.agent_phone,
        carrier.preferred_tier_rank,
        carrier.available_states,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      console.log(`✓ Seeded carrier: ${carrier.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed carrier ${carrier.name}:`, error);
    }
  }

  console.log('Sample carriers seeding completed!');
}

// If running this script directly
if (require.main === module) {
  // This would be used in a deployment script
  console.log('This script should be run as part of the deployment process');
}
