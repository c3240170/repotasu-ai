/**
 * 開発サーバーを起動し、立ち上がったら既定ブラウザでトップを開く。
 * Windows で localhost が開けない場合に 127.0.0.1 を使う。
 * 終了: このターミナルで Ctrl+C
 */
import { spawn, exec } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readPort() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return 5173;
  const text = fs.readFileSync(envPath, 'utf-8');
  const m = text.match(/^PORT=(\d+)\s*$/m);
  return m ? Number(m[1]) : 5173;
}

const port = readPort();
const url = `http://127.0.0.1:${port}`;

function waitForServer(timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(`${url}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`サーバーが ${timeoutMs}ms 以内に応答しませんでした (${url})`));
          return;
        }
        setTimeout(ping, 250);
      });
    }
    ping();
  });
}

function openBrowser() {
  return new Promise((res, rej) => {
    const cmd =
      process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(cmd, { shell: true }, (err) => (err ? rej(err) : res()));
  });
}

const child = spawn('node', ['server.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

function shutdown() {
  try {
    child.kill('SIGINT');
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

waitForServer()
  .then(() => openBrowser())
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`ブラウザを開きました: ${url}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err.message || err);
    try {
      child.kill('SIGINT');
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
