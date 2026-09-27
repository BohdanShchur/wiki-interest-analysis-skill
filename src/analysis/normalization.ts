import { NormalizationStrategy, NormalizationStrategyName } from '../domain/models.js';

export class IdentityNormalizationStrategy implements NormalizationStrategy {
  readonly name: NormalizationStrategyName = 'none';

  normalize(values: number[]): number[] {
    return [...values];
  }
}

export class BaselineNormalizationStrategy implements NormalizationStrategy {
  readonly name: NormalizationStrategyName = 'baseline';

  normalize(values: number[]): number[] {
    if (values.length === 0) return [];
    const baseline = values[0] || 0;
    return values.map((value) => (baseline === 0 ? 0 : (value / baseline) * 100));
  }
}

export class IndexedNormalizationStrategy implements NormalizationStrategy {
  readonly name: NormalizationStrategyName = 'indexed';

  normalize(values: number[]): number[] {
    if (values.length === 0) return [];
    const baseline = values[0] || 0;
    return values.map((value) => (baseline === 0 ? 0 : (value / baseline) * 100));
  }
}

export function createNormalizationStrategy(name: NormalizationStrategyName): NormalizationStrategy {
  switch (name) {
    case 'none':
      return new IdentityNormalizationStrategy();
    case 'baseline':
      return new BaselineNormalizationStrategy();
    case 'indexed':
      return new IndexedNormalizationStrategy();
    default:
      return new IdentityNormalizationStrategy();
  }
}
