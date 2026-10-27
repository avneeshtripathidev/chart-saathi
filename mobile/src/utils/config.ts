// Mobile environment configuration
// In production, use EAS environment variables

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const APP_VERSION = '1.0.0';

export const CHART_FRESHNESS_WARN_MINUTES = 10;
export const SEARCH_DEBOUNCE_MS = 400;
export const MAX_RECENT_SEARCHES = 10;
