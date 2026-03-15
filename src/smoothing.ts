import type { DailyContribution, SmoothedPoint, TimeRange } from "./types";

/**
 * Filter daily contributions to a specific time range.
 */
export function filterByRange(
  daily: DailyContribution[],
  range: TimeRange
): DailyContribution[] {
  if (range === "all") return daily;

  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case "1m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "3m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case "1y":
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);
  return daily.filter((d) => d.date >= cutoffStr && d.date <= todayStr);
}

/**
 * Apply a 7-day moving average to smooth the contribution data.
 * Returns one smoothed point per day.
 */
export function applyMovingAverage(
  daily: DailyContribution[],
  windowSize = 7
): SmoothedPoint[] {
  if (daily.length === 0) return [];

  const result: SmoothedPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < daily.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(daily.length - 1, i + halfWindow);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += daily[j].count;
    }
    result.push({
      date: daily[i].date,
      value: sum / (end - start + 1),
    });
  }

  return result;
}
