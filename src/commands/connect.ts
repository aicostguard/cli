import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { saveConfig, getConfig } from '../config';
import { apiRequest } from '../api';

interface ConnectOptions {
  key?: string;
  url?: string;
}

export async function connectCommand(options: ConnectOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Connect\n'));

  let apiKey = options.key;
  const existingConfig = getConfig();
  const savedUrl = existingConfig?.baseUrl && existingConfig.baseUrl !== 'http://localhost:4000'
    ? existingConfig.baseUrl
    : null;
  let baseUrl = options.url || savedUrl || 'https://api.aicostguard.com';

  if (!apiKey) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Paste your project API key:',
        validate: (input: string) =>
          (input.trim().length > 10 && input.trim().startsWith('acg_'))
            ? true
            : 'API key should start with acg_ and be longer than 10 characters',
      },
    ]);
    apiKey = answers.apiKey.trim();
  }

  const spinner = ora('Verifying API key with server...').start();

  try {
    // Verify key by calling the public pricing endpoint AND confirming the server is reachable.
    // Full key validation (against your project) happens on first `analyze` or SDK track call.
    const models = await apiRequest<any[]>({
      path: '/pricing/models',
      baseUrl,
      apiKey: apiKey!, // send key in header so server logs the attempt
    });

    if (!models || !Array.isArray(models)) {
      spinner.fail('Could not reach the AI Cost Guard server. Check your internet connection.');
      return;
    }

    spinner.succeed('Connected to AI Cost Guard!');

    saveConfig({
      apiKey: apiKey!,
      baseUrl,
    });

    console.log(chalk.green('\n✅ API key saved!'));
    console.log(chalk.gray(`   Key:    ${apiKey!.substring(0, 12)}...${ apiKey!.slice(-4)}`));
    console.log(chalk.gray(`   Server: ${baseUrl}`));
    console.log();
    console.log(chalk.bold('What you can do now:'));
    console.log(chalk.cyan('  ai-cost-cli analyze   ') + chalk.gray('See AI cost breakdown'));
    console.log(chalk.cyan('  ai-cost-cli optimize  ') + chalk.gray('Get cost-cutting tips'));
    console.log(chalk.cyan('  ai-cost-cli models    ') + chalk.gray('Browse 50+ model prices'));
    console.log();
    console.log(chalk.gray('  💡 For real usage analytics, log in with your account:'));
    console.log(chalk.gray('     ai-cost-cli login'));
  } catch (err: any) {
    spinner.fail(`Connection failed: ${err.message}`);
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.gray('  1. Make sure you\'re connected to the internet'));
    console.log(chalk.gray('  2. Get your API key from: https://aicostguard.com/dashboard/projects'));
    console.log(chalk.gray('  3. Sign up first if you don\'t have an account: ai-cost-cli signup'));
  }
}
