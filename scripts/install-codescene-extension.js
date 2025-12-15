#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.resolve('.vscode-test');
const EXTENSIONS_DIR = path.join(STORAGE_DIR, 'extensions');
const CODESCENE_EXTENSION_ID = process.env.CODESCENE_EXTENSION_ID || 'CodeScene.codescene-vscode';

fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });

if (isExtensionInstalled()) {
  console.log('[install-codescene-extension] CodeScene extension already staged; skipping install.');
  process.exit(0);
}

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

function isExtensionInstalled() {
  if (!fs.existsSync(EXTENSIONS_DIR)) {
    return false;
  }

  const desired = CODESCENE_EXTENSION_ID.toLowerCase();
  const entries = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true });
  return entries.some((entry) => {
    if (!entry.isDirectory()) {
      return false;
    }

    const name = entry.name.toLowerCase();
    return name === desired || name.startsWith(`${desired}-`);
  });
}
