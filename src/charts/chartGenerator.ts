import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { PageviewSeries } from '../domain/models.js';

function toSvgLine(values: number[], width: number, height: number, padding: number): string {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / span) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return `\n<polyline fill="none" stroke="#2563eb" stroke-width="2" points="${points}" />`;
}

function toSvgBars(values: number[], width: number, height: number, padding: number): string {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const barWidth = (width - padding * 2) / values.length;

  return values
    .map((value, index) => {
      const x = padding + index * barWidth + 4;
      const barHeight = (value / max) * (height - padding * 2);
      const y = height - padding - barHeight;
      return `<rect x="${x}" y="${y}" width="${Math.max(8, barWidth - 8)}" height="${barHeight}" fill="#14b8a6" />`;
    })
    .join('');
}

export async function generateChart(series: PageviewSeries[], outputDir: string, kind: 'absolute' | 'indexed' | 'growth'): Promise<string> {
  mkdirSync(outputDir, { recursive: true });
  const width = 900;
  const height = 420;
  const padding = 40;
  const allValues = series.flatMap((item) => item.points.map((point) => point.views));

  const baseValues = series[0]?.points.map((point) => point.views) ?? [];
  const axisTicks = Array.from({ length: 5 }, (_, index) => {
    const tickY = padding + (index / 4) * (height - padding * 2);
    const value = Math.round(((4 - index) / 4) * (Math.max(...baseValues, 1) || 1));
    return `<g>
      <line x1="${padding}" y1="${tickY}" x2="${width - padding}" y2="${tickY}" stroke="#e5e7eb" stroke-dasharray="4 4" />
      <text x="${padding - 12}" y="${tickY + 4}" font-family="Arial, sans-serif" font-size="11" fill="#374151" text-anchor="end">${value}</text>
    </g>`;
  }).join('');

  const dateLabels = (series[0]?.points ?? []).map((point, index) => {
    const x = padding + (index / Math.max(series[0].points.length - 1, 1)) * (width - padding * 2);
    return index % Math.max(Math.ceil(series[0].points.length / 6), 1) === 0
      ? `<text x="${x}" y="${height - 12}" font-family="Arial, sans-serif" font-size="10" fill="#374151" text-anchor="middle">${point.date.slice(5)}</text>`
      : '';
  }).join('');

  const chartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <text x="${padding}" y="28" font-family="Arial, sans-serif" font-size="18" fill="#111827">${kind.toUpperCase()} PAGEVIEWS</text>
  <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#475569" stroke-width="1.5" />
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#475569" stroke-width="1.5" />
  ${axisTicks}
  ${dateLabels}
  <text x="${width / 2}" y="${height - 2}" font-family="Arial, sans-serif" font-size="12" fill="#111827" text-anchor="middle">Date</text>
  <text x="18" y="${height / 2}" font-family="Arial, sans-serif" font-size="12" fill="#111827" text-anchor="middle" transform="rotate(-90 18 ${height / 2})">Views</text>
  ${kind === 'growth' ? toSvgBars(allValues, width, height, padding) : toSvgLine(baseValues, width, height, padding)}
</svg>`;

  const filePath = path.join(outputDir, `${kind}-chart.svg`);
  writeFileSync(filePath, chartSvg, 'utf8');
  return filePath;
}
