# Wikipedia Interest Analysis Skill

This project implements a production-oriented TypeScript Agent Skill that resolves Wikipedia topics across languages, fetches Wikimedia pageviews, validates data quality, analyzes trend and anomalies, compares language editions, and emits charts and a one-page PDF report.

## What it does

- resolves a user topic to a canonical Wikipedia page per language
- retrieves Wikimedia pageview data by language and article title
- validates time series for gaps, duplicates, outliers and incomplete periods
- calculates deterministic trend statistics and anomaly indicators
- compares different language editions without equating raw views with market size
- generates deterministic charts and a compact PDF report
- returns AI-friendly JSON output for tool calling

## Architecture

- Domain contracts and schemas in `src/domain`
- MediaWiki page resolver in `src/resolution`
- Wikimedia Analytics client in `src/api`
- Statistics and validation in `src/analysis`
- Charts in `src/charts`
- PDF report in `src/reports`
- CLI in `src/cli`
- Cache in `src/cache`

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Agent-skill usage

The skill is designed to be invoked from an agent or orchestration layer by passing a structured context object. The reusable entrypoint is `invokeWikipediaInterestSkill`.

```ts
import { invokeWikipediaInterestSkill } from './src/skills/wikipediaInterestSkill.js';

const result = await invokeWikipediaInterestSkill({
  topics: ['intermittent fasting'],
  languages: ['pl', 'cs'],
  startDate: '2024-01-01',
  endDate: '2026-01-01',
  granularity: 'daily',
  access: 'all-access',
  agent: 'all-agents',
  normalized: true,
  statistics: true,
  detectAnomalies: true,
  report: {
    generatePdf: true,
    generateCharts: true,
  },
});
```

## CLI usage

An example request is included at [request.json](request.json).

```bash
npm run analyze -- --input ./request.json --output ./result.json
```

Or direct flags:

```bash
npm run analyze -- --topic "intermittent fasting" --languages pl,cs --start 2024-01-01 --end 2026-01-01
```

## Example request payload

```json
{
  "topics": ["intermittent fasting"],
  "languages": ["pl", "cs"],
  "startDate": "2024-01-01",
  "endDate": "2026-01-01",
  "granularity": "daily",
  "access": "all-access",
  "agent": "all-agents",
  "normalized": true,
  "statistics": true,
  "detectAnomalies": true,
  "report": {
    "generatePdf": true,
    "generateCharts": true
  }
}
```

## Output shape

The main JSON output is compact and machine-readable, with clear separation between facts and interpretation.

```json
{
  "status": "ok",
  "request": {},
  "resolvedPages": [],
  "dataQuality": {},
  "analyses": [],
  "comparisons": [],
  "findings": [],
  "warnings": [],
  "artifacts": {
    "charts": [],
    "pdf": null
  }
}
```

## Methodology

The skill uses deterministic analysis only. Trend estimation is done with regression on the series after a log-transform to reduce dominance from large spikes. Data quality gates must pass before conclusions are generated. Raw pageview counts are kept separate from normalized series so comparisons remain interpretable.

## Limitations

- The API data depends on Wikimedia availability and rate limits.
- Wikipedia language editions have very different traffic scales and should not be compared as if they were equal-sized populations.
- pageviews are not equal to market demand or business opportunity.
- the MVP does not implement advanced seasonality or device-share normalization.

## Future improvements

- related article clusters
- unique-device normalization
- total traffic normalization
- country-aware analysis
- richer seasonality modeling
- batch analysis and scheduled monitoring

## Testing

```bash
npm test
```

## Evaluation

Evaluation prompts are stored under `eval/` and are designed to validate the agent’s request framing, output quality, and handling of ambiguous topics.
