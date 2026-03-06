import chalk from 'chalk';
import { getConfig } from '../config';

export async function statusCommand() {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Status\n'));

  const config = getConfig();

  if (!config) {
    console.log(chalk.red('❌ Not connected'));
    console.log(chalk.gray('\nRun `ai-cost-cli connect` to set up your project'));
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
