import type { ChartData } from "./types";
import { VIRGIL_WOFF2_BASE64 } from "./font";

// Color palette — warm, slightly muted for hand-drawn feel
const COLORS = [
  "#4285F4", // blue
  "#E34234", // red
  "#F5A623", // amber/orange
  "#2EAD6D", // green
  "#9B59B6", // purple
  "#46BDC6", // teal
  "#E67E22", // dark orange
  "#C2185B", // pink
];

const CHART_WIDTH = 800;
const CHART_HEIGHT = 420;
const PADDING = { top: 55, right: 30, bottom: 65, left: 55 };

const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

// Minimum pixel distance between x-axis tick labels
const MIN_TICK_DISTANCE = 70;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Seeded pseudo-random number generator (deterministic).
 * Same inputs always produce same "random" output → SVG is cacheable.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generate a hand-drawn/wobbly line path between two points.
 * Adds small perpendicular jitter at several intermediate points.
 */
function wobbleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  amplitude = 1.5
): string {
  const segments = 8;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular direction
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);

  let path = `M ${x1.toFixed(1)},${y1.toFixed(1)}`;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const jitter =
      i < segments ? (seededRandom(seed + i) - 0.5) * 2 * amplitude : 0;
    const px = x1 + dx * t + nx * jitter;
    const py = y1 + dy * t + ny * jitter;
    path += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
  }

  return path;
}

function formatDateLabel(dateStr: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [, m, d] = dateStr.split("-").map(Number);
  if (d === 1) return months[m - 1];
  return `${months[m - 1]} ${d}`;
}

/**
 * Generate tick positions for the X axis.
 * Ensures minimum pixel distance between ticks to prevent overlap.
 */
function generateXTicks(dates: string[], totalWidth: number, targetCount = 7): number[] {
  if (dates.length <= 2) {
    return dates.map((_, i) => i);
  }

  const step = Math.floor(dates.length / (targetCount - 1));
  const ticks: number[] = [];
  for (let i = 0; i < dates.length; i += step) {
    ticks.push(i);
  }

  // Only append the last date if it's far enough from the previous tick
  const lastIdx = dates.length - 1;
  if (ticks[ticks.length - 1] !== lastIdx) {
    const prevIdx = ticks[ticks.length - 1];
    const prevX = (prevIdx / (dates.length - 1)) * totalWidth;
    const lastX = totalWidth; // last date maps to full width
    if (lastX - prevX >= MIN_TICK_DISTANCE) {
      ticks.push(lastIdx);
    } else {
      // Replace the last tick with the final date
      ticks[ticks.length - 1] = lastIdx;
    }
  }

  return ticks;
}

function generateYTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0];

  const rawStep = maxValue / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceStep: number;
  if (normalized <= 1.5) niceStep = 1 * magnitude;
  else if (normalized <= 3.5) niceStep = 2 * magnitude;
  else if (normalized <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const ticks: number[] = [];
  for (let v = 0; v <= maxValue + niceStep * 0.1; v += niceStep) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

/**
 * Build an SVG path string from data points using Catmull-Rom spline.
 */
function buildSmoothPath(
  xs: number[],
  ys: number[],
  tension = 0.3
): string {
  if (xs.length < 2) return "";

  let path = `M ${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;

  if (xs.length === 2) {
    path += ` L ${xs[1].toFixed(1)},${ys[1].toFixed(1)}`;
    return path;
  }

  for (let i = 0; i < xs.length - 1; i++) {
    const p0x = xs[Math.max(0, i - 1)];
    const p0y = ys[Math.max(0, i - 1)];
    const p1x = xs[i];
    const p1y = ys[i];
    const p2x = xs[i + 1];
    const p2y = ys[i + 1];
    const p3x = xs[Math.min(xs.length - 1, i + 2)];
    const p3y = ys[Math.min(xs.length - 1, i + 2)];

    const cp1x = p1x + (p2x - p0x) * tension / 3;
    const cp1y = p1y + (p2y - p0y) * tension / 3;
    const cp2x = p2x - (p3x - p1x) * tension / 3;
    const cp2y = p2y - (p3y - p1y) * tension / 3;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`;
  }

  return path;
}

function fontFaceRule(): string {
  return `@font-face {
      font-family: 'Virgil';
      src: url('data:font/woff2;base64,${VIRGIL_WOFF2_BASE64}') format('woff2');
      font-weight: normal;
      font-style: normal;
    }`;
}

export function renderChart(datasets: ChartData[]): string {
  if (datasets.length === 0 || datasets.every((d) => d.points.length === 0)) {
    return renderErrorSvg("No contribution data found");
  }

  // Build a union of all dates across datasets
  const allDatesSet = new Set<string>();
  for (const ds of datasets) {
    for (const p of ds.points) {
      allDatesSet.add(p.date);
    }
  }
  const allDates = [...allDatesSet].sort();

  // Find max value across all datasets
  let maxValue = 0;
  for (const ds of datasets) {
    for (const p of ds.points) {
      if (p.value > maxValue) maxValue = p.value;
    }
  }
  maxValue = maxValue * 1.1 || 1;

  const yTicks = generateYTicks(maxValue);
  const yMax = yTicks[yTicks.length - 1];
  const xTicks = generateXTicks(allDates, PLOT_WIDTH);

  // --- Wobbly grid lines ---
  const gridLines: string[] = [];
  let seedCounter = 1;

  for (const tick of yTicks) {
    const y = PADDING.top + PLOT_HEIGHT - (tick / yMax) * PLOT_HEIGHT;
    // Hand-drawn horizontal grid line
    gridLines.push(
      `<path d="${wobbleLine(PADDING.left, y, PADDING.left + PLOT_WIDTH, y, seedCounter++, 1.0)}" class="grid-line" />`
    );
    gridLines.push(
      `<text x="${PADDING.left - 10}" y="${y + 5}" class="axis-label" text-anchor="end">${tick % 1 === 0 ? tick : tick.toFixed(1)}</text>`
    );
  }

  // --- Wobbly axis lines (left and bottom) ---
  const axisLeft = wobbleLine(
    PADDING.left, PADDING.top,
    PADDING.left, PADDING.top + PLOT_HEIGHT,
    seedCounter++, 1.2
  );
  const axisBottom = wobbleLine(
    PADDING.left, PADDING.top + PLOT_HEIGHT,
    PADDING.left + PLOT_WIDTH, PADDING.top + PLOT_HEIGHT,
    seedCounter++, 1.2
  );

  // --- X-axis labels ---
  const xLabels: string[] = [];
  for (const tickIdx of xTicks) {
    const x = PADDING.left + (tickIdx / (allDates.length - 1)) * PLOT_WIDTH;
    const label = formatDateLabel(allDates[tickIdx]);
    xLabels.push(
      `<text x="${x}" y="${PADDING.top + PLOT_HEIGHT + 22}" class="axis-label" text-anchor="middle">${escapeXml(label)}</text>`
    );
  }

  // --- Data paths ---
  const paths: string[] = [];
  for (let di = 0; di < datasets.length; di++) {
    const ds = datasets[di];
    const color = COLORS[di % COLORS.length];

    const dateToValue = new Map(ds.points.map((p) => [p.date, p.value]));
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i < allDates.length; i++) {
      const val = dateToValue.get(allDates[i]);
      if (val !== undefined) {
        const x = PADDING.left + (i / (allDates.length - 1)) * PLOT_WIDTH;
        const y = PADDING.top + PLOT_HEIGHT - (val / yMax) * PLOT_HEIGHT;
        xs.push(x);
        ys.push(y);
      }
    }

    const pathD = buildSmoothPath(xs, ys);
    paths.push(
      `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  // --- Legend (with colored squares, hand-drawn style) ---
  const legendItems: string[] = [];
  const legendY = CHART_HEIGHT - 18;
  let legendX = PADDING.left;
  for (let di = 0; di < datasets.length; di++) {
    const color = COLORS[di % COLORS.length];
    const name = escapeXml(datasets[di].username);
    // Small colored square marker
    legendItems.push(
      `<rect x="${legendX}" y="${legendY - 8}" width="12" height="12" rx="2" fill="${color}" />` +
      `<text x="${legendX + 18}" y="${legendY + 3}" class="legend-label">${name}</text>`
    );
    legendX += name.length * 9 + 45;
  }

  // --- Title ---
  const title = `<text x="${CHART_WIDTH / 2}" y="32" class="chart-title" text-anchor="middle">Contribution Trends</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" width="${CHART_WIDTH}" height="${CHART_HEIGHT}">
  <style>
    ${fontFaceRule()}
    .chart-bg { fill: #ffffff; }
    .grid-line { stroke: #ddd; stroke-width: 1; fill: none; }
    .axis-line { stroke: #333; stroke-width: 1.5; fill: none; }
    .axis-label { font-family: 'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive; font-size: 14px; fill: #555; }
    .chart-title { font-family: 'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive; font-size: 20px; font-weight: normal; fill: #333; }
    .legend-label { font-family: 'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive; font-size: 14px; fill: #444; }
    .watermark { font-family: 'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive; font-size: 11px; fill: #bbb; }
    @media (prefers-color-scheme: dark) {
      .chart-bg { fill: #0d1117; }
      .grid-line { stroke: #30363d; }
      .axis-line { stroke: #8b949e; }
      .axis-label { fill: #8b949e; }
      .chart-title { fill: #e6edf3; }
      .legend-label { fill: #c9d1d9; }
      .watermark { fill: #484f58; }
    }
  </style>
  <rect class="chart-bg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" rx="8" />
  ${gridLines.join("\n  ")}
  <path d="${axisLeft}" class="axis-line" />
  <path d="${axisBottom}" class="axis-line" />
  ${xLabels.join("\n  ")}
  ${paths.join("\n  ")}
  ${legendItems.join("\n  ")}
  ${title}
  <text x="${CHART_WIDTH - 12}" y="${CHART_HEIGHT - 8}" class="watermark" text-anchor="end">codewar.dev</text>
</svg>`;
}

export function renderErrorSvg(message: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CHART_WIDTH} 200" width="${CHART_WIDTH}" height="200">
  <style>
    ${fontFaceRule()}
    .err-bg { fill: #ffffff; }
    .err-text { font-family: 'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive; font-size: 16px; fill: #666; }
    @media (prefers-color-scheme: dark) {
      .err-bg { fill: #0d1117; }
      .err-text { fill: #8b949e; }
    }
  </style>
  <rect class="err-bg" width="${CHART_WIDTH}" height="200" rx="8" />
  <text x="${CHART_WIDTH / 2}" y="100" class="err-text" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
