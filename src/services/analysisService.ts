import { AnalysisFinding, AnalysisRequest, AnalysisResult, LanguageComparison, PageviewSeries, TrendAnalysis } from '../domain/models.js';
import { computeTrendAnalysis } from '../analysis/trendAnalysis.js';
import { validateDataset } from '../analysis/dataQuality.js';
import { detectAnomalies } from '../analysis/anomalyDetection.js';
import { TopicResolver, TopicResolverImpl } from '../resolution/topicResolver.js';
import { WikimediaAnalyticsClient, WikimediaAnalyticsClientImpl } from '../api/wikimediaAnalyticsClient.js';
import { FileCache } from '../cache/fileCache.js';
import { generateChart } from '../charts/chartGenerator.js';
import { generatePdfReport } from '../reports/pdfGenerator.js';
import { ResolvedPage } from '../domain/models.js';

export interface AnalysisService {
  run(request: AnalysisRequest): Promise<AnalysisResult>;
}

const CACHE_VERSION = 'wikipedia-interest-skill:v1';

function formatDateForApi(date: string): string {
  return date.replace(/-/g, '');
}

export function compareSeries(series: PageviewSeries): LanguageComparison {
  const analysis = computeTrendAnalysis(series);
  const values = series.points.map((point) => point.views);
  const averageViews = values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    language: series.language,
    averageViews,
    growthPct: analysis.relativeChangePct,
    trendDirection: analysis.direction,
    rSquared: analysis.rSquared,
  };
}

export function buildFindings(series: PageviewSeries): AnalysisFinding[] {
  const analysis = computeTrendAnalysis(series);

  const fact = `The series has ${analysis.observations} observations, a ${analysis.relativeChangePct.toFixed(1)}% change, and a ${analysis.direction} direction.`;
  const interpretation = `The trend is supported by deterministic slope and R² evidence, but this should be read alongside volatility and anomaly checks.`;

  return [{
    title: `${series.language} ${series.pageTitle}`,
    fact,
    interpretation,
  }];
}

export function summarizeRequest(request: AnalysisRequest): string {
  const topicText = request.topics.join(', ');
  const languageText = request.languages.join(', ');
  return `Topic(s): ${topicText}. Languages: ${languageText}. Period: ${request.startDate} to ${request.endDate}.`;
}

export class AnalysisServiceImpl implements AnalysisService {
  constructor(
    private readonly resolver: TopicResolver = new TopicResolverImpl(),
    private readonly analyticsClient: WikimediaAnalyticsClient = new WikimediaAnalyticsClientImpl(),
    private readonly cache = new FileCache<unknown>('.cache/pageviews'),
  ) {}

  async run(request: AnalysisRequest): Promise<AnalysisResult> {
    const resolvedPages: ResolvedPage[] = [];
    const series: PageviewSeries[] = [];
    const warnings: string[] = [];

    for (const topic of request.topics) {
      for (const language of request.languages) {
        const resolved = await this.resolver.resolve(topic, language);
        resolvedPages.push(resolved);

        if (!resolved.exists) {
          warnings.push(`No exact match was found for “${topic}” in ${language}.`);
          continue;
        }

        const cacheKey = [
          CACHE_VERSION,
          language,
          resolved.wikiProject,
          resolved.title,
          request.startDate,
          request.endDate,
          request.granularity ?? 'daily',
          request.access ?? 'all-access',
          request.agent ?? 'all-agents',
        ].join(':');

        const cached = (await this.cache.get(cacheKey)) as PageviewSeries | null;
        const pageSeries = cached ?? await this.analyticsClient.getPageviews({
          language,
          project: resolved.wikiProject,
          pageTitle: resolved.title,
          start: formatDateForApi(request.startDate),
          end: formatDateForApi(request.endDate),
          granularity: request.granularity ?? 'daily',
          access: request.access ?? 'all-access',
          agent: request.agent ?? 'all-agents',
        });

        if (!cached) {
          await this.cache.set(cacheKey, pageSeries);
        }

        series.push(pageSeries);
      }
    }

    const dataQuality = validateDataset(series);
    if (!dataQuality.valid) {
      warnings.push(...dataQuality.errors);
    }

    const analyses = series.map((item) => computeTrendAnalysis(item));
    const comparisons = series.map((item) => compareSeries(item));
    const findings = series.flatMap((item) => buildFindings(item));
    const anomalyWarnings = series.flatMap((item) => detectAnomalies(item).map((point) => `${item.language}: anomaly ${point.type} on ${point.date}`));
    warnings.push(...anomalyWarnings);

    const chartPaths: string[] = [];
    const outputDir = '.artifacts';
    if (request.report?.generateCharts) {
      for (const kind of ['absolute', 'indexed', 'growth'] as const) {
        const path = await generateChart(series, outputDir, kind);
        chartPaths.push(path);
      }
    }

    let pdfPath: { path: string; pages: number } | null = null;
    if (request.report?.generatePdf) {
      const pdf = await generatePdfReport(outputDir, findings.map((finding) => `${finding.title}: ${finding.fact}`).join('\n'), 'Wikipedia Interest Analysis');
      pdfPath = { path: pdf, pages: 1 };
    }

    return {
      status: dataQuality.valid ? 'ok' : 'warning',
      request,
      resolvedPages,
      dataQuality,
      analyses,
      comparisons,
      findings,
      warnings: [...new Set(warnings)],
      artifacts: {
        charts: chartPaths.map((pathValue) => ({
          path: pathValue,
          type: 'svg',
          kind: pathValue.includes('indexed') ? 'indexed' : pathValue.includes('growth') ? 'growth' : 'absolute',
        })),
        pdf: pdfPath,
      },
    };
  }
}
