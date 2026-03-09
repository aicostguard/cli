import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.ai-costguard');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  apiKey: string;
  baseUrl: string;
  projectId?: string;
  projectName?: string;
  token?: string; // JWT access token from login
  email?: string;
}

export function getConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function updateConfig(partial: Partial<Config>): void {
  const existing = getConfig() || { apiKey: '', baseUrl: 'http://localhost:4000' };
  saveConfig({ ...existing, ...partial });
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
