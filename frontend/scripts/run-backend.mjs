#!/usr/bin/env node
// Spawn uvicorn using the backend's venv python.
// Cross-platform: picks Scripts/python.exe on Windows, bin/python elsewhere.
// Falls back to system `uvicorn` (and finally `python -m uvicorn`) if no venv.

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// scripts/ is at frontend/scripts/; repo root is two levels up.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BACKEND = resolve(REPO_ROOT, 'backend');
const IS_WIN = process.platform === 'win32';

const venvPython = IS_WIN
  ? resolve(BACKEND, '.venv/Scripts/python.exe')
  : resolve(BACKEND, '.venv/bin/python');

const args = ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'];

function run(cmd, cmdArgs) {
  console.log(`[run-backend] ${cmd} ${cmdArgs.join(' ')}`);
  const child = spawn(cmd, cmdArgs, { cwd: BACKEND, stdio: 'inherit', shell: false });
  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error('[run-backend] spawn failed:', err.message);
    process.exit(1);
  });
}

if (existsSync(venvPython)) {
  run(venvPython, args);
} else {
  console.warn('[run-backend] backend/.venv not found. Falling back to system python.');
  console.warn('[run-backend] Create venv with: cd ../backend && python -m venv .venv && .\\.venv\\Scripts\\Activate.ps1 && pip install -e ".[dev]"');
  run(IS_WIN ? 'python' : 'python3', args);
}
