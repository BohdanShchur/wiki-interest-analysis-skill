import { describe, expect, it } from 'vitest';
import { computeTrendAnalysis } from '../../src/analysis/trendAnalysis.js';

const makeSeries = (values: number[]) => ({
  language: 'pl',
  project: 'wikipedia',
  pageTitle: 'Test page',
  points: values.map((value, index) => ({
    timestamp: `2024-01-${String(index + 1).padStart(2, '0')}`,
    date: `2024-01-${String(index + 1).padStart(2, '0')}`,
    views: value,
  })),
});

describe('computeTrendAnalysis', () => {
  it('matches a flat series', () => {
    const result = computeTrendAnalysis(makeSeries([100, 100, 100, 100]));
    expect(result.observations).toBe(4);
    expect(result.direction).toBe('flat');
  });

  it('matches an increasing series', () => {
    const result = computeTrendAnalysis(makeSeries([100, 110, 120, 130]));
    expect(result.direction).toBe('increasing');
    expect(result.relativeChangePct).toBeCloseTo(30, 0);
  });

  it('matches a decreasing series', () => {
    const result = computeTrendAnalysis(makeSeries([130, 120, 110, 100]));
    expect(result.direction).toBe('decreasing');
  });

  it('flags a one spike as increasing but with risk', () => {
    const result = computeTrendAnalysis(makeSeries([100, 100, 100, 1000, 100]));
    expect(result.observations).toBe(5);
    expect(result.direction).toBe('increasing');
  });
});
