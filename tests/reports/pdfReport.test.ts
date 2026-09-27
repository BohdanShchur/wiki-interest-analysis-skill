import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { generatePdfReport } from '../../src/reports/pdfGenerator.js';

describe('PDF report generation', () => {
  it('creates a PDF in the output directory', async () => {
    const outputDir = path.resolve('artifacts/test-output');
    const pdfPath = await generatePdfReport(outputDir, 'Sample summary', 'Wikipedia Interest Analysis');
    expect(pdfPath).toContain('report.pdf');
  });
});
