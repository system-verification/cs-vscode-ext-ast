#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'extester.local-vscode.json';
const DRIVER_CONFIG_FILE = 'extester.local-chromedriver.json';
const STORAGE_DIR = '.vscode-test';
const DRIVER_VERSION_FILE = 'driverVersion';

const log = (message) => console.log(`[stage-local-vscode] ${message}`);
const warn = (message) => console.warn(`[stage-local-vscode] ${message}`);

function resolvePlatformFolder() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    if (arch !== 'x64' && arch !== 'arm64') {
      warn(`Unsupported Windows architecture '${arch}', skipping local VS Code staging.`);
      return undefined;
    }
    return `VSCode-${platform}-${arch}-archive`;
  }

  if (platform === 'darwin') {
    return 'Visual Studio Code.app';
  }

  if (platform === 'linux') {
    const suffix = arch === 'ia32' ? 'ia32' : arch;
    return `VSCode-linux-${suffix}`;
  }

  warn(`Unsupported platform '${platform}', skipping local VS Code staging.`);
  return undefined;
}

function readVersion(root) {
  try {
    const product = JSON.parse(
      fs.readFileSync(path.join(root, 'resources', 'app', 'product.json'), 'utf8')
    );
    return product.version;
  } catch {
    return undefined;
  }
}

function resolveDriverFolder() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    // Chrome publishes a single win64 build for both x64 and arm64.
    return 'chromedriver-win64';
  }

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'chromedriver-mac-arm64' : 'chromedriver-mac-x64';
  }

  if (platform === 'linux') {
    if (arch === 'x64') {
      return 'chromedriver-linux64';
    }
    if (arch === 'arm64') {
      return 'chromedriver-linux-arm64';
    }
    if (arch === 'arm') {
      return 'chromedriver-linux-arm32';
    }
  }

  warn(`Unsupported platform/architecture combination '${platform}-${arch}', skipping ChromeDriver staging.`);
  return undefined;
}

function stageLocalVSCode() {
  const configPath = path.resolve(CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    log('No extester.local-vscode.json found, skipping local VS Code staging.');
    return;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    warn(`Unable to parse ${CONFIG_FILE}: ${error}`);
    return;
  }

  const source = config.path ? path.resolve(config.path) : undefined;
  if (!source || !fs.existsSync(source)) {
    warn(`Configured VS Code path '${config?.path ?? ''}' is missing. Skipping local staging.`);
    return;
  }

  const sourceVersion = readVersion(source);
  if (!sourceVersion) {
    warn(`Unable to determine VS Code version at ${source}. Skipping local staging.`);
    return;
  }

  if (config.version && config.version !== sourceVersion) {
    warn(
      `Configured version ${config.version} does not match detected version ${sourceVersion}. Proceeding anyway.`
    );
  }

  const platformFolder = resolvePlatformFolder();
  if (!platformFolder) {
    return;
  }

  const storageRoot = path.resolve(STORAGE_DIR);
  const target = path.join(storageRoot, platformFolder);
  const resolvedTarget = path.resolve(target);
  const resolvedSource = path.resolve(source);

  if (resolvedSource === resolvedTarget) {
    log(`VS Code already staged at ${target}.`);
    return;
  }

  const stagedVersion = readVersion(target);
  if (stagedVersion === sourceVersion) {
    log(`VS Code ${sourceVersion} already staged in ${target}.`);
    return;
  }

  if (fs.existsSync(target)) {
    log(`Removing previously staged VS Code at ${target}.`);
    fs.rmSync(target, { recursive: true, force: true });
  }

  fs.mkdirSync(storageRoot, { recursive: true });
  log(`Copying VS Code ${sourceVersion} from ${source} to ${target}...`);
  fs.cpSync(source, target, { recursive: true });
  log('Local VS Code staging complete.');
}

function stageLocalChromeDriver() {
  const configPath = path.resolve(DRIVER_CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    log('No extester.local-chromedriver.json found, skipping ChromeDriver staging.');
    return;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    warn(`Unable to parse ${DRIVER_CONFIG_FILE}: ${error}`);
    return;
  }

  const source = config.path ? path.resolve(config.path) : undefined;
  if (!source || !fs.existsSync(source)) {
    warn(`Configured ChromeDriver path '${config?.path ?? ''}' is missing. Skipping staging.`);
    return;
  }

  const stats = fs.statSync(source);
  const driverExecutable = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
  let driverSourceDir = source;
  let driverBinaryPath = source;

  if (stats.isDirectory()) {
    driverBinaryPath = path.join(source, driverExecutable);
    if (!fs.existsSync(driverBinaryPath)) {
      warn(`Could not find ${driverExecutable} inside ${source}. Skipping staging.`);
      return;
    }
  } else if (stats.isFile()) {
    driverSourceDir = undefined;
    driverBinaryPath = source;
  } else {
    warn(`ChromeDriver path ${source} is neither a file nor a directory. Skipping staging.`);
    return;
  }

  if (!config.version) {
    warn('ChromeDriver config missing "version". ExTester may re-download if versions mismatch.');
  }

  const folderName = resolveDriverFolder();
  if (!folderName) {
    return;
  }

  const storageRoot = path.resolve(STORAGE_DIR);
  const target = path.join(storageRoot, folderName);
  const resolvedTarget = path.resolve(target);
  const resolvedSourceDir = driverSourceDir ? path.resolve(driverSourceDir) : undefined;
  const resolvedBinaryPath = path.resolve(driverBinaryPath);
  const binaryTargetPath = path.join(resolvedTarget, driverExecutable);

  if (resolvedSourceDir && resolvedSourceDir === resolvedTarget) {
    log(`ChromeDriver already staged at ${target}.`);
    if (config.version) {
      fs.writeFileSync(path.join(storageRoot, DRIVER_VERSION_FILE), `${config.version}`);
    }
    return;
  }

  if (!resolvedSourceDir && resolvedBinaryPath === binaryTargetPath) {
    log(`ChromeDriver binary already present at ${binaryTargetPath}.`);
    if (config.version) {
      fs.writeFileSync(path.join(storageRoot, DRIVER_VERSION_FILE), `${config.version}`);
    }
    return;
  }

  if (fs.existsSync(target)) {
    log(`Removing previously staged ChromeDriver at ${target}.`);
    fs.rmSync(target, { recursive: true, force: true });
  }

  fs.mkdirSync(target, { recursive: true });

  if (driverSourceDir) {
    log(`Copying ChromeDriver directory from ${driverSourceDir} to ${target}...`);
    fs.cpSync(driverSourceDir, target, { recursive: true });
  } else {
    const destination = path.join(target, driverExecutable);
    log(`Copying ChromeDriver binary from ${driverBinaryPath} to ${destination}...`);
    fs.copyFileSync(driverBinaryPath, destination);
    fs.chmodSync(destination, 0o755);
  }

  if (config.version) {
    fs.writeFileSync(path.join(storageRoot, DRIVER_VERSION_FILE), `${config.version}`);
  }

  log(`ChromeDriver staging complete${config.version ? ` (version ${config.version})` : ''}.`);
}

stageLocalVSCode();
stageLocalChromeDriver();
