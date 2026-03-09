import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { updateConfig } from '../config';
import { apiRequest, apiRequestAuth } from '../api';
import { projectCreateCommand } from './project';

interface SignupOptions {
  url?: string;
}

interface SignupResponse {
  accessToken: string;
  refreshToken: string;
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
}

export async function signupCommand(options: SignupOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Create Your FREE Account\n'));
  console.log(chalk.gray('  Takes less than 30 seconds. No credit card required.\n'));

  const baseUrl = options.url || 'https://api.aicostguard.com';

  // Collect user details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Your name:',
      validate: (input: string) =>
        input.trim().length >= 2 || 'Please enter at least 2 characters',
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: (input: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || 'Please enter a valid email address',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password (min 8 characters):',
      mask: '*',
      validate: (input: string) =>
        input.length >= 8 || 'Password must be at least 8 characters',
    },
  ]);

  const spinner = ora('Creating your account...').start();

  try {
    const result = await apiRequest<SignupResponse>({
      path: '/auth/signup',
      method: 'POST',
      baseUrl,
      body: {
        name: answers.name.trim(),
        email: answers.email.toLowerCase().trim(),
        password: answers.password,
      },
    });

    if (!result.accessToken) {
      spinner.fail('Signup failed — unexpected response from server');
      return;
    }

    spinner.succeed(
      chalk.green(`Account created! Welcome, ${chalk.bold(result.user.name || result.user.email)}! 🎉`),
    );

    // Save login info immediately
    updateConfig({
      token: result.accessToken,
      email: result.user.email,
      baseUrl,
    });

    // Try to load their projects (brand new account likely has none)
    const projectSpinner = ora('Loading your projects...').start();

    try {
      const projects = await apiRequestAuth<ProjectListItem[]>(
        '/projects',
        result.accessToken,
        baseUrl,
      );

      projectSpinner.stop();

      if (projects && projects.length > 0) {
        console.log(chalk.bold('\n📋 Your Projects:\n'));

        const projectChoices = projects.map((p) => ({
          name: `${p.name}  ${chalk.gray('(' + p.id.substring(0, 8) + '...)')}`,
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

        console.log(chalk.green(`\n✅ Connected to project: ${chalk.bold(selectedProject.name)}`));
        if (projectApiKey) {
          console.log(chalk.gray(`   API Key: ${projectApiKey.substring(0, 12)}...`));
        }
        console.log(chalk.cyan('\n💡 Run `ai-cost-cli analyze` to see your AI cost report!\n'));
      } else {
        // Brand new account — no projects yet
        console.log(chalk.bold.green('\n✅ Account created and you are logged in!\n'));
        console.log(chalk.white('Now you need to create a project to start tracking AI costs.'));
        console.log(chalk.gray('A project holds your API key and usage data.\n'));

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
          console.log(chalk.gray('Or create one on the dashboard:'));
          console.log(chalk.cyan('  https://aicostguard.com/dashboard/projects\n'));
        }
      }
    } catch {
      projectSpinner.stop();
      // Account was created fine — just couldn't list projects
      console.log(chalk.bold.green('\n✅ Account created successfully!\n'));
      console.log(chalk.gray('Run the following to create your first project:'));
      console.log(chalk.cyan('  ai-cost-cli projects create\n'));
    }
  } catch (err: any) {
    spinner.fail(`Could not create account: ${err.message}`);
    console.log();

    const msg = (err.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('exists') || msg.includes('taken') || msg.includes('conflict')) {
      console.log(chalk.yellow('💡 Looks like that email already has an account! Try logging in:'));
      console.log(chalk.white('   ai-cost-cli login\n'));
      console.log(chalk.gray('   Forgot your password?'));
      console.log(chalk.cyan('   https://aicostguard.com/forgot-password\n'));
    } else if (msg.includes('connection') || msg.includes('econnrefused') || msg.includes('network')) {
      console.log(chalk.gray('Having trouble connecting? Try signing up on the website instead:'));
      console.log(chalk.cyan.bold('   https://aicostguard.com/signup\n'));
    } else {
      console.log(chalk.gray('Having trouble? Sign up directly on the website:'));
      console.log(chalk.cyan.bold('   https://aicostguard.com/signup\n'));
    }
  }
}
