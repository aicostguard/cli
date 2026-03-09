import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiRequest } from '../api';

interface ModelsOptions {
  provider?: string;
}

export async function modelsCommand(options: ModelsOptions) {
  console.log(chalk.bold.cyan('\n🛡️  AI Cost Guard — Supported Models\n'));

  const spinner = ora('Fetching model pricing...').start();

  try {
    const models = await apiRequest<any[]>({
      path: '/pricing/models',
    });

    spinner.succeed(`Found ${models.length} models\n`);

    let filtered = models;
    if (options.provider) {
      filtered = filtered.filter((m: any) =>
        m.provider.toLowerCase().includes(options.provider!.toLowerCase()),
      );
    }

    // Group by provider
    const byProvider: Record<string, any[]> = {};
    for (const m of filtered) {
      if (!byProvider[m.provider]) byProvider[m.provider] = [];
      byProvider[m.provider].push(m);
    }

    for (const [provider, providerModels] of Object.entries(byProvider)) {
      console.log(chalk.bold.cyan(`  ${provider.toUpperCase()}`));
      console.log(chalk.gray('  ' + '─'.repeat(50)));

      const table = new Table({
        head: [
          chalk.white('Model'),
          chalk.white('Input $/1M'),
          chalk.white('Output $/1M'),
          chalk.white('Cost Tier'),
        ],
        colWidths: [30, 14, 14, 14],
        style: { head: [], border: ['gray'] },
      });

      const sorted = providerModels.sort(
        (a: any, b: any) => Number(a.inputPricePerMillion) - Number(b.inputPricePerMillion),
      );

      for (const m of sorted) {
        const inputPrice = Number(m.inputPricePerMillion || 0);
        const tier =
          inputPrice > 10
            ? chalk.red('$$$$')
            : inputPrice > 3
              ? chalk.yellow('$$$')
              : inputPrice > 0.5
                ? chalk.green('$$')
                : chalk.bold.green('$');

        table.push([
          m.model,
          chalk.yellow(`$${inputPrice.toFixed(2)}`),
          chalk.yellow(`$${Number(m.outputPricePerMillion || 0).toFixed(2)}`),
          tier,
        ]);
      }

      console.log(table.toString());
      console.log();
    }

    console.log(chalk.gray('  Cost Tier: $ = Budget, $$ = Standard, $$$ = Premium, $$$$ = Expensive\n'));
  } catch (err: any) {
    spinner.fail(`Failed to fetch models: ${err.message}`);
    console.log(chalk.gray('\nMake sure the AI Cost Guard server is running.'));
  }
}
