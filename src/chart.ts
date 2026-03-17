import type { ChartData } from "./types";
import { VIRGIL_WOFF2_BASE64 } from "./font";

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

const FONT_STACK = "'Virgil', 'Segoe Print', 'Comic Neue', 'Comic Sans MS', cursive";

// Layout — chart area + right legend panel
const LEGEND_WIDTH = 180;
const CHART_AREA_WIDTH = 800;
const TOTAL_WIDTH = CHART_AREA_WIDTH + LEGEND_WIDTH;
const TOTAL_HEIGHT = 400;
const PADDING = { top: 50, right: 20, bottom: 50, left: 55 };

const PLOT_WIDTH = CHART_AREA_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = TOTAL_HEIGHT - PADDING.top - PADDING.bottom;

const MIN_TICK_DISTANCE = 70;

// Avatar dimensions
const AVATAR_SIZE = 36;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const LEGEND_ITEM_HEIGHT = 55;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function wobbleLine(
  x1: number, y1: number, x2: number, y2: number,
  seed: number, amplitude = 1.5
): string {
  const segments = 8;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);

  let path = `M ${x1.toFixed(1)},${y1.toFixed(1)}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const jitter = i < segments ? (seededRandom(seed + i) - 0.5) * 2 * amplitude : 0;
    const px = x1 + dx * t + nx * jitter;
    const py = y1 + dy * t + ny * jitter;
    path += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return path;
}

function formatDateLabel(dateStr: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, m, d] = dateStr.split("-").map(Number);
  if (d === 1) return months[m - 1];
  return `${months[m - 1]} ${d}`;
}

function generateXTicks(dates: string[], totalWidth: number, targetCount = 7): number[] {
  if (dates.length <= 2) return dates.map((_, i) => i);

  const step = Math.floor(dates.length / (targetCount - 1));
  const ticks: number[] = [];
  for (let i = 0; i < dates.length; i += step) ticks.push(i);

  const lastIdx = dates.length - 1;
  if (ticks[ticks.length - 1] !== lastIdx) {
    const prevIdx = ticks[ticks.length - 1];
    const prevX = (prevIdx / (dates.length - 1)) * totalWidth;
    const lastX = totalWidth;
    if (lastX - prevX >= MIN_TICK_DISTANCE) {
      ticks.push(lastIdx);
    } else {
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

function buildSmoothPath(xs: number[], ys: number[], tension = 0.3): string {
  if (xs.length < 2) return "";
  let path = `M ${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  if (xs.length === 2) {
    path += ` L ${xs[1].toFixed(1)},${ys[1].toFixed(1)}`;
    return path;
  }
  for (let i = 0; i < xs.length - 1; i++) {
    const p0x = xs[Math.max(0, i - 1)], p0y = ys[Math.max(0, i - 1)];
    const p1x = xs[i], p1y = ys[i];
    const p2x = xs[i + 1], p2y = ys[i + 1];
    const p3x = xs[Math.min(xs.length - 1, i + 2)], p3y = ys[Math.min(xs.length - 1, i + 2)];
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

/**
 * Get the last point's value for a dataset (used for legend ordering).
 */
function getLastValue(ds: ChartData): number {
  if (ds.points.length === 0) return 0;
  return ds.points[ds.points.length - 1].value;
}

export function renderChart(datasets: ChartData[], self?: string, theme: "light" | "dark" = "light"): string {
  if (datasets.length === 0 || datasets.every((d) => d.points.length === 0)) {
    return renderErrorSvg("No contribution data found");
  }

  // Build a union of all dates
  const allDatesSet = new Set<string>();
  for (const ds of datasets) {
    for (const p of ds.points) allDatesSet.add(p.date);
  }
  const allDates = [...allDatesSet].sort();

  // Find max value
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

  // --- Grid lines ---
  const gridLines: string[] = [];
  let seedCounter = 1;

  for (const tick of yTicks) {
    const y = PADDING.top + PLOT_HEIGHT - (tick / yMax) * PLOT_HEIGHT;
    gridLines.push(
      `<path d="${wobbleLine(PADDING.left, y, PADDING.left + PLOT_WIDTH, y, seedCounter++, 1.0)}" class="grid-line" />`
    );
    gridLines.push(
      `<text x="${PADDING.left - 10}" y="${y + 5}" class="axis-label" text-anchor="end">${tick % 1 === 0 ? tick : tick.toFixed(1)}</text>`
    );
  }

  // --- Axis lines ---
  const axisLeft = wobbleLine(PADDING.left, PADDING.top, PADDING.left, PADDING.top + PLOT_HEIGHT, seedCounter++, 1.2);
  const axisBottom = wobbleLine(PADDING.left, PADDING.top + PLOT_HEIGHT, PADDING.left + PLOT_WIDTH, PADDING.top + PLOT_HEIGHT, seedCounter++, 1.2);

  // --- X-axis labels ---
  const xLabels: string[] = [];
  for (const tickIdx of xTicks) {
    const x = PADDING.left + (tickIdx / (allDates.length - 1)) * PLOT_WIDTH;
    const label = formatDateLabel(allDates[tickIdx]);
    xLabels.push(
      `<text x="${x}" y="${PADDING.top + PLOT_HEIGHT + 22}" class="axis-label" text-anchor="middle">${escapeXml(label)}</text>`
    );
  }

  // --- Data paths (keep original order for color assignment) ---
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
    const isSelf = self && ds.username.toLowerCase() === self.toLowerCase();
    const strokeWidth = isSelf ? 4 : 2;
    paths.push(
      `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="data-line" style="animation-delay: ${di * 0.15}s" />`
    );
  }

  // --- Right-side legend (aligned to line endpoints) ---
  // Compute ideal Y for each user based on their last data point
  const MIN_LABEL_GAP = 30; // minimum px between username texts
  const legendX = CHART_AREA_WIDTH + 20;
  const defs: string[] = [];
  const legendItems: string[] = [];

  const legendEntries = datasets.map((ds, di) => {
    const lastValue = getLastValue(ds);
    const idealY = PADDING.top + PLOT_HEIGHT - (lastValue / yMax) * PLOT_HEIGHT;
    return { index: di, idealY };
  });

  // Sort by idealY ascending (top of chart first = highest value)
  legendEntries.sort((a, b) => a.idealY - b.idealY);

  // Collision resolution: push labels down, then shift up if overflow
  const topBound = PADDING.top + AVATAR_RADIUS;
  const bottomBound = PADDING.top + PLOT_HEIGHT - AVATAR_RADIUS;
  const positions: number[] = [];

  // Forward pass: push down to avoid overlap
  let prev = -Infinity;
  for (const entry of legendEntries) {
    let y = entry.idealY;
    if (y < prev + MIN_LABEL_GAP) {
      y = prev + MIN_LABEL_GAP;
    }
    positions.push(y);
    prev = y;
  }

  // If last label overflows bottom, shift ALL labels up
  const overflow = positions[positions.length - 1] - bottomBound;
  if (overflow > 0) {
    for (let i = 0; i < positions.length; i++) {
      positions[i] -= overflow;
    }
  }

  // Clamp top label
  if (positions[0] < topBound) {
    const shift = topBound - positions[0];
    for (let i = 0; i < positions.length; i++) {
      positions[i] += shift;
    }
  }

  const resolvedYs = new Map<number, number>();
  for (let i = 0; i < legendEntries.length; i++) {
    resolvedYs.set(legendEntries[i].index, positions[i]);
  }

  // Render in reverse order (lowest value first) so higher-value avatars are on top
  const renderOrder = [...legendEntries].reverse();

  for (const entry of renderOrder) {
    const di = entry.index;
    const ds = datasets[di];
    const color = COLORS[di % COLORS.length];
    const name = escapeXml(ds.username);
    const cy = resolvedYs.get(di)!;
    const cx = legendX + AVATAR_RADIUS;
    const clipId = `avatar-clip-${di}`;

    // Clip path for circular avatar
    defs.push(`<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${AVATAR_RADIUS - 2}" /></clipPath>`);

    // Colored ring (border)
    legendItems.push(
      `<circle cx="${cx}" cy="${cy}" r="${AVATAR_RADIUS}" fill="none" stroke="${color}" stroke-width="3" />`
    );

    // Avatar image (clipped to circle)
    if (ds.avatarBase64) {
      legendItems.push(
        `<image href="${ds.avatarBase64}" x="${cx - AVATAR_RADIUS + 2}" y="${cy - AVATAR_RADIUS + 2}" width="${AVATAR_SIZE - 4}" height="${AVATAR_SIZE - 4}" clip-path="url(#${clipId})" />`
      );
    } else {
      // Fallback: filled circle with first letter
      legendItems.push(
        `<circle cx="${cx}" cy="${cy}" r="${AVATAR_RADIUS - 2}" fill="${color}" opacity="0.2" />`
      );
      legendItems.push(
        `<text x="${cx}" y="${cy + 5}" class="legend-label" text-anchor="middle" fill="${color}" font-size="16">${name.charAt(0).toUpperCase()}</text>`
      );
    }

    // Username text
    legendItems.push(
      `<text x="${cx + AVATAR_RADIUS + 8}" y="${cy + 5}" class="legend-label">@${name}</text>`
    );
  }

  // --- Title (dynamic: "CAN YOU BEAT @topPerformer") ---
  // If self is provided, exclude from title calculation
  const titleCandidates = self
    ? datasets.filter(d => d.username.toLowerCase() !== self.toLowerCase())
    : datasets;
  const candidates = titleCandidates.length > 0 ? titleCandidates : datasets;
  let topUsername = candidates[0].username;
  let topAvg = 0;
  for (const ds of candidates) {
    if (ds.points.length === 0) continue;
    const avg = ds.points.reduce((sum, p) => sum + p.value, 0) / ds.points.length;
    if (avg > topAvg) {
      topAvg = avg;
      topUsername = ds.username;
    }
  }
  const chartCenterX = PADDING.left + PLOT_WIDTH / 2;
  const titleText = escapeXml(`CAN YOU BEAT @${topUsername}`);
  const title = `<text x="${chartCenterX}" y="38" class="chart-title" text-anchor="middle">${titleText}</text>`;

  // --- Y-axis label ---
  const yAxisLabelY = PADDING.top + PLOT_HEIGHT / 2;
  const yAxisLabel = `<text x="15" y="${yAxisLabelY}" class="axis-label" text-anchor="middle" transform="rotate(-90, 15, ${yAxisLabelY})">contributions</text>`;

  // --- Separator line between chart and legend ---
  const separatorPath = wobbleLine(CHART_AREA_WIDTH, PADDING.top - 10, CHART_AREA_WIDTH, TOTAL_HEIGHT - 15, seedCounter++, 0.8);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}" width="${TOTAL_WIDTH}" height="${TOTAL_HEIGHT}">
  <defs>
    ${defs.join("\n    ")}
  </defs>
  <style>
    ${fontFaceRule()}
    .chart-bg { fill: ${theme === "dark" ? "#0d1117" : "#ffffff"}; }
    .grid-line { stroke: ${theme === "dark" ? "#30363d" : "#ddd"}; stroke-width: 1; fill: none; }
    .axis-line { stroke: ${theme === "dark" ? "#8b949e" : "#333"}; stroke-width: 1.5; fill: none; }
    .separator { stroke: ${theme === "dark" ? "#30363d" : "#e0e0e0"}; stroke-width: 1; fill: none; }
    .axis-label { font-family: ${FONT_STACK}; font-size: 14px; fill: ${theme === "dark" ? "#8b949e" : "#555"}; }
    .chart-title { font-family: ${FONT_STACK}; font-size: 36px; font-weight: normal; fill: ${theme === "dark" ? "#e6edf3" : "#333"}; }
    .legend-label { font-family: ${FONT_STACK}; font-size: 13px; fill: ${theme === "dark" ? "#c9d1d9" : "#444"}; }
    .watermark { font-family: ${FONT_STACK}; font-size: 11px; fill: ${theme === "dark" ? "#484f58" : "#bbb"}; }
    @keyframes draw {
      from { stroke-dashoffset: 10000; }
      to { stroke-dashoffset: 0; }
    }
    .data-line {
      stroke-dasharray: 10000;
      stroke-dashoffset: 10000;
      animation: draw 1s ease-out forwards;
    }
  </style>
  <rect class="chart-bg" width="${TOTAL_WIDTH}" height="${TOTAL_HEIGHT}" rx="8" />
  ${gridLines.join("\n  ")}
  <path d="${axisLeft}" class="axis-line" />
  <path d="${axisBottom}" class="axis-line" />
  ${xLabels.join("\n  ")}
  ${paths.join("\n  ")}
  <path d="${separatorPath}" class="separator" />
  ${legendItems.join("\n  ")}
  ${title}
  ${yAxisLabel}
  <text x="${TOTAL_WIDTH - 12}" y="${TOTAL_HEIGHT - 8}" class="watermark" text-anchor="end">codewar.dev</text>
</svg>`;
}

export function renderErrorSvg(message: string, theme: "light" | "dark" = "light"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TOTAL_WIDTH} 200" width="${TOTAL_WIDTH}" height="200">
  <style>
    ${fontFaceRule()}
    .err-bg { fill: ${theme === "dark" ? "#0d1117" : "#ffffff"}; }
    .err-text { font-family: ${FONT_STACK}; font-size: 16px; fill: ${theme === "dark" ? "#8b949e" : "#666"}; }
  </style>
  <rect class="err-bg" width="${TOTAL_WIDTH}" height="200" rx="8" />
  <text x="${TOTAL_WIDTH / 2}" y="100" class="err-text" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
