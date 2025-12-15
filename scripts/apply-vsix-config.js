// scripts/apply-vsix-config.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rawArgs = process.argv.slice(2);
const stageOnlyIndex = rawArgs.indexOf('--stage-only');
const stageOnly = stageOnlyIndex !== -1;
if (stageOnly) {
  rawArgs.splice(stageOnlyIndex, 1);
}

const commandArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

if (!stageOnly && commandArgs.length === 0) {
  console.error('[apply-vsix-config] No command provided.');
  process.exit(1);
}

const command = stageOnly ? undefined : commandArgs[0];
const forwardedArgs = stageOnly ? [] : commandArgs.slice(1);

const configPath = './extester.local-vsix.json';
const extensionsDir = path.resolve('.vscode-test/extensions');
fs.mkdirSync(extensionsDir, { recursive: true });
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const vsixEntries = Array.isArray(config.vsix) ? config.vsix : (config.vsix ? [config.vsix] : []);
    for (const entry of vsixEntries) {
      stageVsix(entry);
    }
  } catch (error) {
    console.warn(`[apply-vsix-config] Failed to parse ${configPath}: ${error}`);
  }
}

if (stageOnly) {
  console.log('[apply-vsix-config] VSIX staging complete.');
  process.exit(0);
}

const result = spawnSync(command, forwardedArgs, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);

function stageVsix(vsixPath) {
  const resolvedVsix = path.resolve(vsixPath);
  if (!fs.existsSync(resolvedVsix)) {
    console.warn(`[apply-vsix-config] VSIX not found at ${resolvedVsix}, skipping.`);
    return;
  }

  const installArgs = [
    'extest',
    'install-vsix',
    '--storage',
    '.vscode-test',
    '--extensions_dir',
    extensionsDir,
    '--vsix_file',
    resolvedVsix,
  ];

  const installResult = spawnSync('npx', installArgs, { stdio: 'inherit', shell: true });
  if ((installResult.status ?? 1) !== 0) {
    console.error(`[apply-vsix-config] Failed to install ${resolvedVsix}`);
    process.exit(installResult.status ?? 1);
  }
}