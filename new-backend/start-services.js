const { spawn } = require('child_process');
const path = require('path');

const ML_SERVICE_DIR = path.join(__dirname, '..', 'ml-service');
const IS_WIN = process.platform === 'win32';

function start(label, cmd, args, cwd) {
  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (d) => process.stdout.write(`[${label}] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[${label}] ${d}`));
  proc.on('exit', (code) => console.log(`[${label}] exited with code ${code}`));

  return proc;
}

// 1. Memcached (in-process Node mock)
const memcached = start('memcached', 'node', ['start-memcached.js'], __dirname);

// 2. ML Service — activate venv then run uvicorn
const venvPython = IS_WIN
  ? path.join(ML_SERVICE_DIR, 'venv', 'Scripts', 'python.exe')
  : path.join(ML_SERVICE_DIR, 'venv', 'bin', 'python');

const ml = start(
  'ml-service',
  venvPython,
  ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'],
  ML_SERVICE_DIR
);

// 3. Backend (nodemon)
const backend = start(
  'backend',
  IS_WIN ? 'npx.cmd' : 'npx',
  ['nodemon', 'src/server.js'],
  __dirname
);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down all services...');
  [memcached, ml, backend].forEach((p) => p.kill());
  process.exit(0);
});
