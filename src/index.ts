import type { Env, TimeRange, ChartData } from "./types";
import { fetchUserContributions, fetchAvatar } from "./github";
import { filterByRange, applyMovingAverage } from "./smoothing";
import { renderChart, renderErrorSvg } from "./chart";

const VALID_RANGES = new Set(["1m", "3m", "1y", "all"]);
const MAX_USERS = 5;

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function svgResponse(svg: string, cacheSeconds = 1800): Response {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${cacheSeconds}`,
      ...corsHeaders(),
    },
  });
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

async function handleSvg(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const usersParam = url.searchParams.get("users");
  const rangeParam = url.searchParams.get("range") || "3m";

  if (!usersParam) {
    return svgResponse(
      renderErrorSvg("Missing ?users= parameter. Example: ?users=torvalds,mitchellh")
    );
  }

  if (!VALID_RANGES.has(rangeParam)) {
    return svgResponse(
      renderErrorSvg(`Invalid range "${rangeParam}". Use: 3m, 6m, 1y, or all`)
    );
  }

  const usernames = usersParam
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_USERS);

  if (usernames.length === 0) {
    return svgResponse(renderErrorSvg("No usernames provided"));
  }

  const range = rangeParam as TimeRange;
  const selfUser = url.searchParams.get("self") || "";

  // Check SVG cache first (keyed by sorted users + range + self)
  const svgCacheKey = `svg:${[...usernames].sort().join(",")}:${range}:${selfUser}`;
  const cachedSvg = await env.CACHE.get(svgCacheKey);
  if (cachedSvg) {
    return svgResponse(cachedSvg);
  }

  // Fetch all users' data and avatars in parallel
  const [contribResults, avatarResults] = await Promise.all([
    Promise.allSettled(
      usernames.map((username) => fetchUserContributions(env, username, range))
    ),
    Promise.allSettled(
      usernames.map((username) => fetchAvatar(username))
    ),
  ]);

  const datasets: ChartData[] = [];
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
      errors.push(`${usernames[i]}: ${result.reason?.message || "unknown error"}`);
    }
  }

  if (datasets.length === 0) {
    return svgResponse(renderErrorSvg(errors.join("; ")));
  }

  const svg = renderChart(datasets, selfUser || undefined);

  // Cache the rendered SVG for 24 hours
  await env.CACHE.put(svgCacheKey, svg, { expirationTtl: 86400 });

  return svgResponse(svg);
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

  for (const result of results) {
    if (result.status === "fulfilled") {
      const filtered = filterByRange(result.value.daily, range);
            const smoothed = applyMovingAverage(filtered, 3);
      datasets.push({
        username: result.value.username,
        points: smoothed,
      });
    }
  }

  return jsonResponse({ datasets });
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

    if (url.pathname === "/api/data") {
      return handleApi(request, env);
    }

    // Everything else: serve static assets (website)
    return env.ASSETS.fetch(request);
  },
};
