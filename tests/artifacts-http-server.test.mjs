import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverScript = join(repositoryRoot, 'scripts', 'artifacts_http_server.py');
const deployScript = join(repositoryRoot, 'artifacts-deploy');
const packageScript = join(repositoryRoot, 'artifacts-package');

async function writeFixture(root, relativePath, content) {
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function runPythonSnippet(code, args = [], env = {}) {
  const child = spawn('python3', ['-c', code, ...args], {
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolvePromise, reject) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.once('exit', (code) => resolvePromise({ code, stdout, stderr }));
    child.once('error', reject);
  });
}

test('serves built artifacts at deployment URLs with security headers and blocks traversal', { timeout: 12_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'artifacts-http-server-'));
  const catalog = {
    items: [
      {
        id: 'vite-app',
        deploy: {
          includePath: 'vite-app/dist',
          targetPath: 'vite-app',
        },
      },
    ],
  };

  await writeFixture(root, 'app-hub-v11/artifacts.source.json', JSON.stringify(catalog));
  await writeFixture(root, 'vite-app/index.html', '<p>SOURCE INDEX</p><script type="module" src="/src/main.ts"></script>');
  await writeFixture(root, 'vite-app/src/main.ts', 'throw new Error("source TypeScript must not be served")');
  await writeFixture(root, 'vite-app/dist/index.html', '<p>BUILT INDEX</p><script type="module" src="./assets/app.js"></script>');
  await writeFixture(root, 'vite-app/dist/assets/app.js', 'globalThis.__builtArtifactLoaded = true;');
  await writeFixture(root, 'plain.txt', 'unmapped');

  try {
    const result = await runPythonSnippet(`
import importlib.util
import json
import pathlib
import sys

module_path = pathlib.Path(${JSON.stringify(serverScript)}).resolve()
spec = importlib.util.spec_from_file_location('artifacts_http_server', module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

root = pathlib.Path(sys.argv[1]).resolve()
mounts = module.load_deploy_mounts(root, pathlib.Path('app-hub-v11/artifacts.source.json'))

resolved_index = module.map_request_parts(('vite-app', 'index.html'), mounts)
resolved_asset = module.map_request_parts(('vite-app', 'assets', 'app.js'), mounts)
resolved_dist = module.map_request_parts(('vite-app', 'dist', 'index.html'), mounts)
traversal = module.resolve_request_parts('/vite-app/%2e%2e/plain.txt', mounts)

handler = module.ArtifactRequestHandler.__new__(module.ArtifactRequestHandler)
handler.directory = str(root)
handler.deploy_mounts = tuple(mounts)

payload = {
    'resolved_index': resolved_index,
    'resolved_asset': resolved_asset,
    'resolved_dist': resolved_dist,
    'traversal': traversal,
    'guess_js': handler.guess_type('/tmp/app.js'),
    'guess_map': handler.guess_type('/tmp/app.js.map'),
    'security_headers': dict(handler.security_headers()),
}
print(json.dumps(payload))
`, [root]);

    assert.equal(result.code, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(payload.resolved_index, ['vite-app', 'dist', 'index.html']);
    assert.deepEqual(payload.resolved_asset, ['vite-app', 'dist', 'assets', 'app.js']);
    assert.deepEqual(payload.resolved_dist, ['vite-app', 'dist', 'index.html']);
    assert.equal(payload.traversal, null);
    assert.equal(payload.guess_js, 'text/javascript');
    assert.equal(payload.guess_map, 'application/json');
    assert.equal(payload.security_headers['Cache-Control'], 'no-store, max-age=0');
    assert.equal(payload.security_headers['X-Content-Type-Options'], 'nosniff');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('refuses a second server on an occupied port with a useful error', { timeout: 12_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'artifacts-http-server-port-'));
  await writeFixture(root, 'app-hub-v11/artifacts.source.json', JSON.stringify({ items: [] }));

  try {
    const result = await runPythonSnippet(`
import importlib.util
import pathlib
import sys

module_path = pathlib.Path(${JSON.stringify(serverScript)}).resolve()
spec = importlib.util.spec_from_file_location('artifacts_http_server', module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

class FailingServer:
    def __init__(self, *args, **kwargs):
        raise OSError(98, 'Address already in use')

module.ThreadingHTTPServer = FailingServer
sys.argv = [
    'artifacts_http_server.py',
    '--directory',
    sys.argv[1],
    '--bind',
    '127.0.0.1',
    '8080',
]
raise SystemExit(module.main())
`, [root]);

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Port 8080 unavailable|Address already in use/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('artifacts-deploy --full --dry-run does not invoke remote transfer commands', { timeout: 12_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'artifacts-deploy-dry-run-'));
  const stubBin = join(root, 'bin');
  const logFile = join(root, 'network.log');
  const packageOutput = join(root, 'artifacts-collection-2026.07.23.tar.gz');
  await mkdir(stubBin, { recursive: true });

  await writeFixture(root, 'artifacts-package', `#!/usr/bin/env bash
set -euo pipefail
printf 'Package: %s\\n' '${packageOutput}'
printf 'fake package' > '${packageOutput}'
`);
  await writeFixture(root, 'app-hub-v11/artifacts.source.json', JSON.stringify({ items: [] }));
  await writeFixture(join(root, 'bin'), 'ssh', `#!/usr/bin/env bash
echo ssh >> '${logFile}'
exit 99
`);
  await writeFixture(join(root, 'bin'), 'scp', `#!/usr/bin/env bash
echo scp >> '${logFile}'
exit 99
`);
  await writeFixture(join(root, 'bin'), 'rsync', `#!/usr/bin/env bash
echo rsync >> '${logFile}'
exit 99
`);
  await writeFixture(join(root, 'bin'), 'node', `#!/usr/bin/env bash
set -euo pipefail
out=''
while [[ $# -gt 0 ]]; do
  if [[ "$1" == '--out' ]]; then
    out="$2"
    shift 2
  else
    shift
  fi
done
mkdir -p "$out"
printf 'artifact build\\n' > "$out/index.html"
`);
  await writeFixture(join(root, 'bin'), 'tar', `#!/usr/bin/env bash
exec /usr/bin/tar "$@"
`);
  for (const command of ['ssh', 'scp', 'rsync', 'node', 'tar']) {
    await chmod(join(stubBin, command), 0o755);
  }
  await chmod(join(root, 'artifacts-package'), 0o755);

  const child = spawn('bash', [packageScript], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      ARTIFACTS_DIR: root,
      PATH: `${stubBin}:${process.env.PATH}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const result = await new Promise((resolvePromise, reject) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.once('exit', (code) => resolvePromise({ code, stdout, stderr }));
    child.once('error', reject);
  });

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Package complete!/);

  const fullDryRun = spawn('bash', [deployScript, '--full', '--dry-run'], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      ARTIFACTS_DIR: root,
      PATH: `${stubBin}:${process.env.PATH}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const deployResult = await new Promise((resolvePromise, reject) => {
    let stdout = '';
    let stderr = '';
    fullDryRun.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    fullDryRun.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    fullDryRun.once('exit', (code) => resolvePromise({ code, stdout, stderr }));
    fullDryRun.once('error', reject);
  });

  assert.equal(deployResult.code, 0, deployResult.stderr);
  assert.match(deployResult.stdout, /would upload/i);
  assert.equal(await readLogIfPresent(logFile), '');
});

test('artifacts-package produces a stable archive when SOURCE_DATE_EPOCH is set', { timeout: 12_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'artifacts-package-repro-'));
  const stubBin = join(root, 'bin');
  const outputOne = join(root, 'out-one');
  const outputTwo = join(root, 'out-two');
  await mkdir(stubBin, { recursive: true });
  await mkdir(outputOne, { recursive: true });
  await mkdir(outputTwo, { recursive: true });

  await writeFixture(join(root, 'bin'), 'node', `#!/usr/bin/env bash
set -euo pipefail
out=''
while [[ $# -gt 0 ]]; do
  if [[ "$1" == '--out' ]]; then
    out="$2"
    shift 2
  else
    shift
  fi
done
mkdir -p "$out/assets"
printf 'artifact build\\n' > "$out/index.html"
printf 'console.log(1);\\n' > "$out/assets/app.js"
`);
  await chmod(join(stubBin, 'node'), 0o755);

  const first = await runPackage(root, outputOne, stubBin);
  const second = await runPackage(root, outputTwo, stubBin);

  assert.equal(first.code, 0, first.stderr);
  assert.equal(second.code, 0, second.stderr);
  assert.equal(first.hash, second.hash);
});

async function runPackage(root, outputDir, stubBin) {
  const child = spawn('bash', [packageScript, outputDir], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      ARTIFACTS_DIR: root,
      PATH: `${stubBin}:${process.env.PATH}`,
      SOURCE_DATE_EPOCH: '1784764800',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const result = await new Promise((resolvePromise, reject) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.once('exit', (code) => resolvePromise({ code, stdout, stderr }));
    child.once('error', reject);
  });

  const hashLine = (await readTextIfPresent(join(outputDir, 'artifacts-collection-2026.07.23.tar.gz.sha256'))).trim();
  return {
    ...result,
    hash: hashLine.split(/\s+/)[0] || '',
  };
}

async function readLogIfPresent(path) {
  try {
    return await readTextIfPresent(path);
  } catch {
    return '';
  }
}

async function readTextIfPresent(path) {
  const { readFile } = await import('node:fs/promises');
  return readFile(path, 'utf8');
}

async function chmod(path, mode) {
  const { chmod } = await import('node:fs/promises');
  return chmod(path, mode);
}
