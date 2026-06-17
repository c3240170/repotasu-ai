import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.log('');
    console.log('【結果】.env ファイルがありません。');
    console.log('');
    console.log('【次にやること】');
    console.log('  1. ターミナルでプロジェクトのフォルダに移動する');
    console.log('  2. 次を実行する:  npm run env:bootstrap');
    console.log('');
    process.exit(1);
  }
  const text = fs.readFileSync(envPath, 'utf-8');
  const map = new Map();
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    map.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  return map;
}

function ok(val, { notPlaceholder } = {}) {
  if (!val || !String(val).trim()) return false;
  const v = String(val).trim();
  if (notPlaceholder) {
    if (v === 'sk_test_...' || v === 'whsec_...' || v === 'price_...' || v === 'sk-...') return false;
    if (v.includes('...') && (v.startsWith('sk_') || v.startsWith('whsec_') || v.startsWith('price_'))) {
      return false;
    }
  }
  return true;
}

function mask(v) {
  const s = String(v).trim();
  if (!s) return '（まだ書いていない）';
  if (s.length <= 14) return `${s.slice(0, 3)}…`;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function row(label, val, opts) {
  const good = ok(val, opts);
  console.log(`  ${good ? '✅' : '❌'} ${label}`);
  console.log(`      いまの値: ${mask(val ?? '')}`);
  return good;
}

const env = loadEnvFile();

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  レポたすAI  設定チェック');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('【A】文章生成（OpenAI または Gemini）');
const openaiOk = row('OPENAI_API_KEY', env.get('OPENAI_API_KEY'), { notPlaceholder: true });
const geminiRaw = String(env.get('GEMINI_API_KEY') || '').trim();
const geminiOk =
  geminiRaw.length > 20 && (geminiRaw.startsWith('AIza') || geminiRaw.startsWith('AQ.'));
console.log(`  ${geminiOk ? '✅' : '❌'} GEMINI_API_KEY`);
console.log(`      いまの値: ${geminiOk ? `${geminiRaw.slice(0, 8)}…` : '（まだ書いていない）'}`);
const aiOk = openaiOk || geminiOk;
if (aiOk) {
  console.log(`  ✅ 文章生成OK（${geminiOk && !openaiOk ? 'Gemini' : openaiOk && !geminiOk ? 'OpenAI' : '両方あり → AI_PROVIDER で指定推奨'}）`);
} else {
  console.log('  ❌ GEMINI_API_KEY または OPENAI_API_KEY のどちらかが必要です。');
}
console.log('');
console.log('【B】このPCで動かすときの基本設定');
row('PORT', env.get('PORT'));
row('BASE_URL', env.get('BASE_URL'));
row('SESSION_SECRET', env.get('SESSION_SECRET'));
console.log('  （任意・本番）NODE_ENV=production / DATA_DIR=データ保存先 / TRUST_PROXY=1 / COOKIE_SECURE=true');
console.log('');
console.log('【C】Google ログイン（任意）');
const googleIdOk = row('GOOGLE_CLIENT_ID', env.get('GOOGLE_CLIENT_ID'));
const googleSecretOk = row('GOOGLE_CLIENT_SECRET', env.get('GOOGLE_CLIENT_SECRET'));
if (googleIdOk && googleSecretOk) {
  console.log('  ✅ Googleログインが有効になります。');
} else if (googleIdOk || googleSecretOk) {
  console.log('  ⚠️ GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET の両方が必要です。');
} else {
  console.log('  （未設定）メール・パスワードのみで動作します。');
}
console.log('');
console.log('【E】一般公開用（法的ページ・お問い合わせ）');
const legalNameOk = row('LEGAL_OPERATOR_NAME', env.get('LEGAL_OPERATOR_NAME'));
const legalAddrOk = row('LEGAL_ADDRESS', env.get('LEGAL_ADDRESS'));
const supportOk = row('SUPPORT_EMAIL', env.get('SUPPORT_EMAIL'));
const legalPriceOk = row('LEGAL_PRO_PRICE', env.get('LEGAL_PRO_PRICE'));
row('LEGAL_UPDATED', env.get('LEGAL_UPDATED'));
if (legalNameOk && supportOk && legalPriceOk) {
  console.log('  ✅ 法的ページに実名が入ります。');
  if (!legalAddrOk) {
    console.log('  （LEGAL_ADDRESS が空欄のため、所在地は「請求があった場合、遅滞なく開示」と表示されます）');
  }
  console.log('  → 確認: npm run dev 後 http://localhost:5173/tokusho.html');
} else {
  console.log('  ⚠️ 未設定のままだと法的ページに【要記入】が表示されます。');
  console.log('  → .env を開き LEGAL_OPERATOR_NAME / SUPPORT_EMAIL / LEGAL_PRO_PRICE を埋める');
}
console.log('');
console.log('【D】Stripe（課金を試すときだけ必要）');
const skOk = row('STRIPE_SECRET_KEY', env.get('STRIPE_SECRET_KEY'), { notPlaceholder: true });
const priceOk = row('STRIPE_PRICE_ID', env.get('STRIPE_PRICE_ID'), { notPlaceholder: true });
const whOk = row('STRIPE_WEBHOOK_SECRET', env.get('STRIPE_WEBHOOK_SECRET'), { notPlaceholder: true });

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('【結果の読み方】');
console.log('');

if (!aiOk) {
  console.log('  文章生成がまだです。');
  console.log('  → Gemini 無料: https://aistudio.google.com/apikey でキー取得 → GEMINI_API_KEY= と AI_PROVIDER=gemini');
  console.log('  → または OpenAI: OPENAI_API_KEY= を設定。');
  console.log('');
}

if (!skOk || !priceOk) {
  console.log('  Stripeの「鍵」か「月額の価格ID」が足りません。');
  console.log('  → Stripeのサイトで「シークレットキー sk_test_...」をコピーして STRIPE_SECRET_KEY= に貼る。');
  console.log('  → 商品の「価格ID price_...」をコピーして STRIPE_PRICE_ID= に貼る。');
  console.log('');
}

if (!whOk && skOk && priceOk) {
  console.log('  あと一歩: Webhook用の秘密の文字列だけです。');
  console.log('');
  console.log('  【やること（この順）】');
  console.log('    1. 新しいターミナルを開く（今のはそのまま）');
  console.log('    2. プロジェクトのフォルダで次を実行:  npm run stripe:listen');
  console.log('    3. 画面に出てくる whsec_ で始まる長い文字をまるごとコピーする');
  console.log('    4. .env に  STRIPE_WEBHOOK_SECRET=（貼り付け）  と書いて保存');
  console.log('    5. npm run dev を一度止めて、もう一度 npm run dev');
  console.log('');
  console.log('  ※ Stripe CLI が入っていないとき: https://stripe.com/docs/stripe-cli');
  console.log('');
}

if (aiOk && skOk && priceOk && whOk) {
  console.log('  よさそうです。次は次の2つを「同時に」動かしてください。');
  console.log('    ・ターミナル1: npm run dev');
  console.log('    ・ターミナル2: npm run stripe:listen');
  console.log('');
} else {
  console.log('  .env を直したあと、もう一度:  npm run env:check');
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
