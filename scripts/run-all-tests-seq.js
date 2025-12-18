#!/usr/bin/env node
// Finds all built test files under out/tests and runs them sequentially via `npm run test -- <file>`.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const testsRoot = path.join(root, 'out', 'tests');

function collectTests(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(full);
    }
  }
  return files;
}

if (!fs.existsSync(testsRoot)) {
  console.error(`No compiled tests found: ${testsRoot} does not exist. Run \"npm run build\" first.`);
  process.exit(1);
}

const tests = collectTests(testsRoot).sort();
if (tests.length === 0) {
  console.error('No .test.js files found under out/tests. Build first.');
  process.exit(1);
}

console.log(`Discovered ${tests.length} test file(s). Running sequentially...`);

for (const testFile of tests) {
  console.log(`\n=== Running ${path.relative(root, testFile)} ===`);
  const result = spawnSync('npm', ['run', 'test', '--', testFile], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) {
    console.error(`Test run failed for ${testFile} (exit ${result.status}). Aborting remaining tests.`);
    process.exit(result.status || 1);
  }
}

console.log('\nAll tests completed successfully.');
