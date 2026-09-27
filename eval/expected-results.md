# Expected results

This file describes the behaviors the agent should show when handling the evaluation prompts.

1. It should resolve a topic to a canonical article for each language edition where possible.
2. It should handle ambiguous or missing pages without guessing or silent fallback.
3. It should retain evidence separately from interpretation.
4. It should flag low-quality datasets instead of presenting them as strong evidence.
5. It should distinguish between temporary anomalies and sustained growth.
6. It should present absolute pageviews and relative trend separately.
7. It should handle follow-up changes by reusing the same analysis pipeline with a new request.
8. It should generate chart and PDF artifacts when requested.
9. It should return a compact JSON result format suitable for tool calling.
10. It should avoid business recommendations or forecasts beyond the evidence.
