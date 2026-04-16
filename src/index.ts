import type { Env, TimeRange, ChartData } from "./types";
import { fetchUserContributions, fetchAvatar } from "./github";
import { filterByRange, applyMovingAverage } from "./smoothing";
import { renderChart, renderErrorSvg } from "./chart";
import puppeteer from "@cloudflare/puppeteer";

const VALID_RANGES = new Set(["1m", "3m", "1y", "all"]);
const VALID_THEMES = new Set(["light", "dark"]);
const MAX_USERS = 5;

const FAILED_USERS_HEADER = "X-Codewar-Failed-Users";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Expose-Headers": FAILED_USERS_HEADER,
  };
}

function svgResponse(
  svg: string,
  opts: { cacheSeconds?: number; failedUsers?: string[] } = {}
): Response {
  const { cacheSeconds = 1800, failedUsers = [] } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml",
    // Partial results get a tiny TTL so a transient failure doesn't pin a
    // bad chart to the edge cache for 30 minutes.
    "Cache-Control": `public, max-age=${failedUsers.length > 0 ? 60 : cacheSeconds}`,
    ...(corsHeaders() as Record<string, string>),
  };
  if (failedUsers.length > 0) {
    headers[FAILED_USERS_HEADER] = failedUsers.join(",");
  }
  return new Response(svg, { headers });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

/** Parse and validate common chart params from a URL. */
function parseChartParams(url: URL) {
  const usersParam = url.searchParams.get("users");
  const rangeParam = url.searchParams.get("range") || "3m";
  const selfUser = url.searchParams.get("self") || "";
  const themeParam = url.searchParams.get("theme") || "light";

  if (!usersParam) return { error: "Missing ?users= parameter" };
  if (!VALID_RANGES.has(rangeParam)) return { error: `Invalid range "${rangeParam}"` };

  const theme = VALID_THEMES.has(themeParam) ? themeParam as "light" | "dark" : "light" as const;

  const usernames = usersParam
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_USERS);

  if (usernames.length === 0) return { error: "No usernames provided" };

  return { usernames, range: rangeParam as TimeRange, selfUser, theme };
}

/** Result of generateSvg — carries failed usernames so callers can surface them. */
interface GenerateResult {
  svg: string;
  failedUsers: string[];
}

/** Generate SVG string for given params (shared by /api/svg and /api/png). */
async function generateSvg(
  env: Env,
  usernames: string[],
  range: TimeRange,
  selfUser: string,
  theme: "light" | "dark" = "light"
): Promise<GenerateResult> {
  // Cache key captures the request; we only read from it when the cached result
  // was fully successful (no failedUsers). Partial results are never cached, so
  // a transient error (e.g. expired token) can't get pinned to the cache key.
  const svgCacheKey = `svg:${[...usernames].sort().join(",")}:${range}:${selfUser}:${theme}`;
  const cachedSvg = await env.CACHE.get(svgCacheKey);
  if (cachedSvg) return { svg: cachedSvg, failedUsers: [] };

  const [contribResults, avatarResults] = await Promise.all([
    Promise.allSettled(
      usernames.map((username) => fetchUserContributions(env, username, range))
    ),
    Promise.allSettled(
      usernames.map((username) => fetchAvatar(username))
    ),
  ]);

  const datasets: ChartData[] = [];
  const failedUsers: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < contribResults.length; i++) {
    const result = contribResults[i];
    if (result.status === "fulfilled") {
      const filtered = filterByRange(result.value.daily, range);
      const smoothed = applyMovingAverage(filtered, 3);
      const avatarResult = avatarResults[i];
      const avatar = avatarResult.status === "fulfilled" ? avatarResult.value : undefined;
      datasets.push({
        username: result.value.username,
        points: smoothed,
        avatarBase64: avatar,
      });
    } else {
      failedUsers.push(usernames[i]);
      errors.push(`${usernames[i]}: ${result.reason?.message || "unknown error"}`);
    }
  }

  if (datasets.length === 0) {
    return { svg: renderErrorSvg(errors.join("; "), theme), failedUsers };
  }

  const svg = renderChart(datasets, selfUser || undefined, theme);

  if (failedUsers.length === 0) {
    await env.CACHE.put(svgCacheKey, svg, { expirationTtl: 86400 });
  }

  return { svg, failedUsers };
}

async function handleSvg(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const params = parseChartParams(url);
  if ("error" in params) {
    return svgResponse(renderErrorSvg(params.error as string));
  }

  const { svg, failedUsers } = await generateSvg(
    env,
    params.usernames,
    params.range,
    params.selfUser,
    params.theme
  );
  return svgResponse(svg, { failedUsers });
}

async function handlePng(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const params = parseChartParams(url);
  if ("error" in params) {
    return svgResponse(renderErrorSvg(params.error as string));
  }

  const { usernames, range, selfUser, theme } = params;

  // Check PNG cache first
  const pngCacheKey = `png:${[...usernames].sort().join(",")}:${range}:${selfUser}:${theme}`;
  const cachedPng = await env.CACHE.get(pngCacheKey, "arrayBuffer");
  if (cachedPng) {
    return new Response(cachedPng, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=1800",
        ...corsHeaders(),
      },
    });
  }

  // Use Cloudflare Browser Rendering to screenshot the SVG
  const selfParam = selfUser ? `&self=${selfUser}` : "";
  const themeParam = theme === "dark" ? `&theme=dark` : "";
  const svgUrl = `https://codewar.dev/api/svg?users=${usernames.join(",")}&range=${range}${selfParam}${themeParam}`;

  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 628 });

  // Render SVG centered in OG-standard 1200×628 frame (1.91:1 ratio for X/Twitter)
  const html = `<html><body style="margin:0;padding:0;background:#fff;display:flex;align-items:center;justify-content:center;width:1200px;height:628px"><img src="${svgUrl}" style="max-width:1160px;max-height:588px;width:auto;height:auto"></body></html>`;
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Wait for draw animation to complete
  await new Promise(r => setTimeout(r, 1500));

  const pngBuffer = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 1200, height: 628 },
  }) as Buffer;
  await browser.close();

  // Cache PNG for 24 hours
  await env.CACHE.put(pngCacheKey, pngBuffer, { expirationTtl: 86400 });

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=1800",
      ...corsHeaders(),
    },
  });
}

async function handleApi(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const usersParam = url.searchParams.get("users");
  const rangeParam = url.searchParams.get("range") || "3m";

  if (!usersParam) {
    return jsonResponse({ error: "Missing ?users= parameter" }, 400);
  }

  if (!VALID_RANGES.has(rangeParam)) {
    return jsonResponse({ error: `Invalid range "${rangeParam}"` }, 400);
  }

  const usernames = usersParam
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_USERS);

  const range = rangeParam as TimeRange;

  const results = await Promise.allSettled(
    usernames.map((username) => fetchUserContributions(env, username, range))
  );

  const datasets: ChartData[] = [];
  const failedUsers: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const filtered = filterByRange(result.value.daily, range);
      const smoothed = applyMovingAverage(filtered, 3);
      datasets.push({
        username: result.value.username,
        points: smoothed,
      });
    } else {
      failedUsers.push(usernames[i]);
    }
  }

  return jsonResponse({ datasets, failedUsers });
}

/** Inject OG/Twitter meta tags into HTML for social sharing. */
async function handlePageWithOgTags(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);

  // Parse user params from either new or legacy format
  const selfUser = url.searchParams.get("user") || "";
  const targetsParam = url.searchParams.get("targets") || "";
  const usersParam = url.searchParams.get("users") || "";
  const range = url.searchParams.get("range") || "3m";

  let allUsers: string[];
  let targets: string[];

  if (targetsParam) {
    targets = targetsParam.split(",").map(u => u.trim()).filter(Boolean);
    allUsers = [selfUser, ...targets].filter(Boolean);
  } else if (usersParam) {
    allUsers = usersParam.split(",").map(u => u.trim()).filter(Boolean);
    targets = selfUser ? allUsers.filter(u => u !== selfUser) : allUsers;
  } else {
    // No chart params — serve static page as-is
    return env.ASSETS.fetch(request);
  }

  if (allUsers.length === 0) {
    return env.ASSETS.fetch(request);
  }

  // Build image URLs
  const selfParam = selfUser ? `&self=${selfUser}` : "";
  const pngUrl = `https://codewar.dev/api/png?users=${allUsers.join(",")}&range=${range}${selfParam}`;
  const pageUrl = `https://codewar.dev/${url.search}`;

  const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:title" content="Code War — Compare GitHub Contributions">
    <meta property="og:description" content="Compare GitHub contributions over time on codewar.dev">
    <meta property="og:image" content="${pngUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Code War — Compare GitHub Contributions">
    <meta name="twitter:description" content="Compare GitHub contributions over time">
    <meta name="twitter:image" content="${pngUrl}">`;

  // Fetch the static HTML and inject OG tags
  const assetResponse = await env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  let html = await assetResponse.text();
  html = html.replace("</head>", `${ogTags}\n</head>`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/svg") {
      return handleSvg(request, env);
    }

    if (url.pathname === "/api/png") {
      return handlePng(request, env);
    }

    if (url.pathname === "/api/data") {
      return handleApi(request, env);
    }

    // Root with chart params — inject OG tags for social sharing
    if (url.pathname === "/" && (url.searchParams.has("user") || url.searchParams.has("targets") || url.searchParams.has("users"))) {
      return handlePageWithOgTags(request, env);
    }

    // Everything else: serve static assets (website)
    return env.ASSETS.fetch(request);
  },
};
