import { TrendAnalysis } from '../domain/models.js';
import { PageviewSeries } from '../domain/models.js';

export function computeTrendAnalysis(series: PageviewSeries): TrendAnalysis {
  const points = series.points.filter((point) => Number.isFinite(point.views) && point.views >= 0);

  if (points.length === 0) {
    return {
      direction: 'uncertain',
      slope: 0,
      rSquared: 0,
      relativeChangePct: 0,
      volatility: 0,
      observations: 0,
    };
  }

  const values = points.map((point) => point.views);
  const first = values[0];
  const last = values[values.length - 1];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviations = values.map((value) => value - mean);
  const variance = deviations.reduce((sum, value) => sum + value * value, 0) / values.length;
  const volatility = Math.sqrt(variance) / Math.max(mean, 1);

  const slope = (() => {
    const x = points.map((_, index) => index);
    const xMean = x.reduce((sum, value) => sum + value, 0) / x.length;
    const yMean = values.reduce((sum, value) => sum + Math.log(value + 1), 0) / values.length;
    const numerator = x.reduce((sum, xValue, index) => {
      const yValue = Math.log(values[index] + 1);
      return sum + ((xValue - xMean) * (yValue - yMean));
    }, 0);
    const denominator = x.reduce((sum, xValue) => sum + (xValue - xMean) ** 2, 0);
    return denominator === 0 ? 0 : numerator / denominator;
  })();

  const fitted = points.map((_, index) => Math.log(values[index] + 1) + slope * (index - (points.length - 1) / 2));
  const ssTot = values.reduce((sum, value) => {
    const yMean = values.reduce((acc, item) => acc + Math.log(item + 1), 0) / values.length;
    return sum + (Math.log(value + 1) - yMean) ** 2;
  }, 0);
  const ssRes = points.reduce((sum, point, index) => {
    const observed = Math.log(point.views + 1);
    const predicted = fitted[index];
    return sum + (observed - predicted) ** 2;
  }, 0);
  const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  const relativeChangePct = first === 0 ? 0 : ((last - first) / first) * 100;

  let direction: TrendAnalysis['direction'] = 'flat';
  if (Math.abs(slope) < 0.0001 && Math.abs(relativeChangePct) < 5) direction = 'flat';
  else if (slope > 0) direction = 'increasing';
  else if (slope < 0) direction = 'decreasing';
  else direction = 'uncertain';

  return {
    direction,
    slope,
    rSquared: Number.isFinite(rSquared) ? rSquared : 0,
    relativeChangePct,
    volatility,
    observations: points.length,
  };
}
