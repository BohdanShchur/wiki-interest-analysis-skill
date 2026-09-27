import { z } from 'zod';

export const languageCodeSchema = z.string().regex(/^[a-z-]+$/i, 'Language code must be lowercase or contain a hyphen');

export const granularitySchema = z.enum(['daily', 'monthly']);
export const accessSchema = z.enum(['all-access', 'desktop', 'mobile-app', 'mobile-web']);
export const agentSchema = z.enum(['all-agents', 'user', 'spider']);
export const normalizationSchema = z.enum(['none', 'baseline', 'indexed']);

export const requestSchema = z.object({
  topics: z.array(z.string().min(1)).min(1),
  languages: z.array(languageCodeSchema).min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be ISO YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be ISO YYYY-MM-DD'),
  granularity: granularitySchema.optional().default('daily'),
  access: accessSchema.optional().default('all-access'),
  agent: agentSchema.optional().default('all-agents'),
  normalized: z.boolean().optional().default(false),
  statistics: z.boolean().optional().default(true),
  detectAnomalies: z.boolean().optional().default(true),
  report: z.object({
    generatePdf: z.boolean().optional().default(false),
    generateCharts: z.boolean().optional().default(true),
  }).optional().default({ generatePdf: false, generateCharts: true }),
}).superRefine((value, ctx) => {
  const start = new Date(value.startDate);
  const end = new Date(value.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'Dates must be valid ISO dates',
    });
    return;
  }

  if (start >= end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'startDate must be earlier than endDate',
    });
  }
});

export const resolvedPageSchema = z.object({
  language: z.string(),
  wikiProject: z.string(),
  requestedTopic: z.string(),
  title: z.string(),
  normalizedTitle: z.string(),
  exists: z.boolean(),
  sourceUrl: z.string(),
  uncertain: z.boolean().optional().default(false),
  candidates: z.array(z.string()).optional(),
});

export const pageviewPointSchema = z.object({
  timestamp: z.string(),
  date: z.string(),
  views: z.number().nonnegative(),
});

export const pageviewSeriesSchema = z.object({
  language: z.string(),
  project: z.string(),
  pageTitle: z.string(),
  points: z.array(pageviewPointSchema),
});

export const analysisDatasetSchema = z.object({
  topic: z.string(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  series: z.array(pageviewSeriesSchema),
});

export const dataQualityReportSchema = z.object({
  valid: z.boolean(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  missingPeriods: z.array(z.string()),
  outliersDetected: z.number().int().nonnegative(),
});

export const trendAnalysisSchema = z.object({
  direction: z.enum(['increasing', 'decreasing', 'flat', 'uncertain']),
  slope: z.number(),
  rSquared: z.number(),
  relativeChangePct: z.number(),
  volatility: z.number(),
  observations: z.number().int().nonnegative(),
});
