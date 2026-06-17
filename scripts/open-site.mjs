import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

let base = 'http://127.0.0.1:5173';
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, 'utf-8');
  const m = text.match(/^BASE_URL=(.+)$/m);
  if (m) base = m[1].trim();
}

const url = base.replace(/\/$/, '');
const cmd =
  process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

exec(cmd, { shell: true }, (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log(`ブラウザで開きます: ${url}`);
});
