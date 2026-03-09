import chalk from 'chalk';
import { getConfig } from '../config';

export async function statusCommand() {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Status\n'));

  const config = getConfig();

  if (!config || (!config.apiKey && !config.token)) {
    console.log(chalk.red('❌ Not connected\n'));
    console.log(chalk.bold('First time here? 👋  Here\'s how to get started:\n'));
    console.log(chalk.white('  1️⃣  Create a FREE account:'));
    console.log(chalk.cyan('       ai-cost-cli signup\n'));
    console.log(chalk.white('  2️⃣  Already have an account? Log in:'));
    console.log(chalk.cyan('       ai-cost-cli login\n'));
    console.log(chalk.white('  3️⃣  Have an API key already?'));
    console.log(chalk.cyan('       ai-cost-cli connect --key YOUR_API_KEY\n'));
    console.log(chalk.gray('  🌐 Sign up on the web: https://aicostguard.com/signup'));
    return;
  }

  console.log(chalk.green('✅ Connected'));
  console.log();
  if (config.apiKey) {
    console.log(chalk.white('  API Key:  ') + chalk.gray(`${config.apiKey.substring(0, 12)}...${config.apiKey.slice(-4)}`));
  }
  console.log(chalk.white('  Server:   ') + chalk.gray(config.baseUrl));

  if (config.projectName) {
    console.log(chalk.white('  Project:  ') + chalk.cyan(config.projectName));
  }
  if (config.email) {
    console.log(chalk.white('  Email:    ') + chalk.gray(config.email));
  }

  console.log();
}
