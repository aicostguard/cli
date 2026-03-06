import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { getConfig } from '../config';
import { apiRequest, apiRequestAuth } from '../api';

interface AnalyzeOptions {
  days: string;
  model?: string;
  provider?: string;
}

export async function analyzeCommand(options: AnalyzeOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Cost Analysis\n'));

  const config = getConfig();
  if (!config) {
    console.log(chalk.red('❌ Not connected. Run `ai-cost-cli login` or `ai-cost-cli connect` first.'));
    return;
  }

  const days = parseInt(options.days) || 30;
  const spinner = ora(`Analyzing last ${days} days of AI costs...`).start();

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    // If user is logged in with JWT and has a project selected, fetch real analytics
    if (config.token && config.projectId) {
      await showRealAnalytics(config as typeof config & { token: string; projectId: string }, days, startDate, endDate, options, spinner);
      return;
    }

    // Fallback to pricing-only analysis
    await showPricingAnalysis(config, days, startDate, endDate, options, spinner);
  } catch (err: any) {
    spinner.fail(`Analysis failed: ${err.message}`);
  }
}

async function showRealAnalytics(
  config: { token: string; projectId: string; baseUrl: string; [key: string]: any },
  days: number,
  startDate: string,
  endDate: string,
  options: AnalyzeOptions,
  spinner: ReturnType<typeof ora>,
) {
  try {
    // Fetch dashboard overview from the real analytics API
    const overview = await apiRequestAuth<any>(
      `/analytics/${config.projectId}/overview?startDate=${startDate}&endDate=${endDate}`,
      config.token,
      config.baseUrl,
    );

    // Fetch latency analytics
    let latencyData: any = null;
    try {
      latencyData = await apiRequestAuth<any>(
        `/analytics/${config.projectId}/latency?startDate=${startDate}&endDate=${endDate}`,
        config.token,
        config.baseUrl,
      );
    } catch { /* latency endpoint may not exist yet */ }

    spinner.succeed('Analysis complete!');

    // Header
    console.log(chalk.bold(`\n📊 AI COST REPORT — Real Data`));
    console.log(chalk.gray(`   Project: ${config.projectName || config.projectId}`));
    console.log(chalk.gray(`   Period:  ${startDate} → ${endDate} (${days} days)\n`));

    // Overview numbers
    const totalCost = Number(overview.totalCost || 0);
    const totalEvents = Number(overview.totalEvents || 0);
    const avgCostPerEvent = totalEvents > 0 ? totalCost / totalEvents : 0;

    const summaryTable = new Table({
      style: { head: [], border: ['gray'] },
    });

    summaryTable.push(
      [chalk.white('Total Cost'), chalk.bold.green(`$${totalCost.toFixed(4)}`)],
      [chalk.white('Total Events'), chalk.bold.cyan(totalEvents.toLocaleString())],
      [chalk.white('Avg Cost/Event'), chalk.yellow(`$${avgCostPerEvent.toFixed(6)}`)],
      [chalk.white('Total Input Tokens'), chalk.gray(Number(overview.totalInputTokens || 0).toLocaleString())],
      [chalk.white('Total Output Tokens'), chalk.gray(Number(overview.totalOutputTokens || 0).toLocaleString())],
    );

    console.log(summaryTable.toString());

    // Cost by model
    if (overview.costByModel && overview.costByModel.length > 0) {
      console.log(chalk.bold(`\n💰 COST BY MODEL\n`));

      const modelTable = new Table({
        head: [
          chalk.white('Provider'),
          chalk.white('Model'),
          chalk.white('Events'),
          chalk.white('Cost'),
          chalk.white('% of Total'),
        ],
        colWidths: [14, 28, 12, 14, 14],
        style: { head: [], border: ['gray'] },
      });

      let models = overview.costByModel;
      if (options.provider) {
        models = models.filter((m: any) =>
          m.provider?.toLowerCase().includes(options.provider!.toLowerCase()),
        );
      }
      if (options.model) {
        models = models.filter((m: any) =>
          m.model?.toLowerCase().includes(options.model!.toLowerCase()),
        );
      }

      for (const m of models) {
        const cost = Number(m.totalCost || m._sum?.cost || 0);
        const events = Number(m.eventCount || m._count || 0);
        const pct = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : '0.0';
        modelTable.push([
          chalk.cyan(m.provider || '-'),
          m.model || '-',
          events.toLocaleString(),
          chalk.yellow(`$${cost.toFixed(4)}`),
          `${pct}%`,
        ]);
      }

      console.log(modelTable.toString());
    }

    // Cost over time
    if (overview.costOverTime && overview.costOverTime.length > 0) {
      console.log(chalk.bold(`\n📈 DAILY COST TREND\n`));

      const trendTable = new Table({
        head: [chalk.white('Date'), chalk.white('Events'), chalk.white('Cost')],
        colWidths: [14, 12, 14],
        style: { head: [], border: ['gray'] },
      });

      // Show last 10 entries to keep it readable
      const recent = overview.costOverTime.slice(-10);
      for (const day of recent) {
        trendTable.push([
          day.date || '-',
          Number(day.events || 0).toLocaleString(),
          chalk.yellow(`$${Number(day.cost || 0).toFixed(4)}`),
        ]);
      }

      console.log(trendTable.toString());
    }

    // Latency analytics
    if (latencyData) {
      console.log(chalk.bold(`\n⚡ LATENCY PERCENTILES\n`));
      const latTable = new Table({
        style: { head: [], border: ['gray'] },
      });
      latTable.push(
        [chalk.white('P50'), chalk.cyan(`${Number(latencyData.overall?.p50 || 0).toFixed(0)} ms`)],
        [chalk.white('P95'), chalk.yellow(`${Number(latencyData.overall?.p95 || 0).toFixed(0)} ms`)],
        [chalk.white('P99'), chalk.red(`${Number(latencyData.overall?.p99 || 0).toFixed(0)} ms`)],
      );
      console.log(latTable.toString());
    }

    // Optimization tips
    printOptimizationTips();
  } catch (err: any) {
    spinner.warn(`Could not fetch real analytics: ${err.message}`);
    spinner.start('Falling back to pricing analysis...');
    await showPricingAnalysis(
      config as any,
      days,
      startDate,
      endDate,
      options,
      spinner,
    );
  }
}

async function showPricingAnalysis(
  config: { baseUrl: string; apiKey?: string; [key: string]: any },
  days: number,
  startDate: string,
  endDate: string,
  options: AnalyzeOptions,
  spinner: ReturnType<typeof ora>,
) {
  const models = await apiRequest<any[]>({ path: '/pricing/models' });

  spinner.succeed('Analysis complete!');

  console.log(chalk.bold(`\n📊 AI MODEL PRICING REFERENCE`));
  console.log(chalk.gray(`   Period: Last ${days} days`));
  console.log(chalk.gray(`   Date: ${startDate} → ${endDate}`));
  console.log(chalk.gray(`   💡 Login with \`ai-cost-cli login\` for real usage data\n`));

  const table = new Table({
    head: [
      chalk.white('Provider'),
      chalk.white('Model'),
      chalk.white('Input $/1M tokens'),
      chalk.white('Output $/1M tokens'),
    ],
    colWidths: [15, 30, 20, 20],
    style: { head: [], border: ['gray'] },
  });

  let filteredModels = models || [];
  if (options.provider) {
    filteredModels = filteredModels.filter((m: any) =>
      m.provider.toLowerCase().includes(options.provider!.toLowerCase()),
    );
  }
  if (options.model) {
    filteredModels = filteredModels.filter((m: any) =>
      m.model.toLowerCase().includes(options.model!.toLowerCase()),
    );
  }

  const grouped: Record<string, any[]> = {};
  for (const m of filteredModels) {
    if (!grouped[m.provider]) grouped[m.provider] = [];
    grouped[m.provider].push(m);
  }

  for (const [provider, providerModels] of Object.entries(grouped)) {
    for (const m of providerModels) {
      table.push([
        chalk.cyan(provider),
        m.model,
        chalk.yellow(`$${Number(m.inputPricePerMillion || 0).toFixed(2)}`),
        chalk.yellow(`$${Number(m.outputPricePerMillion || 0).toFixed(2)}`),
      ]);
    }
  }

  console.log(table.toString());
  printOptimizationTips();
}

function printOptimizationTips() {
  console.log(chalk.bold.green('\n💡 OPTIMIZATION TIPS\n'));

  const tips = [
    {
      title: 'Switch expensive models for simple tasks',
      desc: 'GPT-4 → GPT-4o-mini saves ~90% on routine tasks',
      saving: 'Up to 90%',
    },
    {
      title: 'Enable prompt caching',
      desc: 'Repeated system prompts can be cached to save tokens',
      saving: 'Up to 50%',
    },
    {
      title: 'Compress verbose prompts',
      desc: 'Remove redundant instructions and examples',
      saving: 'Up to 60%',
    },
    {
      title: 'Batch similar requests',
      desc: 'Group related queries to share context',
      saving: 'Up to 30%',
    },
  ];

  for (const tip of tips) {
    console.log(chalk.green(`  ✅ ${tip.title}`));
    console.log(chalk.gray(`     ${tip.desc}`));
    console.log(chalk.yellow(`     Potential saving: ${tip.saving}\n`));
  }

  console.log(chalk.bold.yellow('━'.repeat(60)));
  console.log(chalk.bold.yellow('\n🚀 Want real-time monitoring, alerts & auto-optimization?'));
  console.log(chalk.yellow('   Connect your project to AI Cost Guard:'));
  console.log(chalk.cyan('   https://aicostguard.com\n'));
  console.log(chalk.bold.yellow('━'.repeat(60)));
}
