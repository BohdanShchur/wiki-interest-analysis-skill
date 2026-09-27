# Wikimedia Analytics API notes

This project targets the Wikimedia REST API for per-article pageviews.

## Endpoints

- pageviews endpoint: `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/{project}/{access}/{agent}/{article}/{granularity}/{start}/{end}`
- MediaWiki search: `https://{language}.wikipedia.org/w/api.php?action=query&list=search&srsearch=...&format=json`

## Notes

- The pageviews endpoint uses article titles with underscores.
- Always send a User-Agent header.
- Handle 429 and 5xx with retry/backoff using capped attempts.
- Validate all payloads before converting to the internal normalized model.
