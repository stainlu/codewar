import type { DailyContribution, Env, UserContributions } from "./types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function fetchAvatar(username: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://github.com/${username}.png?size=80`, {
      redirect: "follow",
    });
    if (!res.ok) return undefined;
    const buffer = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

const GRAPHQL_URL = "https://api.github.com/graphql";

const CONTRIBUTION_YEARS_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

const CONTRIBUTIONS_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "codewar",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error("GitHub GraphQL returned no data");
  }

  return json.data;
}

async function fetchContributionYears(
  token: string,
  username: string
): Promise<number[]> {
  const data = await graphql<{
    user: { contributionsCollection: { contributionYears: number[] } } | null;
  }>(token, CONTRIBUTION_YEARS_QUERY, { username });

  if (!data.user) {
    throw new Error(`User "${username}" not found`);
  }

  return data.user.contributionsCollection.contributionYears;
}

async function fetchYearContributions(
  token: string,
  username: string,
  year: number
): Promise<DailyContribution[]> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const data = await graphql<{
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: Array<{
            contributionDays: Array<{
              contributionCount: number;
              date: string;
            }>;
          }>;
        };
      };
    };
  }>(token, CONTRIBUTIONS_QUERY, { username, from, to });

  const days: DailyContribution[] = [];
  for (const week of data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
    }
  }

  return days;
}

/**
 * Determine which years we need to fetch based on the requested range.
 * For "3m" we only need the current year + possibly the previous year.
 */
function getNeededYears(allYears: number[], range: string): number[] {
  if (range === "all") return allYears;

  const now = new Date();
  const currentYear = now.getFullYear();
  let cutoffYear: number;

  switch (range) {
    case "1m":
    case "3m":
      // Need current year + previous year (range might cross Jan 1)
      cutoffYear = currentYear - 1;
      break;
    case "1y":
      cutoffYear = currentYear - 1;
      break;
    default:
      return allYears;
  }

  return allYears.filter((y) => y >= cutoffYear);
}

export async function fetchUserContributions(
  env: Env,
  username: string,
  range = "all"
): Promise<UserContributions> {
  // Check cache first
  const cacheKey = `contributions:${username.toLowerCase()}`;
  const cached = await env.CACHE.get(cacheKey, "json");
  if (cached) {
    return cached as UserContributions;
  }

  // Fetch from GitHub — only the years we need
  const allYears = await fetchContributionYears(env.GITHUB_TOKEN, username);
  const neededYears = getNeededYears(allYears, range);

  // Fetch needed years in parallel
  const yearResults = await Promise.all(
    neededYears.map((year) => fetchYearContributions(env.GITHUB_TOKEN, username, year))
  );

  // Merge and sort by date
  const daily = yearResults.flat().sort((a, b) => a.date.localeCompare(b.date));

  const result: UserContributions = {
    username,
    daily,
    fetchedAt: Date.now(),
  };

  // Cache for 24 hours
  await env.CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: 86400,
  });

  return result;
}
