# ai-cost-cli

> 🛡️ **AI Cost Guard CLI** — Analyze and optimize your AI/LLM API costs from the terminal.  
> Monitor OpenAI, Anthropic, Gemini, and Cohere spending with real-time dashboards, cost breakdowns, and optimization recommendations across 50+ models.

[![npm version](https://img.shields.io/npm/v/ai-cost-cli.svg)](https://www.npmjs.com/package/ai-cost-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js ≥ 16](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)

---

## Installation

```bash
npm install -g ai-cost-cli
```

After installation, two aliases are available:

```bash
ai-cost-cli --help
ai-cost   --help        # shorthand
```

---

## Quick Start

```bash
# 1. Log in and select a project (recommended)
ai-cost-cli login

# 2. — OR — connect directly with an API key
ai-cost-cli connect --key YOUR_API_KEY

# 3. Analyze the last 30 days of AI spending
ai-cost-cli analyze

# 4. Get model-switch recommendations to cut costs
ai-cost-cli optimize

# 5. Browse all supported models and pricing
ai-cost-cli models
```

---

## Commands

### `login`

Authenticate with your AI Cost Guard account. Automatically fetches your projects and lets you select one to connect.

```bash
ai-cost-cli login
ai-cost-cli login --email you@example.com
ai-cost-cli login --email you@example.com --url https://api.aicostguard.com
```

| Option | Description |
|--------|-------------|
| `-e, --email <email>` | Pre-fill your email address |
| `-u, --url <url>` | API base URL (default: `http://localhost:4000`) |

After login, your JWT token and selected project's API key are saved to `~/.ai-cost-guard/config.json`.

---

### `connect`

Connect to a project directly using a project API key (no account required).

```bash
ai-cost-cli connect
ai-cost-cli connect --key acg_live_xxxxxxxxxxxx
ai-cost-cli connect --key acg_live_xxxxxxxxxxxx --url https://api.aicostguard.com
```

| Option | Description |
|--------|-------------|
| `-k, --key <apiKey>` | Your project API key |
| `-u, --url <url>` | API base URL (default: `http://localhost:4000`) |

---

### `status`

Display the current connection status, project info, and recent activity.

```bash
ai-cost-cli status
```

Shows: logged-in email, project name, API key (masked), server URL, and events seen today.

---

### `analyze`

Pull a full cost report for your connected project.

```bash
ai-cost-cli analyze
ai-cost-cli analyze --days 7
ai-cost-cli analyze --days 90 --model gpt-4o
ai-cost-cli analyze --provider anthropic
```

| Option | Description |
|--------|-------------|
| `-d, --days <n>` | Analysis window in days (default: `30`) |
| `-m, --model <model>` | Filter results to a specific model |
| `-p, --provider <provider>` | Filter by provider: `openai`, `anthropic`, `google` |

**Output includes:**
- Total cost, total events, avg cost/event
- Input / output token totals
- Cost breakdown by model
- Cost breakdown by day (time series)
- Latency percentiles (p50 / p95 / p99) when available

When no JWT token is present, falls back to a pricing-only estimate based on the public `/pricing/models` endpoint.

---

### `optimize`

Get model-switch recommendations that can reduce your bill.

```bash
ai-cost-cli optimize
ai-cost-cli optimize --days 7
```

| Option | Description |
|--------|-------------|
| `-d, --days <n>` | Analysis period for usage context (default: `30`) |

Compares models within each provider and surfaces alternatives that cost **30%+ less** per token, with estimated savings percentages.

---

### `models`

Browse all supported models and their per-token pricing.

```bash
ai-cost-cli models
ai-cost-cli models --provider openai
ai-cost-cli models --provider anthropic
```

| Option | Description |
|--------|-------------|
| `-p, --provider <provider>` | Filter by provider name (case-insensitive) |

Displays a grouped, color-coded table with input price / output price per 1M tokens and a cost tier label.

---

## Configuration

Credentials and project info are stored locally in:

```
~/.ai-cost-guard/config.json
```

| Field | Set by | Description |
|-------|--------|-------------|
| `token` | `login` | JWT access token |
| `email` | `login` | Logged-in user's email |
| `apiKey` | `login` / `connect` | Project API key (used as `x-api-key` header) |
| `projectId` | `login` | Selected project UUID |
| `projectName` | `login` | Selected project display name |
| `baseUrl` | `login` / `connect` | Backend API base URL |

To reset, simply delete the file:

```bash
rm ~/.ai-cost-guard/config.json
```

---

## Self-Hosting

By default the CLI points to `http://localhost:4000`. To connect to a self-hosted or cloud instance, pass `--url` to any authentication command:

```bash
ai-cost-cli login --url https://api.your-instance.com
ai-cost-cli connect --key YOUR_KEY --url https://api.your-instance.com
```

---

## Supported Providers

| Provider | Example Models |
|----------|---------------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o3-mini |
| **Anthropic** | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus |
| **Google** | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash |
| **Cohere** | command-r-plus, command-r |

Run `ai-cost-cli models` for the full, live list sourced directly from your backend.

---

## Requirements

- **Node.js** ≥ 16.0.0
- A running [AI Cost Guard backend](https://github.com/crediblearena/ai-cost-guard) **or** a cloud account at [aicostguard.com](https://aicostguard.com)

---

## Links

- 🌐 [aicostguard.com](https://aicostguard.com)
- 📦 [npm: ai-cost-cli](https://www.npmjs.com/package/ai-cost-cli)
- 🐛 [Issue tracker](https://github.com/crediblearena/ai-cost-guard/issues)
- 📖 [Full documentation](https://aicostguard.com/docs)

---

## License

MIT © [AI Cost Guard](https://aicostguard.com)
