#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE_SETTINGS_PATH = path.resolve('extester.settings.json');
const LOCAL_CONFIG_PATH = path.resolve('local.json');
const OUTPUT_PATH = path.resolve('.vscode-test/settings.with-token.json');

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[prepare-settings-with-token] Missing ${label} at ${filePath}`);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[prepare-settings-with-token] Unable to parse ${label}: ${message}`);
  }
}

function getAuthToken(localConfig) {
  const raw = localConfig['codescene.authToken'];
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (!token) {
    throw new Error('[prepare-settings-with-token] local.json must define a non-empty "codescene.authToken"');
  }
  return token;
}

function main() {
  const baseSettings = readJson(BASE_SETTINGS_PATH, 'extester settings');
  const localConfig = readJson(LOCAL_CONFIG_PATH, 'local config');
  const authToken = getAuthToken(localConfig);

  const mergedSettings = {
    ...baseSettings,
    'codescene.authToken': authToken
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mergedSettings, null, 2));
  console.log(`[prepare-settings-with-token] Wrote merged settings to ${OUTPUT_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
