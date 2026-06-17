import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

const WEAK_SESSION = new Set(['', 'change-this-session-secret', 'dev-only-secret-change-this']);

function isWeakSession(val) {
  const v = String(val ?? '').trim();
  return WEAK_SESSION.has(v) || v.length < 24;
}

/** @returns {{ key: string, value: string }[]} */
function parseLines(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) {
      out.push({ type: 'raw', line });
      continue;
    }
    const eq = line.indexOf('=');
    if (eq === -1) {
      out.push({ type: 'raw', line });
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).replace(/\r$/, '').trim();
    out.push({ type: 'kv', key, value, line });
  }
  return out;
}

function serializeLines(rows) {
  return rows
    .map((r) => {
      if (r.type === 'raw') return r.line;
      if (r.type === 'kv') return `${r.key}=${r.value}`;
      return '';
    })
    .join('\n');
}

function setKey(rows, key, newValue, { replaceIf } = {}) {
  let found = false;
  for (const r of rows) {
    if (r.type === 'kv' && r.key === key) {
      found = true;
      const cur = String(r.value ?? '').trim();
      if (!replaceIf || replaceIf(cur)) {
        r.value = newValue;
      }
      break;
    }
  }
  if (!found) {
    rows.push({ type: 'kv', key, value: newValue, line: `${key}=${newValue}` });
  }
}

if (!fs.existsSync(examplePath)) {
  console.error('.env.example が見つかりません。');
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✅ .env を .env.example から作成しました。');
}

const sessionSecret = crypto.randomBytes(32).toString('hex');
let text = fs.readFileSync(envPath, 'utf-8');
const rows = parseLines(text);

setKey(rows, 'SESSION_SECRET', sessionSecret, { replaceIf: (cur) => isWeakSession(cur) });
setKey(rows, 'PORT', '5173', { replaceIf: (cur) => !String(cur).trim() });
setKey(rows, 'BASE_URL', 'http://localhost:5173', {
  replaceIf: (cur) => !String(cur).trim()
});

const legalKeys = [
  ['LEGAL_OPERATOR_NAME', ''],
  ['LEGAL_ADDRESS', ''],
  ['SUPPORT_EMAIL', ''],
  ['LEGAL_PRO_PRICE', '月額980円（税込）'],
  ['LEGAL_UPDATED', '2026年6月4日']
];
for (const [key, value] of legalKeys) {
  const exists = rows.some((r) => r.type === 'kv' && r.key === key);
  if (!exists) setKey(rows, key, value);
}

text = serializeLines(rows);
if (!text.endsWith('\n')) text += '\n';
fs.writeFileSync(envPath, text, 'utf-8');

console.log('✅ .env を更新しました。');
console.log('   - SESSION_SECRET を強いランダム値にしました（弱い値のときだけ上書き）。');
console.log('   - PORT / BASE_URL が空なら補完しました。');
console.log('   - LEGAL_* / SUPPORT_EMAIL が無ければ空欄で追加しました（公開前に埋めてください）。');
console.log('   OpenAI・Stripe・Gemini のキーは Dashboard から貼り付けてください。');
