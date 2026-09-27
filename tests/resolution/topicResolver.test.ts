import { describe, expect, it } from 'vitest';
import { TopicResolverImpl } from '../../src/resolution/topicResolver.js';

describe('TopicResolverImpl', () => {
  it('resolves an exact match', async () => {
    const resolver = new TopicResolverImpl({
      searchTitles: async () => ['Intermittent fasting', 'Fasting'],
    });

    const result = await resolver.resolve('intermittent fasting', 'pl');
    expect(result.exists).toBe(true);
    expect(result.title).toBe('Intermittent fasting');
    expect(result.uncertain).toBe(false);
  });

  it('returns uncertain when no page is found', async () => {
    const resolver = new TopicResolverImpl({
      searchTitles: async () => [],
    });

    const result = await resolver.resolve('not a real topic', 'uk');
    expect(result.exists).toBe(false);
    expect(result.uncertain).toBe(true);
  });
});
