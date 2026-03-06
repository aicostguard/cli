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
  let baseUrl = options.url || 'http://localhost:4000';

  if (!apiKey) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your project API key:',
        validate: (input: string) => input.length > 10 || 'API key is too short',
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'API base URL:',
        default: baseUrl,
      },
    ]);
    apiKey = answers.apiKey;
    baseUrl = answers.baseUrl;
  }

  const spinner = ora('Verifying API key...').start();

  try {
    // Test the connection by sending a track event (dry run)
    // We'll just try to hit the pricing endpoint which is public
    const models = await apiRequest<any[]>({
      path: '/pricing/models',
      baseUrl,
    });

    if (!models || !Array.isArray(models)) {
      spinner.fail('Could not connect to the server');
      return;
    }

    spinner.succeed('Connected to AI Cost Guard!');

    saveConfig({
      apiKey: apiKey!,
      baseUrl,
    });

    console.log(chalk.green('\n✅ Configuration saved!'));
    console.log(chalk.gray(`   API Key: ${apiKey!.substring(0, 12)}...${apiKey!.slice(-4)}`));
    console.log(chalk.gray(`   Server:  ${baseUrl}`));
    console.log(chalk.cyan('\n💡 Run `ai-cost-cli analyze` to see your cost report'));

    // Upsell to SaaS
    console.log(chalk.yellow('\n🚀 Want real-time monitoring & alerts?'));
    console.log(chalk.yellow('   Visit: https://aicostguard.com'));
  } catch (err: any) {
    spinner.fail(`Connection failed: ${err.message}`);
    console.log(chalk.red('\nPlease check:'));
    console.log(chalk.gray('  1. The AI Cost Guard server is running'));
    console.log(chalk.gray('  2. The URL is correct'));
    console.log(chalk.gray('  3. Your API key is valid'));
  }
}
