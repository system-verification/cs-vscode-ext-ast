#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ExTester, ReleaseQuality } = require('vscode-extension-tester');

async function main() {
  const tsFile = process.argv[2];
  if (!tsFile) {
    console.error('[debug-test-file] Usage: node scripts/debug-test-file.js <path-to-test.ts>');
    process.exit(1);
  }

  const workspaceRoot = process.cwd();
  const resolvedTsPath = path.resolve(tsFile);
  if (!fs.existsSync(resolvedTsPath)) {
    console.error(`[debug-test-file] Test file ${resolvedTsPath} does not exist.`);
    process.exit(1);
  }

  const srcRoot = path.join(workspaceRoot, 'src');
  const relativeFromSrc = path.relative(srcRoot, resolvedTsPath);
  if (relativeFromSrc.startsWith('..')) {
    console.error('[debug-test-file] Expected test files to live under src/.');
    process.exit(1);
  }

  const compiledPath = path.join(workspaceRoot, 'out', relativeFromSrc).replace(/\.ts$/, '.js');
  if (!fs.existsSync(compiledPath)) {
    console.error(`[debug-test-file] Compiled artifact missing at ${compiledPath}. Run npm run build first.`);
    process.exit(1);
  }

  runNodeScript('./scripts/stage-local-vscode.js');
  runNodeScript('./scripts/apply-vsix-config.js', ['--stage-only']);

  const storageDir = path.resolve('.vscode-test');
  const extensionsDir = path.join(storageDir, 'extensions');
  const vscodeVersion = parseEngineVersion();
  const settingsPath = path.resolve('./extester.settings.json');

  const exTester = new ExTester(storageDir, ReleaseQuality.Stable, extensionsDir);
  try {
    const exitCode = await exTester.setupAndRunTests(compiledPath, vscodeVersion, undefined, {
      settings: settingsPath,
      resources: [],
      cleanup: false,
    });
    process.exit(exitCode ?? 0);
  } catch (error) {
    console.error('[debug-test-file] Failed to run the requested test file.', error);
    process.exit(1);
  }
}

function parseEngineVersion() {
  try {
    const pkg = require('../package.json');
    const engine = pkg?.engines?.vscode;
    if (!engine) {
      return undefined;
    }
    const match = engine.match(/\d+\.\d+\.\d+/);
    return match ? match[0] : undefined;
  } catch {
    return undefined;
  }
}

function runNodeScript(script, extraArgs = []) {
  const result = spawnSync('node', [script, ...extraArgs], { stdio: 'inherit', shell: false });
  if ((result.status ?? 1) !== 0) {
    console.error(`[debug-test-file] Script ${script} failed.`);
    process.exit(result.status ?? 1);
  }
}

main();
