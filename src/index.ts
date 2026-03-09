#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze';
import { connectCommand } from './commands/connect';
import { loginCommand } from './commands/login';
import { signupCommand } from './commands/signup';
import { statusCommand } from './commands/status';
import { optimizeCommand } from './commands/optimize';
import { modelsCommand } from './commands/models';
import { projectCreateCommand, projectListCommand } from './commands/project';
import { trackCliUsage } from './analytics';

// ── Viral loop — printed once on every invocation ────────────────────────────
// PRD recommendation: spread brand automatically through CLI output
const BRAND_LINE = '\x1b[36m\x1b[2m  🛡️  Tracking AI costs with AI Cost Guard · https://aicostguard.com\x1b[0m\n';

const program = new Command();

program
  .name('ai-cost-cli')
  .description('🛡️  AI Cost Guard — Monitor every LLM call and never get surprised by your AI bill again')
  .version('1.0.1')
  .hook('preAction', () => { process.stdout.write(BRAND_LINE); });

program
  .command('signup')
  .description('Create a FREE AI Cost Guard account (start here if you are new!)')
  .option('-u, --url <url>', 'API base URL', 'https://api.aicostguard.com')
  .action(signupCommand);

program
  .command('login')
  .description('Login with your AI Cost Guard account (email/password)')
  .option('-e, --email <email>', 'Email address')
  .option('-u, --url <url>', 'API base URL', 'https://api.aicostguard.com')
  .action(loginCommand);

program
  .command('analyze')
  .description('Analyze AI API costs for a connected project')
  .option('-d, --days <number>', 'Number of days to analyze', '30')
  .option('-m, --model <model>', 'Filter by specific model')
  .option('-p, --provider <provider>', 'Filter by provider (openai, anthropic, google)')
  .action(analyzeCommand);

program
  .command('connect')
  .description('Connect to your AI Cost Guard project using an API key')
  .option('-k, --key <apiKey>', 'API key for your project')
  .option('-u, --url <url>', 'API base URL', 'https://api.aicostguard.com')
  .action(connectCommand);

program
  .command('status')
  .description('Show connection status and project info')
  .action(statusCommand);

program
  .command('optimize')
  .description('Get AI cost optimization recommendations')
  .option('-d, --days <number>', 'Analysis period in days', '30')
  .action(optimizeCommand);

program
  .command('models')
  .description('List supported AI models and their pricing')
  .option('-p, --provider <provider>', 'Filter by provider')
  .action(modelsCommand);

const projectsCmd = program
  .command('projects')
  .description('Manage your AI Cost Guard projects');

projectsCmd
  .command('create')
  .description('Create a new project and get its API key')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --desc <description>', 'Project description')
  .action(projectCreateCommand);

projectsCmd
  .command('list')
  .description('List all your projects and switch active project')
  .action(projectListCommand);

program.parse();

// Fire-and-forget analytics — track once per day
const command = process.argv[2] || 'unknown';
trackCliUsage(command).catch(() => {});
