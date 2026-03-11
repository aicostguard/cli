# ai-cost-cli

> **AI Cost Guard CLI** -- See exactly how much money you are spending on AI (OpenAI, Anthropic, Gemini) right inside your terminal.

Think of it like a **bank statement for your AI API bills** -- live, colorful, and completely free.

[![npm version](https://img.shields.io/npm/v/ai-cost-cli.svg)](https://www.npmjs.com/package/@ai-cost-guard/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 16](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)

<p align="center">
  🌐 <a href="https://aicostguard.com"><strong>AI Cost Guard Dashboard</strong></a> &nbsp;·&nbsp;
  ⭐ <strong>Star this repo if you find it useful!</strong>
</p>

---

## What Does This Do?

Every time your app calls the OpenAI, Anthropic, or Google AI APIs, it costs you money (charged per "token").

This CLI connects to your **AI Cost Guard account** and shows you:

- Total AI **spending** for the last 7, 30, or 90 days
- **Which model costs the most** (GPT-4o vs Claude vs Gemini)
- **Smart suggestions** to switch to a cheaper model and save 40-80%
- **Live pricing** for 50+ AI models

---

## Getting Started -- Full Step-by-Step Guide

Follow these 5 steps in order. Do not skip Step 2 -- you cannot use the CLI without an account and a project.

---

### Step 1 -- Install the CLI

Open your terminal and run:

```bash
npm install -g @ai-cost-guard/cli
```

You will now have two command aliases (both do the same thing):

```bash
ai-cost-cli --help   # full command
ai-cost --help       # shorthand
```

---

### Step 2 -- Create a Free Account

You need an account before you can do anything else.

#### Option A -- Sign up from your terminal (fastest)

```bash
ai-cost-cli signup
```

The CLI will ask for:
- Your name
- Your email address
- A password (minimum 8 characters)

Your account is created instantly.

#### Option B -- Sign up on the website

1. Go to **https://aicostguard.com**
2. Click the **"Get Started"** button (top-right of the homepage)
3. Fill in your name, email address, and password
4. Click **"Sign Up"**

You will land on your dashboard automatically.

---

### Step 3 -- Create a Project and Get Your API Key

A **project** is how AI Cost Guard organises your AI costs.
Think of it like a folder -- one project per app you build.

You must create at least one project before you can get an API key.

#### Option A -- Create a project from your terminal (fastest)

```bash
ai-cost-cli projects create
```

The CLI will ask for:
- **Project name** (e.g. `My Chatbot App`)
- **Description** (optional, e.g. `Tracks GPT-4o costs for my support bot`)

Your project is created instantly and its API key is saved automatically -- no copy-paste needed.
You can run `ai-cost-cli analyze` right away.

#### Option B -- Create a project on the website:

```
1.  Log in at  https://aicostguard.com
2.  You are now on the Dashboard
3.  Click "Projects" in the left sidebar
4.  Click the "New Project" button (top right of the page)
5.  Fill in:
      - Project Name   e.g.  My Chatbot App
      - Description    e.g.  Tracks GPT-4o costs for my support bot
6.  Click "Create Project"
7.  Your new project card appears on the page
8.  On that project card, click the "API Keys" button
9.  You will see a default API key -- it looks like:  acg_live_abc123def456...
10. Click "Copy" to copy it to your clipboard
```

> Tip: You can also click "Generate New Key" on that screen if you want a fresh key.

#### Or let the CLI fetch your key automatically (after logging in):

```bash
ai-cost-cli login
```

After login the CLI will:
1. Show you a numbered list of all your projects
2. Ask you to pick one
3. Automatically save that project's API key -- no copy-paste needed

---

### Step 4 -- Connect the CLI to Your Project

#### Option A -- Log in and pick a project (recommended for most people)

```bash
ai-cost-cli login
```

The CLI logs you in, lists your projects, and saves the key automatically.

#### Option B -- Connect directly with your API key

```bash
ai-cost-cli connect --key acg_live_xxxxxxxxxxxx
```

Replace `acg_live_xxxxxxxxxxxx` with the key you copied in Step 3.

#### Verify you are connected:

```bash
ai-cost-cli status
```

You should see your project name, email, and a masked API key.

---

### Step 5 -- See Your AI Costs

```bash
ai-cost-cli analyze
```

This prints a full cost breakdown right in your terminal.

```bash
ai-cost-cli analyze --days 7    # last 7 days
ai-cost-cli analyze --days 90   # last 3 months
```

---

## All Commands at a Glance

| Command | What it does |
|---------|-------------|
| `ai-cost-cli signup` | Create a FREE account -- **start here if you are new** |
| `ai-cost-cli login` | Log in and connect to a project automatically |
| `ai-cost-cli projects create` | Create a new project and get an API key |
| `ai-cost-cli projects list` | List all your projects and switch active project |
| `ai-cost-cli connect --key YOUR_KEY` | Connect using an API key directly |
| `ai-cost-cli status` | Check whether you are connected |
| `ai-cost-cli analyze` | Full AI cost report (last 30 days) |
| `ai-cost-cli analyze --days 7` | Report for last 7 days |
| `ai-cost-cli analyze --days 90` | Report for last 90 days |
| `ai-cost-cli optimize` | Get tips to cut your AI bill |
| `ai-cost-cli models` | Browse all AI models and their live pricing |

---

## How to Find Your API Key (Step by Step)

If you already have an account and just need your API key:

```
1.  Open    https://aicostguard.com
2.  Click "Log In" -- enter your email and password
3.  You are now on the Dashboard
4.  Click "Projects" in the left sidebar
5.  Find your project card
6.  Click the "API Keys" button on that card
7.  Copy the key that starts with  acg_live_
8.  In your terminal run:

      ai-cost-cli connect --key acg_live_YOUR_KEY_HERE
```

---

## Command Reference

### `signup` -- Create a New Account

```bash
ai-cost-cli signup
```

Prompts for your name, email, and password. Creates your account and logs you in immediately.
**This is the very first command you should run if you are new.**

---

### `login` -- Log In and Select a Project

```bash
ai-cost-cli login
ai-cost-cli login --email you@example.com
```

| Option | Description |
|--------|-------------|
| `-e, --email <email>` | Pre-fill your email so you skip that prompt |

What happens after you log in:
- You are authenticated
- The CLI fetches all your projects from the server
- You pick one from a numbered list
- That project's API key is saved automatically to your computer

---

### `connect` -- Connect With an API Key

```bash
ai-cost-cli connect --key acg_live_xxxxxxxxxxxx
```

| Option | Description |
|--------|-------------|
| `-k, --key <apiKey>` | Your project API key (starts with `acg_live_`) |

Use this if you already have your API key and want to skip the login flow.

---

### `projects create` -- Create a New Project

```bash
ai-cost-cli projects create
```

Creates a brand-new project and saves its API key to your computer automatically.
You must be logged in first (run `ai-cost-cli login` if you have not already).

The CLI will ask for:
- **Project name** (2 to 100 characters, e.g. `My Chatbot App`)
- **Description** (optional, e.g. `Tracks GPT-4o costs for my support bot`)

After creation you will see:
- Your new project name
- A masked version of your API key
- Confirmation that the key has been saved

You can then run `ai-cost-cli analyze` immediately -- no copy-paste needed.

> **Tip:** When you sign up with `ai-cost-cli signup`, the CLI will automatically
> offer to create your first project right away so you never have to leave your terminal.

---

### `projects list` -- List All Projects

```bash
ai-cost-cli projects list
```

Fetches all your projects from the server and displays them in a numbered table:

```
  #   Project Name        Project ID    API Key
  1   My Chatbot App      a1b2c3d4      acg_live_****...abc
  2   Analytics Bot       e5f6g7h8      acg_live_****...xyz
```

After the list is shown the CLI will ask you to **pick a number**.
The project you choose becomes the **active project** -- its API key is saved
automatically so all future `analyze` and `optimize` commands use it.

Use this command any time you want to switch between projects.

---

### `status` -- Check Your Connection

```bash
ai-cost-cli status
```

Shows:
- Whether you are connected (yes or no)
- Your API key (masked for safety)
- Project name
- Your logged-in email
- Which server you are connected to

---

### `analyze` -- See Your Cost Report

```bash
ai-cost-cli analyze
ai-cost-cli analyze --days 7
ai-cost-cli analyze --days 90 --model gpt-4o
ai-cost-cli analyze --provider anthropic
```

| Option | Description |
|--------|-------------|
| `-d, --days <n>` | How many days back to look (default: 30) |
| `-m, --model <model>` | Filter to one specific model |
| `-p, --provider <provider>` | Filter by provider: `openai`, `anthropic`, or `google` |

The report shows:
- Total money spent
- Total tokens used (input and output separately)
- Cost broken down by each model
- Day-by-day cost chart
- Response time statistics

---

### `optimize` -- Get Cost-Cutting Tips

```bash
ai-cost-cli optimize
ai-cost-cli optimize --days 7
```

| Option | Description |
|--------|-------------|
| `-d, --days <n>` | Days of usage to analyse (default: 30) |

Looks at which models you are using and finds cheaper alternatives that do the same job.
You can often save **40-80%** just by switching models.

---

### `models` -- Browse All AI Pricing

```bash
ai-cost-cli models
ai-cost-cli models --provider openai
ai-cost-cli models --provider anthropic
```

| Option | Description |
|--------|-------------|
| `-p, --provider <provider>` | Filter by provider name (case-insensitive) |

Shows a colour-coded table: input price per 1M tokens, output price per 1M tokens, and a cost tier label (budget / standard / premium).

---

## Where Is My Login Saved?

Everything is stored only on your own computer (never uploaded anywhere) at:

```
~/.ai-costguard/config.json
```

To log out and erase all saved data:

```bash
rm ~/.ai-costguard/config.json
```

---

## Supported AI Providers

| Provider | Example Models |
|----------|---------------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o3-mini |
| **Anthropic** | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus |
| **Google** | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash |
| **Cohere** | command-r-plus, command-r |

Run `ai-cost-cli models` for the full live list with current pricing.

---

## Requirements

- **Node.js** version 16 or newer -- download at https://nodejs.org
- A **free AI Cost Guard account** -- sign up at https://aicostguard.com/signup

---

## Troubleshooting

**"Connection refused" or network error**
- Check your internet connection
- The CLI connects to https://api.aicostguard.com

**"Invalid credentials" when logging in**
- Double-check your email and password
- Reset your password at: https://aicostguard.com/forgot-password

**"No projects found" after login**
- You need to create a project first -- you can do it right from your terminal:
  ```bash
  ai-cost-cli projects create
  ```
- Or go to https://aicostguard.com/dashboard/projects, click "New Project", fill in the name, then run `ai-cost-cli login` again

**"Invalid API key"**
- Make sure you copied the full key (it starts with `acg_live_`)
- Run: `ai-cost-cli connect --key acg_live_YOUR_FULL_KEY_HERE`

**Still stuck?**
- Email: info@aicostguard.com
- GitHub Issues: https://github.com/aicostguard/cli/issues

---

## Links

| | |
|--|--|
| Website | https://aicostguard.com |
| Sign Up Free | https://aicostguard.com/signup |
| Dashboard | https://aicostguard.com/dashboard |
| Projects | https://aicostguard.com/dashboard/projects |
| Full Docs | https://aicostguard.com/docs |
| npm | https://www.npmjs.com/package/@ai-cost-guard/cli |
| Report a Bug | https://github.com/aicostguard/cli/issues |

---

## 📸 Dashboard Preview

<p align="center">
  <img src="https://aicostguard.com/dashboard/1.png" alt="AI Cost Guard — Main Dashboard" width="48%" />
  &nbsp;
  <img src="https://aicostguard.com/dashboard/4.png" alt="AI Cost Guard — Cost Analytics" width="48%" />
</p>
<p align="center">
  <img src="https://aicostguard.com/dashboard/5.png" alt="AI Cost Guard — AI Intelligence" width="48%" />
  &nbsp;
  <img src="https://aicostguard.com/dashboard/6.png" alt="AI Cost Guard — Budget Alerts" width="48%" />
</p>

<p align="center">
  <a href="https://aicostguard.com"><strong>🌐 Try the live dashboard →</strong></a>
</p>

---

## License

MIT (c) AI Cost Guard -- https://aicostguard.com

<p align="center">⭐ If this project helps you, <strong>give it a star</strong> — it helps others discover it too!</p>
