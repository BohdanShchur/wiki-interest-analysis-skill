---
name: wikipedia-interest-analysis
description: Analyze Wikipedia page views across topics and language editions, compare trends, detect anomalies, generate charts, and produce short PDF evidence reports.
---

# Wikipedia Interest Analysis

## When to use

Use this skill when the user asks to compare interest in a topic across Wikipedia language editions, track a topic over time, detect anomalies, or generate a compact evidence report for a topic and date range.

## Input expectations

The agent should provide:

- one or more topics
- one or more language codes (for example: pl, cs, uk, en)
- a valid start date and end date
- optional granularity, access, agent, normalization, statistics, anomaly detection, and report flags

## Workflow

1. Parse the user request into a structured AnalysisRequest.
2. Resolve each topic to a canonical page in each requested language.
3. Fetch Wikimedia pageviews for the resolved page and the requested period.
4. Validate data quality and detect anomalies.
5. Compute deterministic trend and cross-language comparison metrics.
6. Generate charts and optional PDF if requested.
7. Return compact structured JSON plus artifact paths.

## Available commands/tools

- MediaWiki search/resolution
- Wikimedia Analytics pageviews API client
- file-based cache
- chart generation
- PDF generation
- JSON result output

## Interpretation rules

- Keep facts and interpretation separate.
- Do not conflate raw view counts with market size.
- Any conclusion must be grounded in evidence metrics such as slope, R², volatility, and data quality status.
- If page resolution is uncertain or a dataset is incomplete, surface that clearly.

## Data-quality rules

- Reject or warn on negative views, duplicates, invalid dates, missing observations, unexpected gaps, and incomplete current periods.
- Do not build conclusions from a dataset marked invalid by the quality gate.
- Surface warnings and errors in the final result.

## Cross-language comparison rules

- Compare scale separately from trend.
- Raw pageviews differ by language edition size and should not be treated as direct market size proxies.
- Normalize when appropriate for visual comparability using the indexed strategy.

## Reporting rules

- Generate concise summaries focused on evidence.
- A PDF report should contain topic, period, languages, key findings, chart, evidence, limitations, and source.
- The report must not read like a guaranteed business forecast.

## Limitations

- This skill is an MVP and does not implement advanced seasonality, population normalization, or large-scale historical analysis.
- Query rate limits and API outages can affect availability.
- Ambiguous page names may require explicit user clarification.

## Follow-up requests

The skill should support iterative requests such as:

- narrowing the date range only
- normalizing series to 100
- regenerating the PDF
- ignoring a spike or outlier
- switching from one language to another

The system must not recreate the entire pipeline for each change; instead, reuse the same deterministic analysis components with updated parameters.
