import * as http from 'http';
import * as https from 'https';
import { getConfig } from './config';

interface RequestOptions {
  path: string;
  method?: string;
  body?: any;
  apiKey?: string;
  baseUrl?: string;
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const config = getConfig();
  const baseUrl = options.baseUrl || config?.baseUrl || 'http://localhost:4000';
  const apiKey = options.apiKey || config?.apiKey;

  const fullUrl = `${baseUrl}/api/v1${options.path}`;
  const url = new URL(fullUrl);

  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const body = options.body ? JSON.stringify(options.body) : undefined;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            try {
              const json = JSON.parse(data);
              const message = json.message || json.error || `HTTP ${res.statusCode}`;
              reject(new Error(message));
            } catch {
              reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
            }
            return;
          }
          try {
            const json = JSON.parse(data);
            // Handle TransformInterceptor wrapper
            if (json.data !== undefined) {
              resolve(json.data as T);
            } else {
              resolve(json as T);
            }
          } catch {
            reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
          }
        });
      },
    );

    req.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}\nMake sure the AI Cost Guard server is running.`));
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export async function apiRequestAuth<T>(path: string, token: string, baseUrl?: string): Promise<T> {
  const config = getConfig();
  const base = baseUrl || config?.baseUrl || 'http://localhost:4000';
  const fullUrl = `${base}/api/v1${path}`;
  const url = new URL(fullUrl);

  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            try {
              const json = JSON.parse(data);
              const message = json.message || json.error || `HTTP ${res.statusCode}`;
              reject(new Error(message));
            } catch {
              reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
            }
            return;
          }
          try {
            const json = JSON.parse(data);
            if (json.data !== undefined) {
              resolve(json.data as T);
            } else {
              resolve(json as T);
            }
          } catch {
            reject(new Error(`Invalid JSON response`));
          }
        });
      },
    );
    req.on('error', (err) => reject(new Error(`Connection failed: ${err.message}`)));
    req.end();
  });
}
