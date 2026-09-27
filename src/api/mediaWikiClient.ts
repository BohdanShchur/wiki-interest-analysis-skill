import { z } from 'zod';
import { SkillError } from '../domain/errors.js';

const mediaWikiSearchResponseSchema = z.object({
  query: z.object({
    search: z.array(z.object({
      title: z.string(),
      snippet: z.string().optional(),
    })).optional().default([]),
  }),
});

export interface MediaWikiClient {
  searchTitles(topic: string, language: string): Promise<string[]>;
}

export class MediaWikiClientImpl implements MediaWikiClient {
  private readonly userAgent: string;

  constructor(userAgent = 'wikipedia-interest-analysis/0.1') {
    this.userAgent = userAgent;
  }

  private buildUrl(topic: string, language: string): string {
    const query = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: topic,
      format: 'json',
      origin: '*',
      srlimit: '10',
      utf8: '1',
    });

    return `https://${language}.wikipedia.org/w/api.php?${query.toString()}`;
  }

  async searchTitles(topic: string, language: string): Promise<string[]> {
    const url = this.buildUrl(topic, language);
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new SkillError(`MediaWiki search failed for ${language}: ${response.status}`, 'MEDIAWIKI_SEARCH_ERROR');
    }

    const json = await response.json();
    const parsed = mediaWikiSearchResponseSchema.safeParse(json);

    if (!parsed.success) {
      throw new SkillError(`Malformed MediaWiki search response for ${language}`, 'MEDIAWIKI_RESPONSE_ERROR');
    }

    return parsed.data.query.search.map((item) => item.title);
  }
}
