import { describe, it, expect } from 'vitest';
import { demoProfile, demoStrategies } from '../../scripts/demo/goldenSample.js';

// Mirrors the tier bands enforced by the semantic-bridge edge function.
const tierForScore = (score) =>
  score >= 75 ? 'strong_target' : score >= 55 ? 'viable_target' : score >= 35 ? 'stretch' : 'not_a_fit';

describe('Golden Sample demo data', () => {
  it('has a career evidence profile', () => {
    expect(demoProfile.career_evidence.length).toBeGreaterThan(200);
  });

  it('seeds 3-5 draft strategies', () => {
    expect(demoStrategies.length).toBeGreaterThanOrEqual(3);
    expect(demoStrategies.length).toBeLessThanOrEqual(5);
  });

  it.each(demoStrategies.map((s) => [s.company_name, s]))('%s matches the semantic-bridge contract', (_name, { strategy, inputs }) => {
    expect(strategy.fit_tier).toBe(tierForScore(strategy.fit_score));
    expect(['market', 'tech', 'both', 'neither']).toContain(strategy.primary_signal);
    expect(strategy.why.length).toBeGreaterThan(0);
    expect(strategy.proposed_moves.length).toBeGreaterThan(0);
    strategy.evidence_matches.forEach((m) => expect(['market', 'tech']).toContain(m.source));
    expect(inputs.demo).toBe(true);
  });
});
