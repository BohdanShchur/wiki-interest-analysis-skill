import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { AnalysisResult } from '../domain/models.js';

export async function generateReportSummary(result: AnalysisResult, outputDir: string): Promise<string> {
  mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, 'analysis-report.json');
  writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
  return filePath;
}
