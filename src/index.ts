#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze';
import { connectCommand } from './commands/connect';
import { loginCommand } from './commands/login';
import { statusCommand } from './commands/status';
import { optimizeCommand } from './commands/optimize';
import { modelsCommand } from './commands/models';
import { trackCliUsage } from './analytics';

const program = new Command();

program
  .name('ai-cost-cli')
  .description('🛡️  AI Cost Guard — Analyze and optimize your AI API costs from the terminal')
  .version('1.0.0');

program
  .command('login')
  .description('Login with your AI Cost Guard account (email/password)')
  .option('-e, --email <email>', 'Email address')
  .option('-u, --url <url>', 'API base URL (default: http://localhost:4000)')
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
  .description('Connect to your AI Cost Guard project')
  .option('-k, --key <apiKey>', 'API key for your project')
  .option('-u, --url <url>', 'API base URL (default: http://localhost:4000)')
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

program.parse();

// Fire-and-forget analytics — track once per day
const command = process.argv[2] || 'unknown';
trackCliUsage(command).catch(() => {});
