import fs from 'fs/promises';

export async function loadConfig(configPath) {
  const data = await fs.readFile(configPath, 'utf8');
  return JSON.parse(data);
}

export async function backupConfig(configPath) {
  const backupPath = `${configPath}.bak`;

  try {
    await fs.copyFile(configPath, backupPath);
  } catch {}

  return backupPath;
}

export async function saveWhitelist(configPath, models) {
  const config = await loadConfig(configPath);

  config.provider ??= {};
  config.provider.nvidia ??= {};

  // Preserve every existing NVIDIA setting.
  config.provider.nvidia.whitelist = models;

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}
