import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getConfig, updateConfig } from '../config';
import { apiRequestAuth } from '../api';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  apiKeys: ApiKeyItem[];
  createdAt: string;
  _count?: { usageEvents: number };
}

interface ProjectCreateOptions {
  name?: string;
  desc?: string;
}

function requireAuth(): { token: string; baseUrl: string } | null {
  const config = getConfig();
  if (!config?.token) {
    console.log(chalk.red('\n✗ You are not logged in.\n'));
    console.log(chalk.white('Run one of these first:'));
    console.log(chalk.cyan('  ai-cost-cli signup') + chalk.gray('   — create a free account'));
    console.log(chalk.cyan('  ai-cost-cli login') + chalk.gray('    — log in with your email\n'));
    return null;
  }
  return {
    token: config.token,
    baseUrl: config.baseUrl || 'https://api.aicostguard.com',
  };
}

// ─── project list ─────────────────────────────────────────────────────────────

export async function projectListCommand() {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Your Projects\n'));

  const auth = requireAuth();
  if (!auth) return;

  const spinner = ora('Fetching your projects...').start();

  try {
    const projects = await apiRequestAuth<Project[]>('/projects', auth.token, auth.baseUrl);
    spinner.stop();

    if (!projects || projects.length === 0) {
      console.log(chalk.yellow('You don\'t have any projects yet.\n'));
      console.log(chalk.white('Create your first one:'));
      console.log(chalk.cyan('  ai-cost-cli projects create\n'));
      return;
    }

    const currentConfig = getConfig();
    console.log(chalk.bold(`${projects.length} project${projects.length === 1 ? '' : 's'} found:\n`));

    projects.forEach((project, index) => {
      const isActive = currentConfig?.projectId === project.id;
      const activeKey = project.apiKeys?.find((k) => k.isActive) || project.apiKeys?.[0];
      const keyDisplay = activeKey?.key
        ? chalk.gray(activeKey.key.substring(0, 20) + '...')
        : chalk.red('No API key');
      const events = project._count?.usageEvents ?? 0;
      const label = isActive
        ? chalk.bold.green(`${index + 1}. ${project.name}`) + chalk.green(' ◀ active')
        : chalk.bold.white(`${index + 1}. ${project.name}`);

      console.log(label);
      console.log(chalk.gray('   Project ID: ') + chalk.white(project.id));
      console.log(chalk.gray('   API Key:    ') + keyDisplay);
      if (project.description) {
        console.log(chalk.gray('   Desc:       ') + chalk.white(project.description));
      }
      console.log(chalk.gray('   Events:     ') + chalk.white(`${events.toLocaleString()} tracked`));
      console.log();
    });

    console.log(chalk.gray('Switch active project: ') + chalk.cyan('ai-cost-cli login'));
    console.log(chalk.gray('Create new project:    ') + chalk.cyan('ai-cost-cli projects create\n'));
  } catch (err: any) {
    spinner.fail(`Could not fetch projects: ${err.message}`);
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('401')) {
      console.log(chalk.yellow('\nSession expired — please log in again:'));
      console.log(chalk.cyan('  ai-cost-cli login\n'));
    }
  }
}

// ─── project create ───────────────────────────────────────────────────────────

export async function projectCreateCommand(options: ProjectCreateOptions = {}) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Create New Project\n'));

  const auth = requireAuth();
  if (!auth) return;

  // Prompt for project details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: options.name,
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length < 2) return 'Name must be at least 2 characters';
        if (trimmed.length > 100) return 'Name must be 100 characters or less';
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional — press Enter to skip):',
      default: options.desc || '',
    },
  ]);

  const projectName = answers.name.trim();
  const spinner = ora(`Creating project "${projectName}"...`).start();

  try {
    const body: { name: string; description?: string } = { name: projectName };
    if (answers.description?.trim()) {
      body.description = answers.description.trim();
    }

    const project = await apiRequestAuth<Project>(
      '/projects',
      auth.token,
      auth.baseUrl,
      'POST',
      body,
    );

    spinner.succeed(chalk.green(`Project "${chalk.bold(project.name)}" created! 🎉`));

    const activeKey = project.apiKeys?.find((k) => k.isActive) || project.apiKeys?.[0];
    const apiKey = activeKey?.key;

    console.log(chalk.bold('\n📋 Project Details:\n'));
    console.log(chalk.gray('  Name:       ') + chalk.white(project.name));
    console.log(chalk.gray('  Project ID: ') + chalk.white(project.id));

    if (apiKey) {
      console.log(chalk.gray('  API Key:    ') + chalk.cyan.bold(apiKey));
      console.log(
        chalk.yellow('\n  ⚠️  Copy your API key now — this is the only time it\'s shown in full.\n'),
      );
    }

    // Offer to connect now
    const { setActive } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setActive',
        message: 'Set this as your active project now?',
        default: true,
      },
    ]);

    if (setActive) {
      if (apiKey) {
        updateConfig({
          apiKey,
          projectId: project.id,
          projectName: project.name,
        });
        console.log(chalk.green(`\n✅ Connected to: ${chalk.bold(project.name)}`));
        console.log(chalk.gray(`   API Key: ${apiKey.substring(0, 16)}...`));
        console.log(chalk.cyan('\n💡 Next steps:'));
        console.log(chalk.cyan('   ai-cost-cli analyze   — view your cost report'));
        console.log(chalk.cyan('   ai-cost-cli status    — confirm your connection\n'));
      } else {
        console.log(chalk.yellow('\n⚠️  No API key was returned. Visit your dashboard to get it:'));
        console.log(chalk.cyan('  https://aicostguard.com/dashboard/projects\n'));
      }
    } else {
      console.log(chalk.gray('\nTo connect this project later, run:'));
      if (apiKey) {
        console.log(chalk.cyan(`  ai-cost-cli connect --key ${apiKey}\n`));
      } else {
        console.log(chalk.cyan('  ai-cost-cli login\n'));
      }
    }
  } catch (err: any) {
    spinner.fail(`Could not create project: ${err.message}`);
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('limit') || msg.includes('plan') || msg.includes('upgrade')) {
      console.log(chalk.yellow('\n⚠️  You\'ve reached the project limit for your current plan.'));
      console.log(chalk.white('Upgrade your plan at:'));
      console.log(chalk.cyan('  https://aicostguard.com/dashboard/billing\n'));
    } else if (msg.includes('unauthorized') || msg.includes('401')) {
      console.log(chalk.yellow('\nSession expired — please log in again:'));
      console.log(chalk.cyan('  ai-cost-cli login\n'));
    }
  }
}
