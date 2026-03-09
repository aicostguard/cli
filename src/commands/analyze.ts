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
    // Call all 3 analytics endpoints in parallel — each has different data
    const dateParams = `startDate=${startDate}&endDate=${endDate}`;
    const pid = config.projectId;
    const base = config.baseUrl;
    const tok = config.token;

    const [overview, modelData, timeData] = await Promise.all([
      // /analytics/:id/overview  → {today:{cost,tokens,requests}, week:{...}, month:{...}, total:{events,todayEvents}}
      apiRequestAuth<any>(`/analytics/${pid}/overview`, tok, base),

      // /analytics/:id/cost-by-model?startDate=...&endDate=...
      // → [{provider, model, totalCost, requestCount, inputTokens, outputTokens, avgLatencyMs}]
      apiRequestAuth<any[]>(`/analytics/${pid}/cost-by-model?${dateParams}`, tok, base)
        .catch(() => [] as any[]),

      // /analytics/:id/cost-over-time?startDate=...&endDate=...
      // → [{date, cost, tokens, requests}]
      apiRequestAuth<any[]>(`/analytics/${pid}/cost-over-time?${dateParams}`, tok, base)
        .catch(() => [] as any[]),
    ]);

    spinner.succeed('Analysis complete!');

    // ── Header ──────────────────────────────────────────────────
    console.log(chalk.bold(`\n📊 AI COST REPORT`));
    console.log(chalk.gray(`   Project : ${config.projectName || pid}`));
    console.log(chalk.gray(`   Period  : ${startDate} → ${endDate} (${days} days)\n`));

    // ── Summary table (uses /overview data) ─────────────────────
    const monthCost   = Number(overview?.month?.cost   || 0);
    const weekCost    = Number(overview?.week?.cost    || 0);
    const todayCost   = Number(overview?.today?.cost   || 0);
    const totalEvents = Number(overview?.total?.events || 0);
    const todayEvents = Number(overview?.total?.todayEvents || 0);

    // Use period cost from cost-by-model for the requested window
    const periodCost = (modelData as any[]).reduce(
      (acc: number, m: any) => acc + Number(m.totalCost || 0), 0
    );
    const periodEvents = (modelData as any[]).reduce(
      (acc: number, m: any) => acc + Number(m.requestCount || 0), 0
    );
    const avgCostPerEvent = periodEvents > 0 ? periodCost / periodEvents : 0;

    const totalInputTokens  = (modelData as any[]).reduce((a: number, m: any) => a + Number(m.inputTokens  || 0), 0);
    const totalOutputTokens = (modelData as any[]).reduce((a: number, m: any) => a + Number(m.outputTokens || 0), 0);

    const summaryTable = new Table({ style: { head: [], border: ['gray'] } });
    summaryTable.push(
      [chalk.white(`Cost (last ${days}d)`), chalk.bold.green(`$${periodCost.toFixed(4)}`)],
      [chalk.white('Cost today'),           chalk.green(`$${todayCost.toFixed(4)}`)],
      [chalk.white('Cost this week'),       chalk.yellow(`$${weekCost.toFixed(4)}`)],
      [chalk.white('Cost this month'),      chalk.yellow(`$${monthCost.toFixed(4)}`)],
      [chalk.white(`Requests (${days}d)`),  chalk.bold.cyan(periodEvents.toLocaleString())],
      [chalk.white('Requests today'),       chalk.gray(todayEvents.toLocaleString())],
      [chalk.white('Total all-time'),       chalk.gray(totalEvents.toLocaleString())],
      [chalk.white('Avg cost/request'),     chalk.yellow(`$${avgCostPerEvent.toFixed(6)}`)],
      [chalk.white('Input tokens'),         chalk.gray(totalInputTokens.toLocaleString())],
      [chalk.white('Output tokens'),        chalk.gray(totalOutputTokens.toLocaleString())],
    );
    console.log(summaryTable.toString());

    // ── Cost by model ────────────────────────────────────────────
    let filteredModels = [...(modelData as any[])];
    if (options.provider) {
      filteredModels = filteredModels.filter((m: any) =>
        m.provider?.toLowerCase().includes(options.provider!.toLowerCase()));
    }
    if (options.model) {
      filteredModels = filteredModels.filter((m: any) =>
        m.model?.toLowerCase().includes(options.model!.toLowerCase()));
    }

    if (filteredModels.length > 0) {
      console.log(chalk.bold(`\n💰 COST BY MODEL\n`));
      const modelTable = new Table({
        head: [
          chalk.white('Provider'), chalk.white('Model'),
          chalk.white('Requests'), chalk.white('Cost'), chalk.white('% of Total'),
        ],
        colWidths: [14, 28, 12, 14, 14],
        style: { head: [], border: ['gray'] },
      });

      for (const m of filteredModels) {
        const cost   = Number(m.totalCost   || 0);
        const events = Number(m.requestCount || 0);
        const pct    = periodCost > 0 ? ((cost / periodCost) * 100).toFixed(1) : '0.0';
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

    // ── Daily trend ──────────────────────────────────────────────
    if ((timeData as any[]).length > 0) {
      console.log(chalk.bold(`\n📈 DAILY COST TREND\n`));
      const trendTable = new Table({
        head: [chalk.white('Date'), chalk.white('Requests'), chalk.white('Cost')],
        colWidths: [14, 12, 14],
        style: { head: [], border: ['gray'] },
      });

      const recent = (timeData as any[]).slice(-10);
      for (const day of recent) {
        trendTable.push([
          day.date     || '-',
          Number(day.requests || 0).toLocaleString(),
          chalk.yellow(`$${Number(day.cost || 0).toFixed(4)}`),
        ]);
      }
      console.log(trendTable.toString());
    }

    if (periodEvents === 0) {
      console.log(chalk.yellow('\n⚠️  No usage events found for this period.\n'));
      console.log(chalk.white('This means you haven\'t sent any AI API calls through the SDK yet.'));
      console.log(chalk.gray('\nInstall the SDK in your app to start tracking:'));
      console.log(chalk.cyan('  npm install @ai-cost-guard/sdk'));
      console.log(chalk.cyan('  pip install ai-cost-guard-sdk'));
      console.log(chalk.gray('\nSee quickstart: https://aicostguard.com/docs/quickstart\n'));
    }

    printOptimizationTips();
  } catch (err: any) {
    spinner.warn(`Could not fetch real analytics: ${err.message}`);
    spinner.start('Falling back to pricing reference...');
    await showPricingAnalysis(config as any, days, startDate, endDate, options, spinner);
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
