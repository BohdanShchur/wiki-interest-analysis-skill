import { describe, expect, it } from 'vitest';
import { WikimediaAnalyticsClientImpl } from '../../src/api/wikimediaAnalyticsClient.js';

describe('WikimediaAnalyticsClientImpl', () => {
  it('builds a valid series from a sample payload', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { project: 'pl.wikipedia', article: 'Intermittent_fasting', granularity: 'daily', timestamp: '20240101', access: 'all-access', agent: 'user', views: 100 },
          { project: 'pl.wikipedia', article: 'Intermittent_fasting', granularity: 'daily', timestamp: '20240102', access: 'all-access', agent: 'user', views: 110 },
        ],
      }),
    }) as any;

    try {
      const client = new WikimediaAnalyticsClientImpl('test-agent', 5000, 1);
      const result = await client.getPageviews({
        language: 'pl',
        project: 'pl.wikipedia',
        pageTitle: 'Intermittent fasting',
        start: '20240101',
        end: '20240102',
        granularity: 'daily',
        access: 'all-access',
        agent: 'user',
      });

      expect(result.points).toHaveLength(2);
      expect(result.points[0].views).toBe(100);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('sorts pageview points by date when the API response is out of order', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { project: 'pl.wikipedia', article: 'Intermittent_fasting', granularity: 'daily', timestamp: '20240103', access: 'all-access', agent: 'user', views: 150 },
          { project: 'pl.wikipedia', article: 'Intermittent_fasting', granularity: 'daily', timestamp: '20240101', access: 'all-access', agent: 'user', views: 100 },
          { project: 'pl.wikipedia', article: 'Intermittent_fasting', granularity: 'daily', timestamp: '20240102', access: 'all-access', agent: 'user', views: 120 },
        ],
      }),
    }) as any;

    try {
      const client = new WikimediaAnalyticsClientImpl('test-agent', 5000, 1);
      const result = await client.getPageviews({
        language: 'pl',
        project: 'pl.wikipedia',
        pageTitle: 'Intermittent fasting',
        start: '20240101',
        end: '20240103',
        granularity: 'daily',
        access: 'all-access',
        agent: 'user',
      });

      expect(result.points.map((point) => point.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
      expect(result.points.map((point) => point.views)).toEqual([100, 120, 150]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
