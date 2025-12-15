import { existsSync, readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

export type CodeSceneLocalConfig = Record<string, unknown> & {
  'codescene.id'?: string;
  'codescene.version'?: string;
  'codescene.authToken'?: string;
};

const LOCAL_CONFIG_FILENAME = 'local.json';

/**
 * Loads the local.json file that stores CodeScene-specific configuration for tests.
 */
export function loadLocalConfig(filePath: string = LOCAL_CONFIG_FILENAME): CodeSceneLocalConfig {
  const resolvedPath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Missing required local config file: ${resolvedPath}`);
  }

  try {
    const raw = readFileSync(resolvedPath, 'utf8');
    return JSON.parse(raw) as CodeSceneLocalConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to parse ${resolvedPath}: ${message}`);
  }
}

export function getCodeSceneAuthToken(config: CodeSceneLocalConfig = loadLocalConfig()): string {
  const rawValue = config['codescene.authToken'];
  const token = typeof rawValue === 'string' ? rawValue.trim() : undefined;

  if (!token) {
    throw new Error('local.json must define a non-empty "codescene.authToken" value.');
  }

  return token;
}
