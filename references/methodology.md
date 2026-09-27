# Methodology

## Evidence-first analysis

This skill is designed to separate factual evidence from interpretation.

Facts:

- page title and language
- number of observations
- first and last value
- mean, median, min, max
- absolute and percentage change
- slope and R²
- volatility
- anomaly dates

Interpretation:

- whether the series looks increasing, decreasing, or flat
- the extent to which the trend is consistent versus dominated by noise or a single spike
- how cross-language comparisons should be read

This separation is necessary because raw Wikipedia pageviews are affected by language-specific audience sizes and noise.

## Deterministic trend rules

The analysis uses a log-transformed regression on sequential time indexes to reduce dominance by very large spikes. The result is a slope and R² estimate, which is then translated into a direction label.

Evidence rules:

- strong evidence: enough observations, clear slope, acceptable R², and the slope not dominated by one isolated spike
- moderate evidence: direction exists but volatility or seasonality lowers certainty
- weak evidence: small sample, high variance, missing periods, or ambiguous resolution

## Cross-language comparison policy

Raw pageviews are not a direct measure of potential market size or reach. Different Wikipedia language editions have very different audience scales. Therefore:

- use absolute views to report the observed scale
- use percent change and trend metrics to report relative movement
- use normalized indexed series for chart comparison

## Data quality gate

No analytical conclusion is produced until the data passes the quality gate.

A series is invalid when it contains:

- duplicate timestamps
- non-numeric or negative values
- invalid dates
- missing observations
- incomplete current period
- invalid page metadata or language code
- a high-risk anomaly pattern that makes the dataset unreliable

## Anomaly policy

Transient spikes are flagged separately from sustained growth. A one-off outlier may be reported as an anomaly without being treated as a sustained trend. This distinction is important because a page can show a temporary burst without a long-run increase.

## Reporting policy

The final report remains data-driven. It may say that the trend is increasing with evidence, but it must not claim a business outcome or guarantee a future result.

## Future iterations

### V2

- related article clusters
- device-level normalization
- total traffic normalization
- more robust seasonality detection
- country-aware analysis
- batch analysis

### V3

- very large historical data processing
- DuckDB/Parquet-based pipelines
- scheduled monitoring
- automatic topic discovery
- semantic topic mapping
