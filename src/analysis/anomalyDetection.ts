import { AnomalyPoint, PageviewSeries } from '../domain/models.js';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function detectAnomalies(series: PageviewSeries): AnomalyPoint[] {
  if (series.points.length < 3) return [];

  const values = series.points.map((point) => point.views);
  const m = median(values);
  const threshold = Math.max(5, m * 2.5);
  const anomalies: AnomalyPoint[] = [];

  for (const point of series.points) {
    if (point.views > threshold) {
      anomalies.push({
        date: point.date,
        value: point.views,
        type: 'spike',
      });
    }
    if (m > 0 && point.views < m * 0.5) {
      anomalies.push({
        date: point.date,
        value: point.views,
        type: 'drop',
      });
    }
  }

  return anomalies;
}
