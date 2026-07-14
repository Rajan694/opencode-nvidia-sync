import 'dotenv/config';

import readline from 'readline';
import { resolve } from 'path';
import { getModels } from './nvidia.js';
import { isCacheFresh, loadCache, saveCache } from './cache.js';
import { testModels } from './tester.js';
import { backupConfig, saveWhitelist } from './config.js';

const CONFIG = process.env.OPENCODE_CONFIG;
const CACHE_PATH = resolve(process.cwd(), '.cache.json');
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const parsedTopModels = Number(process.env.TOP_MODELS || 15);
const TOP_MODELS = Number.isFinite(parsedTopModels) && parsedTopModels > 0 ? Math.floor(parsedTopModels) : 15;
const DRY_RUN = process.argv.includes('--dry-run');

function renderProgress(completed, total, currentModel = '') {
  const width = 28;
  const ratio = total === 0 ? 1 : completed / total;
  const filled = Math.round(width * ratio);
  const empty = Math.max(0, width - filled);
  const bar = `${'#'.repeat(filled)}${'-'.repeat(empty)}`;
  const percent = Math.round(ratio * 100);
  const suffix = currentModel ? ` | ${currentModel}` : '';
  const line = `[${bar}] ${String(completed).padStart(String(total).length, ' ')} / ${total} ${percent}%${suffix}`;

  if (process.stdout.isTTY) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(line);
    if (completed === total) {
      process.stdout.write('\n');
    }
    return;
  }

  console.log(line);
}

async function main() {
  if (!CONFIG) {
    throw new Error('OPENCODE_CONFIG is required.');
  }

  console.log('Fetching NVIDIA models...\n');

  const models = await getModels();

  console.log(`Found ${models.length} models\n`);

  const cache = await loadCache(CACHE_PATH);
  const modelSet = new Set(models);
  const cachedModels = isCacheFresh(cache, CACHE_TTL_MS) ? cache.working.filter((model) => modelSet.has(model)) : [];

  let whitelist = cachedModels.slice(0, TOP_MODELS);

  if (whitelist.length > 0) {
    console.log(`Using cached results from ${cache.lastRun}\n`);
    console.log(`Keeping ${whitelist.length} cached fastest models:\n`);

    whitelist.forEach((model) => console.log(`✅ ${model}`));
  } else {
    console.log('Testing...\n');

    let completed = 0;

    renderProgress(0, models.length);

    const results = await testModels(models, (result) => {
      completed += 1;
      const currentModel = result.ok ? `OK ${result.model}` : `FAIL ${result.model}`;
      renderProgress(completed, models.length, currentModel);
    });

    const working = results.filter((r) => r.ok).sort((a, b) => a.latency - b.latency);
    const failed = results.filter((r) => !r.ok);

    whitelist = working.slice(0, TOP_MODELS).map((m) => m.model);

    working.slice(0, TOP_MODELS).forEach((m) => {
      console.log(`✅ ${m.model.padEnd(45)} ${m.latency}ms`);
    });

    if (working.length > TOP_MODELS) {
      console.log(`\nSkipped ${working.length - TOP_MODELS} slower working models`);
    }

    failed.forEach((m) => console.log(`❌ ${m.model.padEnd(45)} ${m.error || ''}`));

    console.log('\n');

    console.log(`Working : ${working.length}`);
    console.log(`Failed  : ${failed.length}`);

    await saveCache(CACHE_PATH, whitelist);
  }

  if (DRY_RUN) {
    console.log('\nDry run: OpenCode config was not modified.');
    return;
  }

  await backupConfig(CONFIG);

  await saveWhitelist(CONFIG, whitelist);

  console.log('\nWhitelist updated successfully.');
}

main().catch((err) => {
  console.error(err);
});
