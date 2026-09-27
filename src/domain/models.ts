export type Granularity = 'daily' | 'monthly';
export type AccessType = 'all-access' | 'desktop' | 'mobile-app' | 'mobile-web';
export type AgentType = 'all-agents' | 'user' | 'spider';
export type NormalizationStrategyName = 'none' | 'baseline' | 'indexed';
export type TrendDirection = 'increasing' | 'decreasing' | 'flat' | 'uncertain';

export interface AnalysisRequest {
  topics: string[];
  languages: string[];
  startDate: string;
  endDate: string;
  granularity?: Granularity;
  access?: AccessType;
  agent?: AgentType;
  normalized?: boolean;
  statistics?: boolean;
  detectAnomalies?: boolean;
  report?: {
    generatePdf?: boolean;
    generateCharts?: boolean;
  };
}

export interface ResolvedPage {
  language: string;
  wikiProject: string;
  requestedTopic: string;
  title: string;
  normalizedTitle: string;
  exists: boolean;
  sourceUrl: string;
  uncertain: boolean;
  candidates?: string[];
}

export interface PageviewPoint {
  timestamp: string;
  date: string;
  views: number;
}

export interface PageviewSeries {
  language: string;
  project: string;
  pageTitle: string;
  points: PageviewPoint[];
}

export interface AnalysisDataset {
  topic: string;
  period: {
    start: string;
    end: string;
  };
  series: PageviewSeries[];
}

export interface DataQualityReport {
  valid: boolean;
  warnings: string[];
  errors: string[];
  missingPeriods: string[];
  outliersDetected: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number;
  rSquared: number;
  relativeChangePct: number;
  volatility: number;
  observations: number;
}

export interface AnomalyPoint {
  date: string;
  value: number;
  type: 'spike' | 'drop';
}

export interface LanguageComparison {
  language: string;
  averageViews: number;
  growthPct: number;
  trendDirection: TrendDirection;
  rSquared: number;
}

export interface ChartArtifact {
  path: string;
  type: 'png' | 'svg';
  kind: 'absolute' | 'indexed' | 'growth';
}

export interface PdfReportArtifact {
  path: string;
  pages: number;
}

export interface AnalysisFinding {
  title: string;
  fact: string;
  interpretation: string;
}

export interface AnalysisResult {
  status: 'ok' | 'warning' | 'error';
  request: AnalysisRequest;
  resolvedPages: ResolvedPage[];
  dataQuality: DataQualityReport;
  analyses: TrendAnalysis[];
  comparisons: LanguageComparison[];
  findings: AnalysisFinding[];
  warnings: string[];
  artifacts: {
    charts: ChartArtifact[];
    pdf: PdfReportArtifact | null;
  };
}

export interface NormalizationStrategy {
  name: NormalizationStrategyName;
  normalize(values: number[]): number[];
}
