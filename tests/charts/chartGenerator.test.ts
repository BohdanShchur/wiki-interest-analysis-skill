import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateChart } from '../../src/charts/chartGenerator.js';

const makeSeries = () => [{
  language: 'en',
  project: 'wikipedia',
  pageTitle: 'Example topic',
  points: [
    { timestamp: '2024-01-01', date: '2024-01-01', views: 10 },
    { timestamp: '2024-01-02', date: '2024-01-02', views: 20 },
    { timestamp: '2024-01-03', date: '2024-01-03', views: 25 },
    { timestamp: '2024-01-04', date: '2024-01-04', views: 40 },
  ],
}];

describe('generateChart', () => {
  it('adds visible x and y axes with labels', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'chart-'));
    await generateChart(makeSeries(), tempDir, 'absolute');
    const svg = readFileSync(path.join(tempDir, 'absolute-chart.svg'), 'utf8');

    expect(svg).toContain('Date');
    expect(svg).toContain('Views');
    expect(svg).toContain('x1="40"');
    expect(svg).toContain('y1="40"');
  });
});
