# CodeScene VSCode extension Automated System Test

This repository hosts [ExTester](https://github.com/redhat-developer/vscode-extension-tester) setup you can use to UI-test Visual Studio Code CodeScene extensions. It wires TypeScript-based Mocha tests into the `extest` CLI so you can rapidly validate extension flows in a headless or GUI run.

## Requirements

- Node.js 20+ (matches current VS Code support policy)
- VS Code installed locally (for authoring) — ExTester downloads its own test instance automatically

## Getting Started

```powershell
cd g:/work/Customers/CodeScene/cs-ast
npm install
npm run test
```

The first test run downloads a dedicated copy of VS Code, ChromeDriver, and spins up the sample smoke test in `src/tests/sample.test.ts`.

## Manual Environment Setup (No Tests)
Update **local.json** with the CodeScene authentication token

```
{
    "codescene.id": "codescene.codescene-vscode",
    "codescene.version": "0.21.0",
    "codescene.authToken": "xxx"
}
```

Need the cache staged but do not want to launch tests yet? Run these commands in PowerShell:

```powershell
npm install
node .\scripts\prepare-settings-with-token.js
node .\scripts\install-codescene-extension.js
npx extest setup-tests --storage .vscode-test --extensions_dir .vscode-test/extensions --type stable --code_version latest
npm run prepare:vscode
npm run build
```

After this sequence, `.vscode-test/` contains the downloaded VS Code + ChromeDriver pair, your VSIX payload is staged, the tokenized settings file exists, and the TypeScript sources are compiled. Whenever you are ready to execute the suite, re-export the token if you start a new shell and run `npm test`.

When a token is updated in **local.json**, rerun:
- npm run prepare:token
- npm run build

## NPM Scripts

- `npm run build` – compiles TypeScript sources into `out/`
- `npm run test` – builds then runs the UI suite against the latest stable VS Code
	- If `extester.local-vsix.json` exists, this command installs the listed VSIX files into the test instance before starting ExTester (handled via `scripts/apply-vsix-config.js`).
	- Both `test` and `test:insiders` force VS Code to keep extensions under `.vscode-test/extensions`, so nothing leaks into your day-to-day VS Code profile.
- `npm run test:insiders` – identical to `test` but requests the newest available VS Code build (via `--code_version max`)
- `npm run test:seq` – runs all compiled tests sequentially (each file executed in its own ExTester invocation)
- `npm run clean` – deletes compiled output plus the cached VS Code profile under `.vscode-test`
- `npm run prepare:vscode` – copies a locally installed VS Code build (if configured) into `.vscode-test` so ExTester can reuse it without downloading
- `npm run stage:vsix` – installs every VSIX listed in `extester.local-vsix.json` into `.vscode-test/extensions` without launching tests; run this whenever you want the ExTester Runner to pick up a freshly built extension

### Running tests from the terminal (single file or all)

- All tests (stable):
	```powershell
	npm run test
	```
- All tests sequentially (stable):
	```powershell
	npm run test:seq
	```
- Single test file (stable):
	```powershell
	npm run test -- ./out/tests/workbench.test.js
	```
- All tests (Insiders build of VS Code):
	```powershell
	npm run test:insiders
	```
- Single test file (Insiders build):
	```powershell
	npm run test:insiders -- ./out/tests/workbench.test.js
	```

Notes:
- The wrapper `scripts/run-extest.js` accepts a test file or glob; if none is provided it defaults to `./out/tests/**/*.test.js`.
- Tests are run from the compiled output under `out/`, so ensure `npm run build` (already part of the scripts) has produced the matching `.js` files.

### Generating HTML reports

- Configure mochawesome (already set in `mocharc.json`) to emit JSON artifacts without timestamps so filenames are predictable.
- After running tests (including `npm run test:seq`), merge JSONs and build a consolidated HTML report:

	```powershell
	npm run report:merge
	```

- Output lives in `reports/mochawesome/` (JSON inputs + `report.html`). Delete that folder if you want a clean slate before another run.

## Window Size Configuration

- Adjust `extester.window.json` to control the width/height (and optional screen position) of the VS Code instance that ExTester launches.
- The helper in `src/utils/windowSizing.ts` loads this file before every suite and applies it through Selenium so all tests share the same viewport.
- The VS Code profile applied on startup comes from `extester.settings.json`. It forces `window.newWindowDimensions` to `default` (instead of the ExTester default `maximized`) so the scripted resize actually takes effect. Feel free to tweak other editor settings there.
- When you change either config, run `npm run clean` once to purge `.vscode-test/` so the cached workspace picks up the new values on the next test run.

Example:

```json
{
	"width": 1680,
	"height": 950,
	"x": 20,
	"y": 20
}
```

## Reusing Local VS Code & ChromeDriver

- `extester.local-vscode.json` pins a locally installed VS Code folder (for example `C:/Users/<you>/AppData/Local/Programs/Microsoft VS Code`). The helper copies it into `.vscode-test/VSCode-*/` before every run so ExTester skips network downloads. If your source already lives inside `.vscode-test/VSCode-*`, the script simply reuses it without touching files.
- `extester.local-chromedriver.json` works the same for ChromeDriver. Point it at a directory (or a single binary) that contains `chromedriver(.exe)` and note the corresponding version (for example `142.0.7444.175`). Keeping this copy outside `.vscode-test/` means it survives `npm run clean`, but if your driver already lives inside `.vscode-test/chromedriver-*` the script detects that and simply writes the `driverVersion` marker without touching the files.
- If either config file is missing or invalid, the prepare step simply logs a warning and falls back to ExTester’s normal download flow.
- Run `npm run clean` whenever you change these configs; the next `npm run test` restages both VS Code and ChromeDriver automatically.

## Installing Custom VSIX Builds

- Create `extester.local-vsix.json` with a `vsix` array containing absolute or workspace-relative paths to the VSIX files you want pre-installed:
	```json
	{
		"vsix": [
			"./dist/my-extension-0.5.0.vsix",
			"C:/artifacts/companion-helper.vsix"
		]
	}
	```
- `npm run test` calls `scripts/apply-vsix-config.js`, which reads this config and runs `npx extest install-vsix --storage .vscode-test --extensions_dir .vscode-test/extensions --vsix_file <path>` for each entry. If the file is missing, the script logs a warning and continues without failing the entire run.
- Run `npm run stage:vsix` to apply the same VSIX staging without starting a test run. This keeps the cached `.vscode-test` profile aligned before you trigger ExTester Runner from VS Code.
- Add the VSIX files themselves to `.gitignore` (already covered) and keep the JSON updated per environment.

## Running Tests from ExTester Runner

Prefer launching UI tests from inside VS Code? Install the [ExTester Runner](https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner) extension and follow this workflow:

- Keep `npm run build` (or `npm run build -- --watch`) running so compiled files in `out/` stay in sync before you hit the run buttons in the UI.
- Run `npm run prepare:vscode` anytime you update the local VS Code or ChromeDriver artifacts, `npm run stage:vsix` after producing a new VSIX, and `npm run prepare:token` whenever you change `local.json`. The runner only invokes `extest setup-and-run`, so it does not restage these assets for you.
- Quick refresher on those helper scripts:
	- `npm run prepare:vscode` → stages your configured local VS Code build plus ChromeDriver copies into `.vscode-test/` so ExTester skips re-downloading them.
	- `npm run stage:vsix` → installs every VSIX path listed in `extester.local-vsix.json` into `.vscode-test/extensions` without launching tests.
	- `npm run prepare:token` → merges `extester.settings.json` with `local.json` and writes `.vscode-test/settings.with-token.json`, ensuring `codescene.authToken` is available to ExTester Runner.
	- `npm run build` → compiles the TypeScript sources into `out/`, ensuring ExTester Runner sees fresh JavaScript.
- The workspace already contains `.vscode/settings.json` entries that point the runner at the same cache/storage folders used by `npm run test`:

```jsonc
{
	"extesterRunner.testFileGlob": "src/tests/**/*.test.ts",
	"extesterRunner.outputFolder": "out/tests",
	"extesterRunner.rootFolder": "src/tests",
	"extesterRunner.tempFolder": ".vscode-test",
	"extesterRunner.visualStudioCode.Version": "1.107.0",
	"extesterRunner.visualStudioCode.Type": "stable",
	"extesterRunner.additionalArgs": [
		"--extensions_dir .vscode-test/extensions",
		"--code_settings ./.vscode-test/settings.with-token.json"
	]
}
```

With these settings active, ExTester Runner reuses the staged VS Code build, the shared ChromeDriver, your custom VS Code settings, and the staged VSIX payload, so it no longer downloads anything when you press Run.

## Debugging Individual UI Tests

- Open the TypeScript test you want to investigate and launch the `Debug Current UI Test File` configuration from the Run and Debug view.
- The debugger runs the `prep-ui-tests` task first (`npm run prepare:vscode` ➝ `npm run stage:vsix` ➝ `npm run prepare:token` ➝ `npm run build`) so cached assets, VSIX installs, tokenized settings, and compiled output stay aligned.
- That task is defined in `.vscode/tasks.json` and sequences:
	- `npm: prepare:vscode` → stages VS Code + ChromeDriver if `extester.local-*` configs are present.
	- `npm: stage:vsix` → installs VSIX files from `extester.local-vsix.json` into `.vscode-test/extensions`.
	- `npm: prepare:token` → writes `.vscode-test/settings.with-token.json` so the CodeScene auth token is present.
	- `npm: build` → compiles TypeScript to `out/` (wired to the `$tsc` problem matcher for quick diagnostics).
- `scripts/debug-test-file.js` maps the active `.test.ts` file to `out/`, stages VS Code/ChromeDriver plus VSIX entries, and calls the ExTester API (`setupAndRunTests`) to run only that file, so breakpoints hit exactly once per run.
- You can also execute the helper manually for ad-hoc runs:

```powershell
node ./scripts/debug-test-file.js src/tests/sample.test.ts
```

- Use `describe.only`/`it.only` to narrow the scope further while staying inside the debugger session.

## Project Layout

```
src/
	tests/
		sample.test.ts   # Minimal smoke test using Workbench page objects
tsconfig.json        # TypeScript build configuration
package.json         # Script + dependency wiring for extest
```

## Next Steps

1. Seed `.vscode-test` with any workspace files (e.g., copy your extension project into `.vscode-test/workspace`) or install it via additional `extest` CLI flags such as `--extensions_dir`.
2. Expand `src/tests` with page-object driven suites that automate your extension UI.
3. Consider installing the [ExTester Runner](https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner) extension for an interactive test dashboard inside VS Code.