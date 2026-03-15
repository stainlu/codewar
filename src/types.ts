export interface Env {
  CACHE: KVNamespace;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
}

export interface DailyContribution {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface UserContributions {
  username: string;
  daily: DailyContribution[];
  fetchedAt: number; // timestamp
}

export interface SmoothedPoint {
  date: string;
  value: number;
}

export interface ChartData {
  username: string;
  points: SmoothedPoint[];
  avatarBase64?: string;
}

export type TimeRange = "1m" | "3m" | "1y" | "all";
