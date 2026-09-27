import { z } from 'zod';
import { PageviewSeries } from '../domain/models.js';
import { PageviewApiError, SkillError } from '../domain/errors.js';
import { AccessType, AgentType, Granularity } from '../domain/models.js';

export interface PageviewsRequest {
  language: string;
  project: string;
  pageTitle: string;
  start: string;
  end: string;
  granularity: Granularity;
  access: AccessType;
  agent: AgentType;
}

const pageviewsResponseSchema = z.object({
  items: z.array(z.object({
    project: z.string(),
    article: z.string(),
    granularity: z.string(),
    timestamp: z.string(),
    access: z.string(),
    agent: z.string(),
    views: z.number().nullable().optional().default(0),
  })).default([]),
});

export interface WikimediaAnalyticsClient {
  getPageviews(request: PageviewsRequest): Promise<PageviewSeries>;
}

export class WikimediaAnalyticsClientImpl implements WikimediaAnalyticsClient {
  private readonly userAgent: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;

  constructor(userAgent = 'wikipedia-interest-analysis/0.1', timeoutMs = 15000, maxAttempts = 3) {
    this.userAgent = userAgent;
    this.timeoutMs = timeoutMs;
    this.maxAttempts = maxAttempts;
  }

  private buildUrl(request: PageviewsRequest): string {
    const article = encodeURIComponent(request.pageTitle.replace(/ /g, '_'));
    const url = new URL('https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/');
    url.pathname += `${request.project}/${request.access}/${request.agent}/${article}/${request.granularity}/${request.start}/${request.end}`;
    return url.toString();
  }

  private async fetchWithRetry(request: PageviewsRequest): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const response = await fetch(this.buildUrl(request), {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (response.status === 404) {
          throw new PageviewApiError(`Page not found for ${request.pageTitle}`, 404);
        }

        if (response.status === 429 || response.status >= 500) {
          if (attempt === this.maxAttempts) {
            throw new PageviewApiError(`Pageviews API temporarily unavailable after retries: ${response.status}`, response.status);
          }
          const backoffMs = 250 * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        if (!response.ok) {
          throw new PageviewApiError(`Unexpected HTTP status ${response.status}`, response.status);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown pageviews request failure');
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new SkillError('Pageviews request failed without a captured error', 'PAGEVIEWS_REQUEST_ERROR');
  }

  async getPageviews(request: PageviewsRequest): Promise<PageviewSeries> {
    const response = await this.fetchWithRetry(request);
    const json = await response.json();
    const parsed = pageviewsResponseSchema.safeParse(json);

    if (!parsed.success) {
      throw new PageviewApiError(`Malformed pageviews response for ${request.pageTitle}`, 500);
    }

    const points = parsed.data.items.map((item) => {
      const rawTimestamp = String(item.timestamp ?? '');
      const normalizedDate = rawTimestamp.length >= 8
        ? `${rawTimestamp.slice(0, 4)}-${rawTimestamp.slice(4, 6)}-${rawTimestamp.slice(6, 8)}`
        : rawTimestamp;

      const normalizedTimestamp = normalizedDate.length === 10
        ? `${normalizedDate}T00:00:00Z`
        : rawTimestamp;

      return {
        timestamp: normalizedTimestamp,
        date: normalizedDate,
        views: Number(item.views ?? 0),
      };
    }).sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));

    return {
      language: request.language,
      project: request.project,
      pageTitle: request.pageTitle,
      points,
    };
  }
}
