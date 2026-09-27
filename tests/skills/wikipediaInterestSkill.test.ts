import { describe, expect, it } from 'vitest';
import { invokeWikipediaInterestSkill } from '../../src/skills/wikipediaInterestSkill.js';

describe('invokeWikipediaInterestSkill', () => {
  it('accepts a structured context object and returns analysis results', async () => {
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('api.php')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            query: {
              search: [{ title: 'Přerušovaný půst' }],
            },
          }),
        } as any;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              project: 'cs.wikipedia',
              article: 'Přerušovaný_půst',
              granularity: 'daily',
              timestamp: '20240101',
              access: 'all-access',
              agent: 'all-agents',
              views: 125,
            },
            {
              project: 'cs.wikipedia',
              article: 'Přerušovaný_půst',
              granularity: 'daily',
              timestamp: '20240102',
              access: 'all-access',
              agent: 'all-agents',
              views: 130,
            },
          ],
        }),
      } as any;
    };

    try {
      const result = await invokeWikipediaInterestSkill({
        topics: ['intermittent fasting'],
        languages: ['cs'],
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        granularity: 'daily',
        access: 'all-access',
        agent: 'all-agents',
        normalized: true,
        statistics: true,
        detectAnomalies: true,
        report: {
          generatePdf: false,
          generateCharts: false,
        },
      });

      expect(result.request.topics).toEqual(['intermittent fasting']);
      expect(result.resolvedPages[0].language).toBe('cs');
      expect(result.analyses[0].observations).toBeGreaterThan(0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
