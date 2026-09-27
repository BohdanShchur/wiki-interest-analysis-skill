import { MediaWikiClient, MediaWikiClientImpl } from '../api/mediaWikiClient.js';
import { ResolvedPage } from '../domain/models.js';
import { TopicResolutionError } from '../domain/errors.js';

export interface TopicResolver {
  resolve(topic: string, language: string): Promise<ResolvedPage>;
}

export class TopicResolverImpl implements TopicResolver {
  constructor(private readonly mediaWikiClient: MediaWikiClient = new MediaWikiClientImpl()) {}

  private normalizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private buildSourceUrl(language: string, title: string): string {
    const safeTitle = title.replace(/ /g, '_');
    return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(safeTitle)}`;
  }

  async resolve(topic: string, language: string): Promise<ResolvedPage> {
    const candidates = await this.mediaWikiClient.searchTitles(topic, language);
    if (candidates.length === 0) {
      return {
        language,
        wikiProject: `${language}.wikipedia`,
        requestedTopic: topic,
        title: '',
        normalizedTitle: this.normalizeTitle(topic),
        exists: false,
        sourceUrl: `https://${language}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)}`,
        uncertain: true,
        candidates: [],
      };
    }

    const exactMatch = candidates.find((candidate) => this.normalizeTitle(candidate) === this.normalizeTitle(topic));
    const title = exactMatch ?? candidates[0];
    const normalizedTitle = this.normalizeTitle(title);

    return {
      language,
      wikiProject: `${language}.wikipedia`,
      requestedTopic: topic,
      title,
      normalizedTitle,
      exists: true,
      sourceUrl: this.buildSourceUrl(language, title),
      uncertain: !exactMatch,
      candidates: candidates.slice(0, 5),
    };
  }
}
