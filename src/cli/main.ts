import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { requestSchema } from '../domain/schemas.js';
import { ValidationError } from '../domain/errors.js';
import { invokeWikipediaInterestSkill } from '../skills/wikipediaInterestSkill.js';

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCliArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const name = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[name] = next;
      i += 1;
    } else {
      out[name] = true;
    }
  }

  return out;
}

function buildRequestFromFlags(flags: Record<string, string | boolean>) {
  const topics = typeof flags.topic === 'string' ? [flags.topic] : undefined;
  const languages = typeof flags.languages === 'string'
    ? flags.languages.split(',').map((item) => item.trim()).filter(Boolean)
    : undefined;

  return {
    topics: topics ?? [],
    languages: languages ?? [],
    startDate: typeof flags.start === 'string' ? flags.start : '2024-01-01',
    endDate: typeof flags.end === 'string' ? flags.end : '2026-01-01',
    granularity: 'daily',
    access: 'all-access',
    agent: 'all-agents',
    normalized: true,
    statistics: true,
    detectAnomalies: true,
    report: {
      generatePdf: typeof flags.pdf === 'string' ? flags.pdf === 'true' : Boolean(flags.pdf),
      generateCharts: typeof flags.charts === 'string' ? flags.charts === 'true' : true,
    },
  };
}

async function main() {
  const flags = parseCliArgs(process.argv.slice(2));

  const inputPath = typeof flags.input === 'string' ? flags.input : undefined;
  const outputPath = typeof flags.output === 'string' ? flags.output : path.resolve(__dirname, '../../result.json');

  let request: unknown;

  if (inputPath) {
    const fileContent = readFileSync(inputPath, 'utf8');
    request = JSON.parse(fileContent);
  } else {
    request = buildRequestFromFlags(flags);
  }

  const result = requestSchema.safeParse(request);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((issue) => issue.message).join('; '));
  }

  const validated = result.data;
  const outputDir = path.dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });

  const response = await invokeWikipediaInterestSkill(validated);

  writeFileSync(outputPath, JSON.stringify(response, null, 2));
  console.log(`Analysis request validated and saved to: ${outputPath}`);
  if (response.artifacts.charts.length > 0) {
    console.log(`Charts generated at: ${response.artifacts.charts.map((item) => item.path).join(', ')}`);
  }
  if (response.artifacts.pdf) {
    console.log(`PDF report generated at: ${response.artifacts.pdf.path}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Analysis failed: ${message}`);
  process.exitCode = 1;
});
