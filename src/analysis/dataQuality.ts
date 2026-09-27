import { DataQualityReport, PageviewSeries } from '../domain/models.js';

export function validateSeries(series: PageviewSeries): DataQualityReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const missingPeriods: string[] = [];

  if (!series.language || !/^[a-z-]+$/i.test(series.language)) {
    errors.push(`Invalid language code: ${series.language}`);
  }

  if (!series.pageTitle || series.pageTitle.trim().length === 0) {
    errors.push('Invalid page title');
  }

  if (series.points.length === 0) {
    errors.push('Empty series');
    return {
      valid: false,
      warnings,
      errors,
      missingPeriods,
      outliersDetected: 0,
    };
  }

  const dates = new Set<string>();
  for (const point of series.points) {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(point.date)) {
      errors.push(`Invalid date: ${point.date}`);
    }

    if (Number.isNaN(new Date(point.date).getTime())) {
      errors.push(`Invalid calendar date: ${point.date}`);
    }

    if (point.views < 0) {
      errors.push(`Negative views for ${point.date}: ${point.views}`);
    }

    if (dates.has(point.date)) {
      errors.push(`Duplicate timestamp: ${point.date}`);
    }
    dates.add(point.date);
  }

  const ordered = [...series.points].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = new Date(ordered[i - 1].date).getTime();
    const current = new Date(ordered[i].date).getTime();
    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);
    if (diffDays > 1) {
      missingPeriods.push(`${ordered[i - 1].date} -> ${ordered[i].date}`);
      warnings.push(`Unexpected gap detected between ${ordered[i - 1].date} and ${ordered[i].date}`);
    }
  }

  const values = series.points.map((point) => point.views);
  const median = values.length === 0 ? 0 : [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const anySpike = values.some((value) => median > 0 && value > median * 5);
  if (anySpike) {
    warnings.push('Suspicious spike detected');
  }

  const outliersDetected = values.filter((value) => median > 0 && value > median * 5).length;

  const valid = errors.length === 0;
  return {
    valid,
    warnings,
    errors,
    missingPeriods,
    outliersDetected,
  };
}

export function validateDataset(seriesList: PageviewSeries[]): DataQualityReport {
  const combinedWarnings: string[] = [];
  const combinedErrors: string[] = [];
  const missingPeriods: string[] = [];
  let outliersDetected = 0;

  for (const series of seriesList) {
    const report = validateSeries(series);
    combinedWarnings.push(...report.warnings);
    combinedErrors.push(...report.errors);
    missingPeriods.push(...report.missingPeriods);
    outliersDetected += report.outliersDetected;
  }

  return {
    valid: combinedErrors.length === 0,
    warnings: [...new Set(combinedWarnings)],
    errors: [...new Set(combinedErrors)],
    missingPeriods: [...new Set(missingPeriods)],
    outliersDetected,
  };
}
