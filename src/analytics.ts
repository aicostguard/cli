import { PostHog } from 'posthog-node';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const POSTHOG_API_KEY = 'phc_bX4Ab8QZ0WZL8nsEQfaTw2E6xtijwVjb6jIvbhZ436f';
const POSTHOG_HOST = 'https://us.i.posthog.com';

const CONFIG_DIR = path.join(os.homedir(), '.ai-costguard');
const ANALYTICS_FILE = path.join(CONFIG_DIR, 'analytics.json');

interface AnalyticsState {
  lastCliDay?: string;
  optOut?: boolean;
}

function getState(): AnalyticsState {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveState(state: AnalyticsState): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(state, null, 2));
  } catch {
    // ignore — analytics should never break CLI
  }
}

/** Get user ID from CLI config (set during login) */
function getUserId(): string | null {
  try {
    const configPath = path.join(CONFIG_DIR, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.userId || config.email || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Track cli_used_daily — fires at most once per calendar day.
 * Fire-and-forget, never blocks CLI execution.
 */
export async function trackCliUsage(command: string): Promise<void> {
  try {
    const state = getState();

    // Respect opt-out
    if (state.optOut) return;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Daily dedup — only one event per day
    if (state.lastCliDay === today) return;

    const userId = getUserId();
    if (!userId) return; // Only track logged-in users

    const client = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST });

    client.capture({
      distinctId: userId,
      event: 'cli_used_daily',
      properties: {
        command,
        platform: process.platform,
        node_version: process.version,
      },
    });

    // Update last usage day
    state.lastCliDay = today;
    saveState(state);

    // Flush and close — with a timeout so we don't block CLI exit
    await Promise.race([
      client.shutdown(),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    // Analytics should NEVER break the CLI
  }
}

/** Allow users to opt out of analytics */
export function setAnalyticsOptOut(optOut: boolean): void {
  const state = getState();
  state.optOut = optOut;
  saveState(state);
}
