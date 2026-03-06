import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { getConfig } from '../config';
import { apiRequest } from '../api';

interface OptimizeOptions {
  days: string;
}

interface ModelPricing {
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export async function optimizeCommand(options: OptimizeOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Optimization Recommendations\n'));

  const config = getConfig();
  if (!config) {
    console.log(chalk.red('❌ Not connected. Run `ai-cost-cli connect` first.'));
    return;
  }

  const spinner = ora('Generating optimization recommendations...').start();

  try {
    const models = await apiRequest<ModelPricing[]>({ path: '/pricing/models' });
    spinner.succeed('Recommendations ready!\n');

    // Build optimization recommendations based on model pricing
    const optimizations: Array<{
      current: string;
      recommended: string;
      currentCost: number;
      newCost: number;
      saving: string;
      reason: string;
    }> = [];

    // Group models by provider
    const byProvider: Record<string, ModelPricing[]> = {};
    for (const m of models) {
      if (!byProvider[m.provider]) byProvider[m.provider] = [];
      byProvider[m.provider].push(m);
    }

    // Find cheaper alternatives
    for (const [provider, providerModels] of Object.entries(byProvider)) {
      const sorted = providerModels.sort(
        (a, b) => Number(a.inputPricePerMillion) - Number(b.inputPricePerMillion),
      );

      for (let i = 1; i < sorted.length; i++) {
        const expensive = sorted[i];
        const cheaper = sorted[0];
        const inputSaving =
          ((Number(expensive.inputPricePerMillion) - Number(cheaper.inputPricePerMillion)) /
            Number(expensive.inputPricePerMillion)) *
          100;

        if (inputSaving > 30) {
          optimizations.push({
            current: `${provider}/${expensive.model}`,
            recommended: `${provider}/${cheaper.model}`,
            currentCost: Number(expensive.inputPricePerMillion),
            newCost: Number(cheaper.inputPricePerMillion),
            saving: `${inputSaving.toFixed(0)}%`,
            reason: 'Lower cost per token for routine tasks',
          });
        }
      }
    }

    // Display recommendations
    console.log(chalk.bold('🔄 MODEL SWITCH RECOMMENDATIONS\n'));

    if (optimizations.length === 0) {
      console.log(chalk.gray('  No model switch recommendations available.\n'));
    } else {
      const table = new Table({
        head: [
          chalk.white('Current'),
          chalk.white('→'),
          chalk.white('Recommended'),
          chalk.white('Savings'),
        ],
        colWidths: [28, 3, 28, 12],
        style: { head: [], border: ['gray'] },
      });

      for (const opt of optimizations.slice(0, 8)) {
        table.push([
          chalk.red(opt.current),
          chalk.green('→'),
          chalk.green(opt.recommended),
          chalk.bold.green(opt.saving),
        ]);
      }

      console.log(table.toString());
    }

    // General optimization strategies
    console.log(chalk.bold.green('\n📋 OPTIMIZATION STRATEGIES\n'));

    const strategies = [
      {
        type: 'PROMPT COMPRESSION',
        icon: '📝',
        desc: 'Remove filler words, redundant instructions, and verbose examples from prompts',
        impact: 'Reduce token usage by 30-60%',
      },
      {
        type: 'RESPONSE CACHING',
        icon: '💾',
        desc: 'Cache identical or similar prompt responses to avoid duplicate API calls',
        impact: 'Reduce costs by 20-50% for repeated queries',
      },
      {
        type: 'MODEL ROUTING',
        icon: '🔀',
        desc: 'Route simple tasks to cheaper models (GPT-4o-mini, Claude Haiku) automatically',
        impact: 'Save 70-90% on routine classification/extraction tasks',
      },
      {
        type: 'BATCH PROCESSING',
        icon: '📦',
        desc: 'Group multiple small requests into a single prompt with structured output',
        impact: 'Reduce overhead tokens by 40-60%',
      },
      {
        type: 'TOKEN BUDGETING',
        icon: '💰',
        desc: 'Set max_tokens limits and use stop sequences to prevent runaway responses',
        impact: 'Prevent 10-30% wasted output tokens',
      },
    ];

    for (const s of strategies) {
      console.log(chalk.cyan(`  ${s.icon} ${chalk.bold(s.type)}`));
      console.log(chalk.gray(`     ${s.desc}`));
      console.log(chalk.yellow(`     Impact: ${s.impact}\n`));
    }

    // SaaS upsell
    console.log(chalk.bold.yellow('━'.repeat(60)));
    console.log(chalk.bold.yellow('\n🚀 Want automatic optimization applied to your project?'));
    console.log(chalk.yellow('   AI Cost Guard applies these optimizations automatically:'));
    console.log(chalk.cyan('   https://aicostguard.com\n'));
    console.log(chalk.bold.yellow('━'.repeat(60)));
  } catch (err: any) {
    spinner.fail(`Failed to generate recommendations: ${err.message}`);
  }
}
