import { describe, expect, it } from 'vitest';
import { buildMockRecommendation } from './mock';

describe('buildMockRecommendation', () => {
  it('returns a deterministic data shape', () => {
    const result = buildMockRecommendation();
    expect(result.recommendations).toHaveLength(3);
    expect(result.summary.averageFit).toBeGreaterThan(0);
  });
});
