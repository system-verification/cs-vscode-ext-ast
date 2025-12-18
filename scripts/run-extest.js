#!/usr/bin/env node
// Runs extest with optional test file/glob arguments. Defaults to all tests.
const { spawnSync } = require('node:child_process');

const rawArgs = process.argv.slice(2);
const patterns = [];
const extraFlags = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg.startsWith('--')) {
    extraFlags.push(arg);
    const next = rawArgs[i + 1];
    if (next && !next.startsWith('--')) {
      extraFlags.push(next);
      i++;
    }
  } else {
    patterns.push(arg);
  }
}

const testPatterns = patterns.length > 0 ? patterns : ['./out/tests/**/*.test.js'];

const extestArgs = [
  'run-tests',
  ...testPatterns,
  ...extraFlags,
  '--storage', '.vscode-test',
  '--extensions_dir', '.vscode-test/extensions',
  '--code_settings', './.vscode-test/settings.with-token.json',
  '--mocha_config', './mocharc.json'
];

const result = spawnSync('extest', extestArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 0);
