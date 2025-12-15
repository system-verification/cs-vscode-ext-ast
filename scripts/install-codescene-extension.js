#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.resolve('.vscode-test');
const EXTENSIONS_DIR = path.join(STORAGE_DIR, 'extensions');
const CODESCENE_EXTENSION_ID = process.env.CODESCENE_EXTENSION_ID || 'codescene.codescene';

fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });

runExtest(['get-vscode', '--storage', STORAGE_DIR], 'download VS Code');
runExtest(['get-chromedriver', '--storage', STORAGE_DIR], 'download ChromeDriver');
runExtest(
  ['install-from-marketplace', CODESCENE_EXTENSION_ID, '--storage', STORAGE_DIR, '--extensions_dir', EXTENSIONS_DIR],
  `install ${CODESCENE_EXTENSION_ID}`
);

function runExtest(args, label) {
  const result = spawnSync('npx', ['extest', ...args], { stdio: 'inherit', shell: true });
  if ((result.status ?? 1) !== 0) {
    console.error(`[install-codescene-extension] Failed to ${label}.`);
    process.exit(result.status ?? 1);
  }
}
