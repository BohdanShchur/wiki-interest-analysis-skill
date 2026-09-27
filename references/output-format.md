# Output format contract

The skill returns compact JSON appropriate for AI agent consumption.

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

The key rule is to separate:

- facts: metrics, counts, dates, percentages, R², slope
- interpretations: summary language, trend description, caveats
