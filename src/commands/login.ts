import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { updateConfig, getConfig } from '../config';
import { apiRequest, apiRequestAuth } from '../api';
import { projectCreateCommand } from './project';

interface LoginOptions {
  email?: string;
  url?: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
}

interface ProjectListItem {
  id: string;
  name: string;
  apiKeys: ApiKeyItem[];
  eventsToday?: number;
}

export async function loginCommand(options: LoginOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Login\n'));

  const existingConfig = getConfig();
  // Migrate users who have the old localhost default saved in their config
  const savedUrl = existingConfig?.baseUrl && existingConfig.baseUrl !== 'http://localhost:4000'
    ? existingConfig.baseUrl
    : null;
  const baseUrl = options.url || savedUrl || 'https://api.aicostguard.com';

  // Prompt for credentials
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: options.email || existingConfig?.email,
      validate: (input: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || 'Enter a valid email address',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
      validate: (input: string) => input.length >= 6 || 'Password must be at least 6 characters',
    },
  ]);

  const spinner = ora('Authenticating...').start();

  try {
    const loginResult = await apiRequest<LoginResponse>({
      path: '/auth/login',
      method: 'POST',
      baseUrl,
      body: {
        email: answers.email,
        password: answers.password,
      },
    });

    if (!loginResult.accessToken) {
      spinner.fail('Login failed — invalid response from server');
      return;
    }

    spinner.succeed(`Logged in as ${chalk.cyan(loginResult.user.email)}`);

    // Save token
    updateConfig({
      token: loginResult.accessToken,
      email: loginResult.user.email,
      baseUrl,
    });

    // Fetch user's projects
    const projectSpinner = ora('Fetching your projects...').start();

    try {
      const projects = await apiRequestAuth<ProjectListItem[]>(
        '/projects',
        loginResult.accessToken,
        baseUrl,
      );

      projectSpinner.stop();

      if (projects && projects.length > 0) {
        console.log(chalk.bold(`\n📋 Your Projects:\n`));

        const projectChoices = projects.map((p) => ({
          name: `${p.name} (${p.id.substring(0, 8)}...)`,
          value: p,
        }));

        const { selectedProject } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedProject',
            message: 'Select a project to connect:',
            choices: projectChoices,
          },
        ]);

        const activeKey = selectedProject.apiKeys?.find((k: any) => k.isActive) || selectedProject.apiKeys?.[0];
        const projectApiKey = activeKey?.key || '';

        updateConfig({
          apiKey: projectApiKey,
          projectId: selectedProject.id,
          projectName: selectedProject.name,
        });

        console.log(chalk.green(`\n✅ Connected to project: ${selectedProject.name}`));
        console.log(chalk.gray(`   Project ID: ${selectedProject.id}`));
        if (projectApiKey) {
          console.log(chalk.gray(`   API Key:    ${projectApiKey.substring(0, 12)}...`));
        } else {
          console.log(chalk.yellow('   ⚠️  No active API key found. Go to the dashboard to create one.'));
          console.log(chalk.cyan('   https://aicostguard.com/dashboard/projects'));
        }
      } else {
        console.log(chalk.yellow('\n⚠️  No projects found for this account.\n'));

        const { createNow } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createNow',
            message: 'Create your first project now?',
            default: true,
          },
        ]);

        if (createNow) {
          await projectCreateCommand();
        } else {
          console.log(chalk.gray('\nWhen you\'re ready, run:'));
          console.log(chalk.cyan('  ai-cost-cli projects create\n'));
        }
      }
    } catch {
      projectSpinner.stop();
      console.log(chalk.yellow('\n⚠️  Could not fetch projects. Use `ai-cost-cli connect` to set up manually.'));
    }

    console.log(chalk.cyan('\n💡 Run `ai-cost-cli analyze` to see your cost report'));
    console.log(chalk.cyan('   Run `ai-cost-cli status` to check your connection'));
  } catch (err: any) {
    spinner.fail(`Login failed: ${err.message}`);
    console.log(chalk.red('\nPlease check your email and password.'));
    console.log(chalk.gray('Forgot password? Visit https://aicostguard.com/forgot-password'));
  }
}
