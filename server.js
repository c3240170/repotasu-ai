import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const isProduction = process.env.NODE_ENV === 'production';

function envTruthy(key) {
  const v = process.env[key];
  return v === '1' || v === 'true' || v === 'yes';
}

const app = express();

if (envTruthy('TRUST_PROXY')) {
  app.set('trust proxy', 1);
}

const publicDir = path.join(__dirname, 'public');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const storePath = path.join(dataDir, 'store.json');

const apiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = String(process.env.GEMINI_API_KEY || '').trim();
const geminiModel = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const geminiModelHigh = String(process.env.GEMINI_MODEL_HIGH || geminiModel).trim();
const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5173}`;
const sessionSecret = process.env.SESSION_SECRET || 'dev-only-secret-change-this';

function cookieSecureFlag() {
  if (envTruthy('COOKIE_INSECURE')) return false;
  if (envTruthy('COOKIE_SECURE')) return true;
  if (isProduction && /^https:\/\//i.test(String(process.env.BASE_URL || ''))) return true;
  return false;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecureFlag(),
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30
  };
}

function anonCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecureFlag(),
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 400
  };
}

if (isProduction) {
  const weak =
    !process.env.SESSION_SECRET?.trim() ||
    sessionSecret.length < 24 ||
    sessionSecret === 'dev-only-secret-change-this' ||
    sessionSecret === 'change-this-session-secret';
  if (weak) {
    // eslint-disable-next-line no-console
    console.error('[repotasu-ai] FATAL: Set SESSION_SECRET to a long random value (24+ chars) in production.');
    process.exit(1);
  }
  if (!String(apiKey || '').trim() && !geminiApiKey) {
    // eslint-disable-next-line no-console
    console.error('[repotasu-ai] FATAL: Set OPENAI_API_KEY or GEMINI_API_KEY in production.');
    process.exit(1);
  }
  if (!/^https:\/\//i.test(process.env.BASE_URL || '')) {
    // eslint-disable-next-line no-console
    console.warn('[repotasu-ai] WARN: BASE_URL should be https://... in production (Stripe redirects, cookies).');
  }
  if (!cookieSecureFlag()) {
    // eslint-disable-next-line no-console
    console.warn(
      '[repotasu-ai] WARN: Cookies are not Secure. Use https BASE_URL or set COOKIE_SECURE=true when behind HTTPS.'
    );
  }
}
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();
const ADMIN_BASIC_USER = String(process.env.ADMIN_BASIC_USER || '').trim();
const ADMIN_BASIC_PASS = String(process.env.ADMIN_BASIC_PASS || '').trim();
const ADMIN_ALLOWED_IPS = new Set(
  String(process.env.ADMIN_ALLOWED_IPS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
);
const BLOCKED_IPS = new Set(
  String(process.env.BLOCKED_IPS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
);
const ADMIN_LOCK_MAX_ATTEMPTS = Math.max(
  1,
  Math.min(10, Number.parseInt(String(process.env.ADMIN_LOCK_MAX_ATTEMPTS || '10'), 10) || 10)
);
const ADMIN_LOCK_WINDOW_MS = Math.max(
  60 * 1000,
  Number.parseInt(String(process.env.ADMIN_LOCK_WINDOW_MS || String(15 * 60 * 1000)), 10) ||
    15 * 60 * 1000
);
const USER_LOGIN_LOCK_MAX_ATTEMPTS = 10;
const USER_LOGIN_LOCK_MS = 15 * 60 * 1000;
const AUTO_BLOCK_WINDOW_MS = Math.max(
  10 * 60 * 1000,
  Number.parseInt(String(process.env.AUTO_BLOCK_WINDOW_MS || String(24 * 60 * 60 * 1000)), 10) ||
    24 * 60 * 60 * 1000
);

const client = apiKey ? new OpenAI({ apiKey }) : null;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

function resolveAiProvider() {
  const forced = String(process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (forced === 'gemini') return geminiApiKey ? 'gemini' : null;
  if (forced === 'openai') return apiKey ? 'openai' : null;
  if (geminiApiKey && !apiKey) return 'gemini';
  if (apiKey) return 'openai';
  if (geminiApiKey) return 'gemini';
  return null;
}

function textAiReady() {
  return resolveAiProvider() !== null;
}

function textAiMissingMessage() {
  return '文章生成用の API キーが未設定です。.env に GEMINI_API_KEY（Gemini）または OPENAI_API_KEY を設定してください。';
}

/** @param {string} message */
function parseGeminiRetrySeconds(message) {
  const m = String(message || '').match(/retry in ([\d.]+)\s*s/i);
  if (m) return Math.max(1, Math.ceil(Number(m[1])));
  return null;
}

/** @param {unknown} data */
function parseGeminiRetrySecondsFromPayload(data) {
  const msg = data?.error?.message;
  const fromMsg = parseGeminiRetrySeconds(msg);
  if (fromMsg) return fromMsg;
  const details = data?.error?.details;
  if (Array.isArray(details)) {
    for (const d of details) {
      const delay = d?.retryDelay;
      if (typeof delay === 'string') {
        const m = delay.match(/^(\d+(?:\.\d+)?)s$/i);
        if (m) return Math.max(1, Math.ceil(Number(m[1])));
      }
    }
  }
  return null;
}

/** @param {{ status?: number, message?: string, code?: string, details?: unknown }} info */
function isGeminiQuotaOrRateLimit(info) {
  const status = Number(info.status || 0);
  const blob = [info.message, info.code, JSON.stringify(info.details ?? '')].join(' ').toLowerCase();
  if (status === 429) return true;
  return (
    blob.includes('quota exceeded') ||
    blob.includes('rate limit') ||
    blob.includes('resource_exhausted') ||
    blob.includes('generate_content_free_tier_requests')
  );
}

/** @param {string} message */
function looksLikeGeminiQuotaMessage(message) {
  return isGeminiQuotaOrRateLimit({ message });
}

class GeminiApiError extends Error {
  /** @param {string} message @param {{ status?: number, retrySeconds?: number|null, isQuota?: boolean, raw?: unknown }} meta */
  constructor(message, meta = {}) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = meta.status;
    this.retrySeconds = meta.retrySeconds ?? null;
    this.isQuota = Boolean(meta.isQuota);
    this.raw = meta.raw;
  }
}

/** @param {string} model */
function geminiFallbackForModel(model) {
  const m = String(model || '').trim();
  if (m === 'gemini-2.5-flash') return GEMINI_FALLBACK_MODEL;
  return null;
}

/** @param {unknown} err */
function userFacingAiError(err) {
  const retryDefault = 45;
  if (err instanceof GeminiApiError) {
    if (err.isQuota) {
      const sec = err.retrySeconds && err.retrySeconds > 0 ? err.retrySeconds : null;
      if (sec) {
        return {
          error: `無料枠の一時的な上限に達しました。約${sec}秒後にもう一度お試しください。`,
          code: 'AI_RATE_LIMIT',
          retryAfterSeconds: Math.min(60, Math.max(40, sec))
        };
      }
      return {
        error: '現在AIが混み合っています。少し時間を置いてからもう一度お試しください。',
        code: 'AI_RATE_LIMIT',
        retryAfterSeconds: retryDefault
      };
    }
    return {
      error: '生成に失敗しました。テーマを短くするか、しばらくしてからもう一度お試しください。',
      code: null,
      retryAfterSeconds: null
    };
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (looksLikeGeminiQuotaMessage(msg)) {
    // eslint-disable-next-line no-console
    console.error('[repotasu-ai] AI quota/rate error (sanitized for user):', err);
    return {
      error: '現在AIが混み合っています。少し時間を置いてからもう一度お試しください。',
      code: 'AI_RATE_LIMIT',
      retryAfterSeconds: retryDefault
    };
  }
  return { error: msg, code: null, retryAfterSeconds: null };
}

/** @param {import('express').Response} res @param {unknown} err @param {string} logTag */
function respondAiError(res, err, logTag) {
  // eslint-disable-next-line no-console
  console.error(`[repotasu-ai] ${logTag}:`, err);
  const facing = userFacingAiError(err);
  const status = facing.code === 'AI_RATE_LIMIT' ? 503 : 500;
  res.status(status).json(facing);
}

/** @param {{ mime: string, dataUrl: string }[]} images */
async function geminiGenerateTextWithModel(
  model,
  { system, user, images, temperature, jsonMode }
) {
  /** @type {{ text?: string, inline_data?: { mime_type: string, data: string } }[]} */
  const parts = [{ text: user }];
  for (const img of images) {
    const m = img.dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/i);
    if (m) {
      parts.push({
        inline_data: {
          mime_type: m[1].toLowerCase().replace('image/jpg', 'image/jpeg'),
          data: m[2].replace(/\s/g, '')
        }
      });
    }
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {})
      }
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini API error (${res.status})`;
    const apiCode = data?.error?.code || '';
    const isQuota = isGeminiQuotaOrRateLimit({
      status: res.status,
      message: msg,
      code: apiCode,
      details: data?.error?.details
    });
    if (isQuota) {
      throw new GeminiApiError(msg, {
        status: res.status,
        retrySeconds: parseGeminiRetrySecondsFromPayload(data),
        isQuota: true,
        raw: data
      });
    }
    throw new GeminiApiError(msg, { status: res.status, isQuota: false, raw: data });
  }
  if (data?.promptFeedback?.blockReason) {
    throw new Error('Gemini が内容をブロックしました。テーマや参考資料を短くして再試行してください。');
  }
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim() ?? '';
  if (!text) throw new Error('生成に失敗しました（Gemini の応答が空です）。');
  return text;
}

/** @param {{ mime: string, dataUrl: string }[]} images */
async function geminiGenerateText({ system, user, images, temperature, jsonMode, quality }) {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY が未設定です。');
  const primaryModel = quality === 'high' ? geminiModelHigh : geminiModel;
  try {
    return await geminiGenerateTextWithModel(primaryModel, {
      system,
      user,
      images,
      temperature,
      jsonMode
    });
  } catch (err) {
    if (!(err instanceof GeminiApiError) || !err.isQuota) throw err;
    const fallback = geminiFallbackForModel(primaryModel);
    if (!fallback) throw err;
    // eslint-disable-next-line no-console
    console.error(
      `[repotasu-ai] Gemini quota/rate limit on ${primaryModel}; retrying once with ${fallback}`,
      err.raw ?? err.message
    );
    try {
      return await geminiGenerateTextWithModel(fallback, {
        system,
        user,
        images,
        temperature,
        jsonMode
      });
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.error(`[repotasu-ai] Gemini fallback ${fallback} failed:`, fallbackErr);
      throw fallbackErr;
    }
  }
}

/** @param {{ mime: string, dataUrl: string, byteLength: number }[]} images */
async function runTextCompletion({ system, user, images, temperature, quality, useVision, jsonMode }) {
  const provider = resolveAiProvider();
  if (provider === 'gemini') {
    return geminiGenerateText({ system, user, images, temperature, jsonMode, quality });
  }
  if (!client) throw new Error(textAiMissingMessage());

  const model = useVision
    ? quality === 'high'
      ? 'gpt-4o'
      : 'gpt-4o-mini'
    : quality === 'high'
      ? 'gpt-4.1'
      : 'gpt-4.1-mini';

  const userMessage = useVision
    ? {
        role: 'user',
        content: [
          { type: 'text', text: user },
          ...images.map((img) => ({
            type: 'image_url',
            image_url: { url: img.dataUrl, detail: 'high' }
          }))
        ]
      }
    : { role: 'user', content: user };

  const completion = await client.chat.completions.create({
    model,
    temperature,
    ...(jsonMode
      ? { response_format: { type: 'json_object' }, max_tokens: 120 }
      : {}),
    messages: [{ role: 'system', content: system }, userMessage]
  });

  const text = completion.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('生成に失敗しました。');
  return text;
}

if (textAiReady()) {
  const p = resolveAiProvider();
  // eslint-disable-next-line no-console
  console.log(
    `[レポたすAI] 文章生成: ${p === 'gemini' ? `Gemini（${geminiModel}）` : 'OpenAI'}`
  );
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[レポたすAI] 文章生成 未設定: .env に GEMINI_API_KEY または OPENAI_API_KEY を入れて再起動してください。'
  );
}

if (!stripeKey || !stripePriceId) {
  // eslint-disable-next-line no-console
  console.warn(
    '[レポたすAI] Stripe 未設定: .env に STRIPE_SECRET_KEY / STRIPE_PRICE_ID を入れてサーバを再起動してください。'
  );
} else {
  // eslint-disable-next-line no-console
  console.log('[レポたすAI] Stripe 設定を読み込みました（Checkout 利用可）。');
}

const FREE_DAILY_TEXT = 3;
const FREE_DAILY_IMAGE = 1;
const MIN_TARGET_CHARS = 100;
const FREE_MAX_TARGET_CHARS = 4000;
const PRO_MAX_TARGET_CHARS = 10000;
const OWNER_PRO_EMAILS = new Set(
  String(process.env.OWNER_PRO_EMAILS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
);

function isOwnerProUser(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  return Boolean(email) && OWNER_PRO_EMAILS.has(email);
}

function hasProAccess(user) {
  return Boolean(user) && (user.plan === 'pro' || isOwnerProUser(user));
}

function maxTargetCharsForPro(isPro) {
  return isPro ? PRO_MAX_TARGET_CHARS : FREE_MAX_TARGET_CHARS;
}

function resolveTargetChars(raw, isPro) {
  const max = maxTargetCharsForPro(isPro);
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return { ok: true, value: Math.min(800, max), requested: null };
  }
  if (parsed < MIN_TARGET_CHARS) {
    return {
      ok: false,
      value: MIN_TARGET_CHARS,
      requested: parsed,
      min: MIN_TARGET_CHARS,
      code: 'CHAR_BELOW_MIN'
    };
  }
  if (parsed > max) {
    return { ok: false, value: max, requested: parsed, max, code: isPro ? 'CHAR_LIMIT' : 'CHAR_LIMIT_PRO' };
  }
  return { ok: true, value: clampInt(parsed, MIN_TARGET_CHARS, max), requested: parsed };
}
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_REFERENCE_CHARS = 20000;
const COOKIE_NAME = 'repotasu_session';
const ANON_COOKIE = 'repotasu_anon';
const GOOGLE_OAUTH_COOKIE = 'repotasu_oauth';

function googleOAuthEnabled() {
  return Boolean(googleClientId && googleClientSecret);
}

if (googleOAuthEnabled()) {
  // eslint-disable-next-line no-console
  console.log('[レポたすAI] Google OAuth 設定を読み込みました。');
} else if (googleClientId || googleClientSecret) {
  // eslint-disable-next-line no-console
  console.warn(
    '[レポたすAI] Google OAuth 未完了: GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET の両方が必要です。'
  );
}

function googleRedirectUri() {
  return `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;
}

function signOAuthState(payload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyOAuthState(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', sessionSecret).update(b64).digest('base64url');
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
    if (!parsed?.nonce || !parsed?.exp) return null;
    if (Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecureFlag(),
    path: '/',
    maxAge: 1000 * 60 * 10
  };
}

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(storePath)) {
  fs.writeFileSync(
    storePath,
    JSON.stringify({ users: [], sessions: [], usage: {}, stripeMap: {} }, null, 2),
    'utf-8'
  );
}

function readStore() {
  const s = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  if (!s.draftHistoryByUser || typeof s.draftHistoryByUser !== 'object') {
    s.draftHistoryByUser = {};
  }
  return s;
}

function writeStore(next) {
  fs.writeFileSync(storePath, JSON.stringify(next, null, 2), 'utf-8');
}

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

/** @type {Map<string, { start: number, count: number }>} */
const rateBuckets = new Map();
/** @type {Map<string, { count: number, firstAt: number, lockUntil: number }>} */
const adminAuthBuckets = new Map();
/** @type {Map<string, { count: number, firstAt: number, lockUntil: number }>} */
const userLoginBuckets = new Map();
/** @type {Map<string, { reason: string, until: number }>} */
const autoBlockedIps = new Map();

function clientIp(req) {
  const raw = String(req.ip || req.socket?.remoteAddress || 'unknown').trim();
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}

function isBlockedIp(ip) {
  if (BLOCKED_IPS.has(ip)) return true;
  const now = Date.now();
  const dynamic = autoBlockedIps.get(ip);
  if (!dynamic) return false;
  if (now >= dynamic.until) {
    autoBlockedIps.delete(ip);
    return false;
  }
  return true;
}

function blockIpTemporarily(ip, reason, windowMs = AUTO_BLOCK_WINDOW_MS) {
  if (!ip) return;
  autoBlockedIps.set(ip, { reason, until: Date.now() + Math.max(60 * 1000, windowMs) });
}

function isAdminIpAllowed(ip) {
  if (ADMIN_ALLOWED_IPS.size === 0) return true;
  return ADMIN_ALLOWED_IPS.has(ip);
}

function rateLimit(key, { limit = 30, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

function lockBucketNext(bucketMap, key, now, lockWindowMs) {
  let b = bucketMap.get(key);
  if (!b || now - b.firstAt > lockWindowMs) {
    b = { count: 0, firstAt: now, lockUntil: 0 };
    bucketMap.set(key, b);
  }
  return b;
}

function isBucketLocked(bucketMap, key, now) {
  const b = bucketMap.get(key);
  return Boolean(b && b.lockUntil && now < b.lockUntil);
}

function failAndMaybeLock(bucketMap, key, now, maxAttempts, lockWindowMs) {
  const b = lockBucketNext(bucketMap, key, now, lockWindowMs);
  b.count += 1;
  if (b.count >= maxAttempts) {
    b.lockUntil = now + lockWindowMs;
    b.count = 0;
    b.firstAt = now;
    return true;
  }
  return false;
}

function resetBucket(bucketMap, key) {
  bucketMap.delete(key);
}

function clampInt(n, min, max) {
  const x = Number.parseInt(String(n), 10);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/** 本文のみの文字数（空白・改行・Markdown記号を除外） */
function countTextChars(text) {
  return String(text ?? '')
    .replace(/\s/g, '')
    .replace(/[#*_`>\-]/g, '').length;
}

function charCountMinForTarget(targetChars) {
  return Math.max(MIN_TARGET_CHARS, targetChars - 50);
}

function charCountStrictBlock(targetChars) {
  const min = charCountMinForTarget(targetChars);
  return [
    '【文字数厳守ルール】',
    'ユーザーが指定した文字数を絶対に超えないでください。',
    '文字数は、本文のみを対象とし、空白・改行・見出し記号・Markdown記号は含めません。',
    `指定文字数が${targetChars}字の場合、必ず${min}〜${targetChars}字以内に収めてください。`,
    '指定文字数を超えることは禁止です。',
    '内容が長くなりそうな場合は、具体例や説明を減らして短くしてください。',
    '文字数が足りない場合は、同じ内容を繰り返さず、自然な感想・理由・具体例を少し追加してください。',
    '出力は本文のみとし、文字数や差分の説明は本文に含めないでください。'
  ].join('\n');
}

/** カウント基準で targetChars を超えないよう末尾を切り詰め（句点優先） */
function enforceCharLimit(text, targetChars) {
  const raw = String(text ?? '');
  if (countTextChars(raw) <= targetChars) return raw.trim();

  let lo = 0;
  let hi = raw.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (countTextChars(raw.slice(0, mid)) <= targetChars) lo = mid;
    else hi = mid - 1;
  }
  let cut = raw.slice(0, lo).trimEnd();
  const snapAt = Math.max(
    cut.lastIndexOf('。'),
    cut.lastIndexOf('．'),
    cut.lastIndexOf('.'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?'),
    cut.lastIndexOf('！'),
    cut.lastIndexOf('？'),
    cut.lastIndexOf('\n')
  );
  if (snapAt > cut.length * 0.65) {
    const snapped = cut.slice(0, snapAt + 1).trimEnd();
    if (snapped.length > 0 && countTextChars(snapped) <= targetChars) cut = snapped;
  }
  return cut.trim();
}

/**
 * @param {{ system: string, quality: string, targetChars: number, text: string }} p
 * @returns {Promise<{ text: string, adjusted: boolean, method?: string }>}
 */
async function ensureWithinCharLimit({ system, quality, targetChars, text }) {
  let out = String(text ?? '').trim();
  if (countTextChars(out) <= targetChars) {
    return { text: out, adjusted: false };
  }

  const trimUser = [
    charCountStrictBlock(targetChars),
    `指定文字数: ${targetChars}字（厳守・超過禁止）`,
    '以下の下書きは指定文字数を超えています。意味と論点は保ち、具体例や説明を減らして必ず指定文字数以内に短く修正してください。',
    '新しい事実は追加しないでください。出力は本文のみ。',
    '',
    '--- 修正対象の下書き ---',
    out
  ].join('\n');

  try {
    const trimmed = await runTextCompletion({
      system,
      user: trimUser,
      images: [],
      temperature: 0.35,
      quality,
      useVision: false,
      jsonMode: false
    });
    const t = String(trimmed ?? '').trim();
    if (t && countTextChars(t) <= targetChars) {
      return { text: t, adjusted: true, method: 'ai_trim' };
    }
    if (t && countTextChars(t) < countTextChars(out)) out = t;
  } catch {
    /* 切り詰めへフォールバック */
  }

  return { text: enforceCharLimit(out, targetChars), adjusted: true, method: 'truncate' };
}

const MAX_REPORT_IMAGES = 5;
/** 複数枚のときは各画像このサイズまで（デコード後バイト） */
const MAX_REPORT_IMAGE_BYTES_MULTI = 2 * 1024 * 1024;
/** 従来どおり1枚だけのときはやや大きめを許可 */
const MAX_REPORT_IMAGE_BYTES_SINGLE = 4 * 1024 * 1024;
const MAX_REPORT_IMAGES_TOTAL_BYTES = 8 * 1024 * 1024;

/** @returns {{ mime: string, dataUrl: string, byteLength: number } | null} */
function parseReportImageDataUrl(raw, maxBytes = MAX_REPORT_IMAGE_BYTES_MULTI) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  const m = s.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([\s\S]+)$/i);
  if (!m) return null;
  const mime = m[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const b64 = m[2].replace(/\s/g, '');
  let buf;
  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
  if (buf.length < 24 || buf.length > maxBytes) return null;
  return { mime, dataUrl: `data:${mime};base64,${b64}`, byteLength: buf.length };
}

/**
 * @param {unknown} body
 * @returns {{ images: { mime: string, dataUrl: string, byteLength: number }[], error?: string }}
 */
function collectReportImages(body) {
  const arr = body?.reportImageDataUrls;
  if (Array.isArray(arr) && arr.length > 0) {
    const nonEmpty = arr.filter((x) => typeof x === 'string' && x.trim());
    const perCap = nonEmpty.length > 1 ? MAX_REPORT_IMAGE_BYTES_MULTI : MAX_REPORT_IMAGE_BYTES_SINGLE;
    const list = [];
    for (const raw of nonEmpty) {
      if (list.length >= MAX_REPORT_IMAGES) break;
      const p = parseReportImageDataUrl(raw, perCap);
      if (!p) {
        return {
          images: [],
          error:
            perCap === MAX_REPORT_IMAGE_BYTES_MULTI
              ? '資料画像を読み取れませんでした。PNG / JPEG / GIF / WebP、複数枚のときは各2MB以下、最大5枚、合計8MB程度までにしてください。'
              : '資料画像を読み取れませんでした。PNG / JPEG / GIF / WebP、4MB以下にしてください。'
        };
      }
      list.push(p);
    }
    let total = 0;
    for (const im of list) total += im.byteLength;
    if (total > MAX_REPORT_IMAGES_TOTAL_BYTES) {
      return {
        images: [],
        error:
          '資料画像の合計サイズが大きすぎます。枚数を減らすか画像を圧縮してください（合計の目安は8MBまで）。'
      };
    }
    return { images: list };
  }
  const single = body?.reportImageDataUrl;
  if (typeof single === 'string' && single.trim()) {
    const p = parseReportImageDataUrl(single, MAX_REPORT_IMAGE_BYTES_SINGLE);
    if (!p) {
      return {
        images: [],
        error:
          '画像を読み取れませんでした。PNG / JPEG / GIF / WebP のデータURLで、4MB 以下にしてください。'
      };
    }
    return { images: [p] };
  }
  return { images: [] };
}

const TONES = new Set(['formal', 'casual', 'frank', 'confident', 'friendly']);

function toneHint(tone) {
  switch (tone) {
    case 'formal':
      return 'レポートとして礼儀正しくフォーマル。論文のような過度に堅い言い回しやテンプレ接続の連打は避ける。';
    case 'frank':
      return '遠回しを減らし率直に。急所ははっきり述べる。冷たさ・攻撃的さ・雑な断定だけは避ける。';
    case 'confident':
      return '根拠の範囲で堂々とした語り。根拠のない大言壮語や過度な煽りは避ける。';
    case 'friendly':
      return '読み手に配慮した親しみやすい語り。砕けすぎ・友達宛てのチャット調・過度な絵文字風は避ける。';
    case 'casual':
    default:
      return '普通の大学生が書いたような自然な文章。難しすぎる表現・論文調の堅さは避ける。ただしくだけすぎ・話し言葉・チャット調にはしない。礼儀は維持し、テンプレ臭やキラキラした美辞麗句も避ける。';
  }
}

const STUDENT_MODES = new Set(['honors', 'average', 'barely']);
/** 下書き言語（優先: en → vi → ne → hi → zh → ja） */
const OUTPUT_LANGS = new Set(['ja', 'en', 'zh', 'vi', 'ne', 'hi', 'id']);
const OUTPUT_PRESETS = new Set(['default', 'word_heading', 'no_bullets']);
const UI_LOCALES = new Set(['ja', 'en', 'zh', 'vi', 'ne', 'hi', 'id']);

/** @param {unknown} raw */
function normalizeUiLocale(raw) {
  const v = String(raw || '').trim();
  return UI_LOCALES.has(v) ? v : 'ja';
}

const MAX_DRAFT_HISTORY = 30;
const MAX_DRAFT_THEME = 4000;
const MAX_DRAFT_REF = 6000;
const MAX_DRAFT_PREVIEW = 400;
const BLOCKED_FETCH_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'metadata.google.internal']);

function isBlockedFetchHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h || BLOCKED_FETCH_HOSTS.has(h)) return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function parsePublicHttpUrl(raw) {
  let url;
  try {
    url = new URL(String(raw || '').trim());
  } catch {
    return { ok: false, error: 'URLの形式が正しくありません。' };
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'http または https の URL を入力してください。' };
  }
  if (isBlockedFetchHost(url.hostname)) {
    return { ok: false, error: 'この URL は読み込めません。' };
  }
  return { ok: true, url };
}

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function htmlToPlainText(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim())
    : '';
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '\n');
  body = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  body = decodeHtmlEntities(body);
  const text = body
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 18000);
  return { title, text };
}

async function fetchUrlHtml(urlString) {
  const parsed = parsePublicHttpUrl(urlString);
  if (!parsed.ok) return parsed;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let current = parsed.url;
    for (let hop = 0; hop < 5; hop++) {
      const hostCheck = parsePublicHttpUrl(current.href);
      if (!hostCheck.ok) return hostCheck;

      const res = await fetch(current.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; RepotasuAI/0.1; reference-fetch)'
        }
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) return { ok: false, error: 'リダイレクト先を取得できませんでした。' };
        current = new URL(loc, current.href);
        continue;
      }

      if (!res.ok) {
        return { ok: false, error: `ページを取得できませんでした（${res.status}）。` };
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength > 1024 * 1024) {
        return { ok: false, error: 'ページが大きすぎます（1MB超）。' };
      }

      const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
      const { title, text } = htmlToPlainText(html);
      if (text.length < 80) {
        return { ok: false, error: '本文を十分に読み取れませんでした。手動で貼り付けてください。' };
      }
      return { ok: true, url: current.href, title, text };
    }
    return { ok: false, error: 'リダイレクトが多すぎます。' };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: '取得がタイムアウトしました。' };
    }
    return { ok: false, error: 'ページの取得に失敗しました。' };
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeDraftSettings(raw) {
  const toneRaw = String(raw?.tone ?? 'casual').trim();
  const modeRaw = String(raw?.studentMode ?? 'average').trim();
  const outputLangRaw = String(raw?.outputLang ?? 'ja').trim();
  const presetRaw = String(raw?.outputPreset ?? 'default').trim();
  const jaStyle =
    outputLangRaw === 'ja' && String(raw?.japaneseStyle ?? 'desu').trim() === 'dearu' ? 'dearu' : 'desu';
  return {
    theme: String(raw?.theme ?? '').slice(0, MAX_DRAFT_THEME),
    referenceMaterial: String(raw?.referenceMaterial ?? '').slice(0, MAX_DRAFT_REF),
    tone: TONES.has(toneRaw) ? toneRaw : 'casual',
    studentMode: STUDENT_MODES.has(modeRaw) ? modeRaw : 'average',
    targetChars: clampInt(raw?.targetChars ?? 800, MIN_TARGET_CHARS, PRO_MAX_TARGET_CHARS),
    quality: raw?.quality === 'high' ? 'high' : 'normal',
    outputLang: OUTPUT_LANGS.has(outputLangRaw) ? outputLangRaw : 'ja',
    japaneseStyle: jaStyle,
    outputPreset: OUTPUT_PRESETS.has(presetRaw) ? presetRaw : 'default'
  };
}

function normalizeDraftEntry(raw) {
  const settings = sanitizeDraftSettings(raw?.settings || raw);
  return {
    id: String(raw?.id || '').trim() || crypto.randomUUID(),
    savedAt: String(raw?.savedAt || new Date().toISOString()),
    preview: String(raw?.preview ?? '').trim().slice(0, MAX_DRAFT_PREVIEW),
    settings
  };
}

/** @param {unknown} raw @returns {'low'|'medium'|'high'} */
function normalizeTriLevel(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (s === 'low' || s === 'medium' || s === 'high') return s;
  return 'medium';
}

const DRAFT_CHECK_KEYS = ['assignment_fit', 'evidence', 'ai_tone', 'citation'];

/** @returns {{ key: string, status: 'check' }[]} */
function defaultDraftChecklist() {
  return DRAFT_CHECK_KEYS.map((key) => ({ key, status: 'check' }));
}

/** @param {unknown} raw @returns {'ok'|'warn'|'check'} */
function normalizeDraftCheckStatus(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (s === 'ok' || s === 'warn' || s === 'check') return s;
  return 'check';
}

/** @param {unknown} raw @returns {{ key: string, status: 'ok'|'warn'|'check' }[]} */
function normalizeDraftChecklist(raw) {
  const byKey = new Map();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = String(item?.key ?? '').trim();
      if (!DRAFT_CHECK_KEYS.includes(key)) continue;
      byKey.set(key, {
        key,
        status: normalizeDraftCheckStatus(item?.status)
      });
    }
  }
  return DRAFT_CHECK_KEYS.map((key) => byKey.get(key) || { key, status: 'check' });
}

/** @param {string} preset */
function outputFormatPresetBlock(preset) {
  switch (preset) {
    case 'word_heading':
      return [
        '【出力形式: Word向け】見出しは「見出し1/2/3」に相当する階層が分かるように、短い1行の見出し行を置き、その下に本文段落を続ける。',
        'Markdownの # 記法や箇条書き記号に頼らず、プレーンテキストのままWordに貼りやすい形にする。',
        '装飾記号の羅列は避け、大学レポートとして自然な見出し語を使う。'
      ].join('\n');
    case 'no_bullets':
      return [
        '【出力形式: 箇条書き禁止】箇条書き・番号付きリストは使わない。',
        '段落と短い見出しのみで構成する。列挙が必要なら文章に溶かして書く。'
      ].join('\n');
    default:
      return '';
  }
}

function outputLanguageBlock(lang, japaneseStyle) {
  const l = OUTPUT_LANGS.has(lang) ? lang : 'ja';
  const styleDearu = japaneseStyle === 'dearu';
  const lines = [];
  if (l === 'en') {
    lines.push('【出力言語】見出しと本文はすべて英語。本文に日本語を混ぜない。');
  } else if (l === 'vi') {
    lines.push(
      '【出力言語】見出しと本文はすべてベトナム語（Tiếng Việt）。本文に日本語・英語を混ぜない。敬語レポートとして自然なトーン。'
    );
  } else if (l === 'ne') {
    lines.push(
      '【出力言語】見出しと本文はすべてネパール語（देवनागरी表記の नेपाली）。本文に日本語・英語を混ぜない。'
    );
  } else if (l === 'hi') {
    lines.push(
      '【出力言語】見出しと本文はすべてヒンディー語（देवनागरी表記）。本文に日本語を混ぜない。'
    );
  } else if (l === 'zh') {
    lines.push('【输出语言】标题与正文一律使用简体中文。不要在正文使用日语或英语。');
  } else if (l === 'id') {
    lines.push(
      '【出力言語】見出しと本文はすべてインドネシア語（Bahasa Indonesia）。本文に日本語を混ぜない。大学生向けレポートとして礼儀正しく自然なトーン。'
    );
  } else {
    lines.push('【出力言語】見出しと本文はすべて日本語。');
    if (styleDearu) {
      lines.push(
        '【文体】常体（だ・である調）で統一する。文末は「だ」「である」等の常体。です・ます調は使わない（引用・資料の抜粋・固有名句を除く）。'
      );
    } else {
      lines.push(
        '【文体】敬体（です・ます調）で統一する。文末は「です」「ます」。だ・である調に切り替えない（引用・資料の抜粋・固有名句を除く）。'
      );
    }
  }
  return lines.join('\n');
}

function studentModeBlock(mode) {
  const m = STUDENT_MODES.has(mode) ? mode : 'average';
  switch (m) {
    case 'honors':
      return [
        '【モード: 優等生】',
        '提出に耐えうるレベルの完成度を目指してよい。論旨・構成・言い回しはしっかり整えてよい（「完璧であってもよい」）。',
        'ただし意味の薄いテンプレ列挙や、AIがよく使う定型フレーズの連打だけは避け、人間の優等生が書いた自然な整い方を優先する。'
      ].join('\n');
    case 'barely':
      return [
        '【モード: ギリ単（最低限・素早く）】',
        '骨格と要点だけ。分量は目安の約60〜90%でもよい（短くてよい）。',
        '導入やまとめは短く、本論も最小限の段落で。推敲の余地を大きく残す。',
        '完璧なつながりや立派な装飾は不要。テンプレ臭は最優先で避ける。'
      ].join('\n');
    default:
      return [
        '【モード: 普通の大学生】',
        '75点前後を意識した自然な下書き。徹夜前に書いた感じの許容域を少し持つ。',
        '過剰に整えない。AIが書いた気配は抑える。'
      ].join('\n');
  }
}

function publicUser(user, usage) {
  const pro = hasProAccess(user);
  return {
    id: user.id,
    email: user.email,
    plan: pro ? 'pro' : 'free',
    hasBilling: Boolean(user.stripeCustomerId),
    hasPassword: Boolean(user.passwordHash),
    locale: user.locale ? normalizeUiLocale(user.locale) : null,
    usage: {
      text: usage?.text || 0,
      image: usage?.image || 0,
      textLimit: pro ? null : FREE_DAILY_TEXT,
      imageLimit: pro ? null : FREE_DAILY_IMAGE,
      charMin: MIN_TARGET_CHARS,
      charMax: maxTargetCharsForPro(pro)
    }
  };
}

function makeSessionToken(userId) {
  const raw = `${userId}.${Date.now()}.${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHmac('sha256', sessionSecret).update(raw).digest('hex');
}

function findValidSession(store, token) {
  if (!token) return null;
  const session = store.sessions.find((x) => x.token === token);
  if (!session) return null;
  const exp = session.expiresAt ? Number(session.expiresAt) : null;
  if (exp && Date.now() > exp) {
    store.sessions = store.sessions.filter((s) => s.token !== token);
    writeStore(store);
    return null;
  }
  return session;
}

function findUserForSession(store, token) {
  const session = findValidSession(store, token);
  if (!session) return null;
  const user = store.users.find((x) => x.id === session.userId);
  return user || null;
}

function clearSessionCookie(res) {
  const c = sessionCookieOptions();
  res.clearCookie(COOKIE_NAME, { path: c.path, httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure });
}

function establishSession(res, store, user) {
  const token = makeSessionToken(user.id);
  const now = Date.now();
  store.sessions = store.sessions.filter(
    (s) => s.userId !== user.id || (s.expiresAt && Number(s.expiresAt) > now)
  );
  store.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: now + SESSION_TTL_MS
  });
  writeStore(store);
  res.cookie(COOKIE_NAME, token, sessionCookieOptions());
  const ac = anonCookieOptions();
  res.clearCookie(ANON_COOKIE, {
    path: ac.path,
    httpOnly: ac.httpOnly,
    sameSite: ac.sameSite,
    secure: ac.secure
  });
  return token;
}

function findOrCreateGoogleUser(store, profile) {
  const sub = String(profile?.sub || '').trim();
  const email = String(profile?.email || '')
    .trim()
    .toLowerCase();
  if (!sub) throw new Error('Googleアカウント情報を取得できませんでした。');
  if (!email) throw new Error('Googleからメールアドレスを取得できませんでした。');
  if (profile?.email_verified !== true) {
    throw new Error('メールアドレスが確認済みの Google アカウントでログインしてください。');
  }

  let user = store.users.find((u) => u.googleId === sub);
  if (user) return user;

  user = store.users.find((u) => u.email === email);
  if (user) {
    if (user.googleId && user.googleId !== sub) {
      throw new Error('このメールは別のGoogleアカウントに紐づいています。');
    }
    if (!user.googleId) user.googleId = sub;
    return user;
  }

  user = {
    id: crypto.randomUUID(),
    email,
    googleId: sub,
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  store.users.push(user);
  return user;
}

async function createCheckoutUrlForUser(user) {
  if (!stripe || !stripePriceId) return null;
  const payload = {
    mode: 'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${baseUrl.replace(/\/$/, '')}/app?payment=success`,
    cancel_url: `${baseUrl.replace(/\/$/, '')}/app?payment=cancel`,
    metadata: { userId: user.id },
    client_reference_id: user.id
  };
  if (user.stripeCustomerId) {
    payload.customer = user.stripeCustomerId;
  } else {
    payload.customer_email = user.email;
  }
  const session = await stripe.checkout.sessions.create(payload);
  return session.url || null;
}

function getUsage(store, userId) {
  const day = todayKey();
  if (!store.usage[userId]) store.usage[userId] = {};
  if (!store.usage[userId][day]) store.usage[userId][day] = { text: 0, image: 0 };
  return store.usage[userId][day];
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'ログインしてください。' });

  const store = readStore();
  const user = findUserForSession(store, token);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'セッションが切れました。再ログインしてください。' });
  }

  req.store = store;
  req.user = user;
  req.usage = getUsage(store, user.id);
  next();
}

function enforceQuota(user, usage, type) {
  if (hasProAccess(user)) return null;
  if (type === 'text' && usage.text >= FREE_DAILY_TEXT) {
    return `このブラウザの無料枠は1日${FREE_DAILY_TEXT}回までです。Proは「ログイン / Pro」からログインのうえ課金してください。`;
  }
  if (type === 'image' && usage.image >= FREE_DAILY_IMAGE) {
    return `このブラウザの画像は1日${FREE_DAILY_IMAGE}枚までです。Proはログイン後に課金してください。`;
  }
  return null;
}

function anonStorageKey(uuid) {
  return `anon_${uuid}`;
}

function ensureAnonUuid(req, res) {
  let u = req.cookies[ANON_COOKIE];
  if (!u || !/^[0-9a-f-]{36}$/i.test(u)) {
    u = crypto.randomUUID();
    res.cookie(ANON_COOKIE, u, anonCookieOptions());
  }
  return u;
}

function attachActor(req, res) {
  const store = readStore();
  req.store = store;
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    const user = findUserForSession(store, token);
    if (user) {
      req.actUser = user;
      req.actUsage = getUsage(store, user.id);
      req.actPro = hasProAccess(user);
      return;
    }
  }
  const uuid = ensureAnonUuid(req, res);
  req.actUser = { plan: 'free' };
  req.actUsage = getUsage(store, anonStorageKey(uuid));
  req.actPro = false;
}

function usageForResponse(req) {
  if (req.actUser && req.actUser.email) {
    return publicUser(req.actUser, req.actUsage).usage;
  }
  return {
    anonymous: true,
    text: req.actUsage.text,
    image: req.actUsage.image,
    textLimit: FREE_DAILY_TEXT,
    imageLimit: FREE_DAILY_IMAGE,
    charMin: MIN_TARGET_CHARS,
    charMax: FREE_MAX_TARGET_CHARS
  };
}

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !stripeWebhookSecret) return res.status(400).send('stripe webhook not configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid webhook signature';
    return res.status(400).send(message);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paid =
      session?.payment_status === 'paid' || session?.payment_status === 'no_payment_required';
    const userId = String(session?.metadata?.userId || session?.client_reference_id || '');
    if (paid && userId) {
      const store = readStore();
      const user = store.users.find((x) => x.id === userId);
      if (user) {
        user.plan = 'pro';
        user.stripeCustomerId = session.customer ? String(session.customer) : user.stripeCustomerId;
        if (user.stripeCustomerId) {
          store.stripeMap[user.stripeCustomerId] = user.id;
        }
        writeStore(store);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const customerId = sub.customer ? String(sub.customer) : '';
    if (customerId) {
      const store = readStore();
      const userId = store.stripeMap[customerId];
      if (userId) {
        const user = store.users.find((x) => x.id === userId);
        if (user) user.plan = 'free';
        writeStore(store);
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const customerId = sub.customer ? String(sub.customer) : '';
    const status = String(sub.status || '');
    if (customerId && (status === 'canceled' || status === 'unpaid' || status === 'past_due')) {
      const store = readStore();
      const userId = store.stripeMap[customerId];
      if (userId) {
        const user = store.users.find((x) => x.id === userId);
        if (user) user.plan = 'free';
        writeStore(store);
      }
    }
  }

  return res.json({ received: true });
});

app.use((req, res, next) => {
  const ip = clientIp(req);
  if (isBlockedIp(ip)) {
    return res.status(403).json({ error: 'アクセスが制限されています。' });
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com https://generativelanguage.googleapis.com https://api.openai.com;"
  );
  if (cookieSecureFlag()) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

/** トップの index.html 直叩きはゲートを踏ませる */
app.get('/index.html', (_req, res) => {
  res.redirect(302, '/app');
});

app.use(express.static(publicDir, { index: false }));

function requireAdminAccess(req, res, next) {
  const ip = clientIp(req);
  if (!isAdminIpAllowed(ip)) {
    return res.status(403).json({ error: '管理アクセスは許可IPのみです。' });
  }
  if (!ADMIN_BASIC_USER || !ADMIN_BASIC_PASS) {
    return res.status(503).json({ error: '管理認証が未設定です。' });
  }

  const lockKey = `${ip}:admin`;
  const now = Date.now();
  if (isBucketLocked(adminAuthBuckets, lockKey, now)) {
    return res.status(423).json({ error: '管理ログインは一時ロック中です。' });
  }

  const auth = String(req.headers.authorization || '');
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.setHeader('WWW-Authenticate', 'Basic realm="repotasu-admin"');
    return res.status(401).send('Authentication required');
  }
  let user = '';
  let pass = '';
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const idx = decoded.indexOf(':');
    if (idx > -1) {
      user = decoded.slice(0, idx);
      pass = decoded.slice(idx + 1);
    }
  } catch {
    /* ignore */
  }

  if (user !== ADMIN_BASIC_USER || pass !== ADMIN_BASIC_PASS) {
    const lockedNow = failAndMaybeLock(
      adminAuthBuckets,
      lockKey,
      now,
      ADMIN_LOCK_MAX_ATTEMPTS,
      ADMIN_LOCK_WINDOW_MS
    );
    if (lockedNow) return res.status(423).json({ error: '管理ログインはロックされました。' });
    res.setHeader('WWW-Authenticate', 'Basic realm="repotasu-admin"');
    return res.status(401).send('Invalid credentials');
  }
  resetBucket(adminAuthBuckets, lockKey);
  return next();
}

app.get('/', (req, res) => {
  const p = req.query?.payment;
  if (p === 'success' || p === 'cancel') {
    return res.redirect(302, `/app?payment=${encodeURIComponent(String(p))}`);
  }
  return res.redirect(302, '/app');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/admin/security-status', requireAdminAccess, (req, res) => {
  res.json({
    ok: true,
    ip: clientIp(req),
    adminIpAllowlistEnabled: ADMIN_ALLOWED_IPS.size > 0,
    adminLockMaxAttempts: ADMIN_LOCK_MAX_ATTEMPTS,
    adminLockWindowMs: ADMIN_LOCK_WINDOW_MS,
    manualBlockedIpCount: BLOCKED_IPS.size,
    autoBlockedIpCount: autoBlockedIps.size
  });
});

app.get('/api/auth/config', (_req, res) => {
  res.json({ googleEnabled: googleOAuthEnabled() });
});

app.get('/api/auth/google', (req, res) => {
  if (!googleOAuthEnabled()) {
    return res.status(503).json({ error: 'Googleログインは未設定です。' });
  }
  const intent = String(req.query?.intent || '').trim() === 'pro' ? 'pro' : '';
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = signOAuthState({ nonce, exp: Date.now() + 1000 * 60 * 10, intent });
  res.cookie(GOOGLE_OAUTH_COOKIE, state, oauthCookieOptions());
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  });
  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const fail = (code) => res.redirect(302, `/login.html?error=${encodeURIComponent(code)}`);
  try {
    if (!googleOAuthEnabled()) return fail('google_disabled');

    const err = String(req.query?.error || '').trim();
    if (err) return fail('google_denied');

    const code = String(req.query?.code || '').trim();
    const state = String(req.query?.state || '').trim();
    const cookieState = String(req.cookies[GOOGLE_OAUTH_COOKIE] || '').trim();
    const oc = oauthCookieOptions();
    res.clearCookie(GOOGLE_OAUTH_COOKIE, {
      path: oc.path,
      httpOnly: oc.httpOnly,
      sameSite: oc.sameSite,
      secure: oc.secure
    });

    if (!code || !state || state !== cookieState) return fail('google_state');
    const parsed = verifyOAuthState(state);
    if (!parsed) return fail('google_state');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri(),
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) return fail('google_token');

    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile.sub) return fail('google_profile');

    const store = readStore();
    const user = findOrCreateGoogleUser(store, profile);
    establishSession(res, store, user);

    if (parsed.intent === 'pro' && user.plan !== 'pro') {
      const checkoutUrl = await createCheckoutUrlForUser(user);
      if (checkoutUrl) return res.redirect(302, checkoutUrl);
    }

    return res.redirect(302, '/app');
  } catch (_e) {
    return fail('google_auth');
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const ip = clientIp(req);
    if (!rateLimit(`auth:ip:${ip}`, { limit: 40 }) || !rateLimit(`auth:email:${email}`, { limit: 15 })) {
      return res.status(429).json({ error: '試行回数が多すぎます。しばらく待ってからお試しください。' });
    }
    if (!email || !password) return res.status(400).json({ error: 'メールとパスワードを入力してください。' });
    if (password.length < 6) return res.status(400).json({ error: 'パスワードは6文字以上にしてください。' });

    const store = readStore();
    if (store.users.some((u) => u.email === email)) {
      return res.status(400).json({ error: 'このメールはすでに登録されています。' });
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      plan: 'free',
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
    establishSession(res, store, user);
    res.json({ user: publicUser(user, getUsage(store, user.id)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const ip = clientIp(req);
    const emailLockKey = `login:${email}`;
    const now = Date.now();
    if (email && isBucketLocked(userLoginBuckets, emailLockKey, now)) {
      return res.status(423).json({ error: 'ログイン失敗が続いたため一時的にロックしました。時間をおいてお試しください。' });
    }
    if (!rateLimit(`auth:ip:${ip}`, { limit: 40 }) || !rateLimit(`auth:email:${email}`, { limit: 15 })) {
      return res.status(429).json({ error: '試行回数が多すぎます。しばらく待ってからお試しください。' });
    }
    const store = readStore();
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      if (email) {
        const lockedNow = failAndMaybeLock(
          userLoginBuckets,
          emailLockKey,
          now,
          USER_LOGIN_LOCK_MAX_ATTEMPTS,
          USER_LOGIN_LOCK_MS
        );
        if (lockedNow) blockIpTemporarily(ip, 'login_lockout_user_missing');
      }
      return res.status(401).json({ error: 'メールまたはパスワードが違います。' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'このアカウントはGoogleでログインしてください。' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const lockedNow = failAndMaybeLock(
        userLoginBuckets,
        emailLockKey,
        now,
        USER_LOGIN_LOCK_MAX_ATTEMPTS,
        USER_LOGIN_LOCK_MS
      );
      if (lockedNow) blockIpTemporarily(ip, 'login_lockout_bad_password');
      return res.status(401).json({ error: 'メールまたはパスワードが違います。' });
    }
    if (email) resetBucket(userLoginBuckets, emailLockKey);

    establishSession(res, store, user);
    res.json({ user: publicUser(user, getUsage(store, user.id)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    const store = readStore();
    store.sessions = store.sessions.filter((x) => x.token !== token);
    writeStore(store);
  }
  const c = sessionCookieOptions();
  res.clearCookie(COOKIE_NAME, { path: c.path, httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const store = readStore();
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    const user = findUserForSession(store, token);
    if (user) {
      return res.json({ user: publicUser(user, getUsage(store, user.id)) });
    }
    clearSessionCookie(res);
  }
  const raw = req.cookies[ANON_COOKIE];
  if (!raw || !/^[0-9a-f-]{36}$/i.test(raw)) {
    return res.json({
      user: null,
      anonymous: {
        usage: {
          text: 0,
          image: 0,
          textLimit: FREE_DAILY_TEXT,
          imageLimit: FREE_DAILY_IMAGE,
          charMin: MIN_TARGET_CHARS,
          charMax: FREE_MAX_TARGET_CHARS
        }
      }
    });
  }
  const usage = getUsage(store, anonStorageKey(raw));
  return res.json({
    user: null,
    anonymous: {
      usage: {
        text: usage.text,
        image: usage.image,
        textLimit: FREE_DAILY_TEXT,
        imageLimit: FREE_DAILY_IMAGE,
        charMin: MIN_TARGET_CHARS,
        charMax: FREE_MAX_TARGET_CHARS
      }
    }
  });
});

app.post('/api/me/locale', requireAuth, (req, res) => {
  try {
    const locale = normalizeUiLocale(req.body?.locale);
    const store = readStore();
    const user = store.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.locale = locale;
    writeStore(store);
    res.json({ ok: true, locale });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/fetch-reference-url', async (req, res) => {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`fetch:url:${ip}`, { limit: 20, windowMs: 60 * 1000 })) {
      return res.status(429).json({ error: 'URL読み込みの回数が多すぎます。しばらく待ってからお試しください。' });
    }
    const url = String(req.body?.url ?? '').trim();
    if (!url) return res.status(400).json({ error: 'URLを入力してください。' });
    const result = await fetchUrlHtml(url);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ url: result.url, title: result.title, text: result.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get('/api/drafts', requireAuth, (req, res) => {
  const store = readStore();
  const list = Array.isArray(store.draftHistoryByUser[req.user.id])
    ? store.draftHistoryByUser[req.user.id]
    : [];
  res.json({ drafts: [...list].reverse() });
});

app.post('/api/drafts', requireAuth, (req, res) => {
  try {
    const entry = normalizeDraftEntry(req.body?.draft || req.body);
    const store = readStore();
    if (!Array.isArray(store.draftHistoryByUser[req.user.id])) {
      store.draftHistoryByUser[req.user.id] = [];
    }
    const list = store.draftHistoryByUser[req.user.id];
    const idx = list.findIndex((d) => d.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    while (list.length > MAX_DRAFT_HISTORY) list.shift();
    writeStore(store);
    res.json({ ok: true, draft: entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/billing/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`billing:checkout:ip:${ip}`, { limit: 12, windowMs: 10 * 60 * 1000 })) {
      blockIpTemporarily(ip, 'billing_checkout_rate_limit');
      return res.status(429).json({ error: '決済試行が多すぎます。時間をおいて再試行してください。' });
    }
    if (!rateLimit(`billing:checkout:user:${req.user.id}`, { limit: 8, windowMs: 10 * 60 * 1000 })) {
      return res.status(429).json({ error: '決済試行が多すぎます。時間をおいて再試行してください。' });
    }
    if (!stripe || !stripePriceId) {
      return res.status(500).json({
        error:
          'Stripeが未設定です。.env に STRIPE_SECRET_KEY と STRIPE_PRICE_ID を書き、サーバ（npm run dev）を再起動してください。',
        missing: {
          STRIPE_SECRET_KEY: !stripeKey,
          STRIPE_PRICE_ID: !stripePriceId
        }
      });
    }
    const payload = {
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${baseUrl.replace(/\/$/, '')}/app?payment=success`,
      cancel_url: `${baseUrl.replace(/\/$/, '')}/app?payment=cancel`,
      metadata: { userId: req.user.id },
      client_reference_id: req.user.id
    };
    if (req.user.stripeCustomerId) {
      payload.customer = req.user.stripeCustomerId;
    } else {
      payload.customer_email = req.user.email;
    }
    const session = await stripe.checkout.sessions.create(payload);
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/billing/create-portal-session', requireAuth, async (req, res) => {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`billing:portal:ip:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 })) {
      blockIpTemporarily(ip, 'billing_portal_rate_limit');
      return res.status(429).json({ error: '請求ページの操作が多すぎます。時間をおいて再試行してください。' });
    }
    if (!stripe) {
      return res.status(500).json({ error: 'Stripeが未設定です。' });
    }
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        error: '請求情報がありません。先に Pro をご契約いただくか、お問い合わせください。'
      });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${baseUrl.replace(/\/$/, '')}/app`
    });
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/auth/delete-account', requireAuth, async (req, res) => {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`auth:delete:ip:${ip}`, { limit: 5, windowMs: 30 * 60 * 1000 })) {
      return res.status(429).json({ error: '操作回数が多すぎます。時間をおいて再試行してください。' });
    }
    const user = req.user;
    const store = req.store;
    const password = String(req.body?.password || '').trim();
    const confirmEmail = String(req.body?.confirmEmail || '')
      .trim()
      .toLowerCase();

    if (confirmEmail !== user.email) {
      return res.status(400).json({ error: '確認用メールアドレスが一致しません。' });
    }
    if (user.passwordHash) {
      if (!password) return res.status(400).json({ error: 'パスワードを入力してください。' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'パスワードが違います。' });
    }

    if (stripe && user.stripeCustomerId) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
          limit: 20
        });
        for (const sub of subs.data) {
          if (['active', 'trialing', 'past_due', 'unpaid'].includes(String(sub.status || ''))) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
      } catch (stripeErr) {
        // eslint-disable-next-line no-console
        console.error('[repotasu-ai] Stripe cancel on account delete failed:', stripeErr);
      }
    }

    store.sessions = store.sessions.filter((s) => s.userId !== user.id);
    store.users = store.users.filter((u) => u.id !== user.id);
    delete store.usage[user.id];
    delete store.draftHistoryByUser[user.id];
    if (user.stripeCustomerId) delete store.stripeMap[user.stripeCustomerId];
    writeStore(store);

    const c = sessionCookieOptions();
    res.clearCookie(COOKIE_NAME, { path: c.path, httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure });
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    attachActor(req, res);
    if (!textAiReady()) {
      return res.status(500).json({
        error: textAiMissingMessage()
      });
    }
    const quotaError = enforceQuota(req.actUser, req.actUsage, 'text');
    if (quotaError) return res.status(403).json({ error: quotaError, code: 'FREE_LIMIT_TEXT' });

    const theme = String(req.body?.theme ?? '').trim().slice(0, MAX_DRAFT_THEME);
    const { images: parsedImages, error: imageCollectError } = collectReportImages(req.body);
    if (imageCollectError) {
      return res.status(400).json({ error: imageCollectError });
    }

    const toneRaw = String(req.body?.tone ?? '').trim();
    const tone = TONES.has(toneRaw) ? toneRaw : 'casual';
    const studentModeRaw = String(req.body?.studentMode ?? 'average').trim();
    const modeKey = STUDENT_MODES.has(studentModeRaw) ? studentModeRaw : 'average';
    const outputLangRaw = String(req.body?.outputLang ?? 'ja').trim();
    const outputLang = OUTPUT_LANGS.has(outputLangRaw) ? outputLangRaw : 'ja';
    const japaneseStyleRaw = String(req.body?.japaneseStyle ?? 'desu').trim();
    const japaneseStyle = outputLang === 'ja' && japaneseStyleRaw === 'dearu' ? 'dearu' : 'desu';
    const charResolved = resolveTargetChars(req.body?.targetChars ?? 800, req.actPro);
    if (!charResolved.ok) {
      if (charResolved.code === 'CHAR_BELOW_MIN') {
        return res.status(400).json({
          error: `文字数目安は${MIN_TARGET_CHARS}字以上にしてください。`,
          code: charResolved.code
        });
      }
      const limitMsg = req.actPro
        ? `文字数目安は最大${charResolved.max}字までです。`
        : `無料枠の文字数目安は最大${FREE_MAX_TARGET_CHARS}字までです。${FREE_MAX_TARGET_CHARS + 1}字以上は Pro でご利用ください。`;
      return res.status(403).json({ error: limitMsg, code: charResolved.code });
    }
    const targetChars = charResolved.value;
    const quality = req.actPro ? String(req.body?.quality || 'normal') : 'normal';
    const outputPresetRaw = String(req.body?.outputPreset ?? 'default').trim();
    const outputPreset = OUTPUT_PRESETS.has(outputPresetRaw) ? outputPresetRaw : 'default';
    const ALLOWED_REWRITE = new Set(['', 'rephrase', 'natural', 'shorter', 'student', 'intl', 'trim_chars']);
    const REVISION_INTENTS = new Set(['natural', 'shorter', 'student', 'intl', 'trim_chars']);
    const REPHRASE_MIN_CHARS = 40;
    let rewriteIntent = String(req.body?.rewriteIntent ?? '').trim();
    if (!ALLOWED_REWRITE.has(rewriteIntent)) rewriteIntent = '';
    if (!rewriteIntent && Boolean(req.body?.variation)) rewriteIntent = 'rephrase';

    const referenceRaw = String(req.body?.referenceMaterial ?? '').trim();
    const referenceMaterial =
      referenceRaw.length > MAX_REFERENCE_CHARS ? referenceRaw.slice(0, MAX_REFERENCE_CHARS) : referenceRaw;

    const revisionBaseRaw = String(req.body?.revisionBase ?? '').trim();
    const revisionBase =
      revisionBaseRaw.length > MAX_REFERENCE_CHARS ? revisionBaseRaw.slice(0, MAX_REFERENCE_CHARS) : revisionBaseRaw;

    const rephraseWithBase =
      rewriteIntent === 'rephrase' && revisionBase.length >= REPHRASE_MIN_CHARS;
    const usesRevisionBase = REVISION_INTENTS.has(rewriteIntent) || rephraseWithBase;

    if (rewriteIntent === 'trim_chars') {
      if (revisionBase.length < 40) {
        return res.status(400).json({
          error: '文字数修正用の下書きが短すぎます。'
        });
      }
    } else if (rewriteIntent === 'rephrase' && !rephraseWithBase) {
      // theme-only rephrase (no revision base required)
    } else if (REVISION_INTENTS.has(rewriteIntent) && revisionBase.length < 80) {
      return res.status(400).json({
        error: '現行の下書きが短すぎるか未送信です。先に下書きを生成してください。'
      });
    }

    const parsedImagesForVision = usesRevisionBase ? [] : parsedImages;

    if (!usesRevisionBase && !theme && parsedImages.length === 0 && !referenceMaterial) {
      return res
        .status(400)
        .json({ error: 'テーマを入力するか、参考資料を貼るか、資料画像を添付してください。' });
    }

    const studentModeLabel =
      modeKey === 'honors' ? '優等生' : modeKey === 'barely' ? 'ギリ単（最低限・素早く）' : '普通の大学生';

    const paraRule =
      modeKey === 'barely'
        ? '- 本文は1〜3段落。導入とまとめは短く、要点優先。'
        : modeKey === 'honors'
          ? '- 本文は3〜6段落。論旨の流れをはっきり。整った構成でよい。'
          : '- 本文は2〜4段落。段落ごとの文量に少し差をつける。';

    const antiAiRulesStandard = [
      '最重要: 「AIが書いた感」を出さない。完璧すぎる整い方は避ける。',
      '避ける表現・構成の例: 過剰な箇条書き、機械的な列挙、「第一に/第二に」の連打、「多様な」「〜において」「〜と考えられる」「総じて」などのテンプレ接続の多用。',
      '避ける文体: 論文のような過度に硬い言い回し、抽象的な美辞麗句の連発、全部同じ長さの段落。',
      '見出しを使う場合も、見出し語に「導入」「序論」「本論」「まとめ」「結論」をそのまま使わない。テーマに即した具体的な見出し語にする。',
      '代わりに: 段落の長さに少しムラ、接続を1〜2か所だけ口語寄りにしてもよい（全体はレポート調を維持）。',
      '具体例は1つ入れてよいが、作り話の固有名詞は出さない（必要なら「例えば〜のような場合」程度）。',
      '断定は強くしすぎず、「〜と言える」「〜の側面がある」などにとどめる。'
    ].join('\n');

    const antiAiRulesHonors = [
      '優等生モード用の制約: 構成や論旨の整い方は高くてよい（完成度を上げてよい）。',
      '避けるのは主に次だけ: 意味の薄い美辞麗句の連発、「第一に/第二に」の機械的列挙、AIがよく使うテンプレ接続の多用。',
      '見出しを使う場合も、見出し語に「導入」「序論」「本論」「まとめ」「結論」をそのまま使わない。テーマに即した具体的な見出し語にする。',
      '箇条書きは必要最小限。レポートとして自然な段落構成を優先する。',
      '具体例は1つ入れてよいが、作り話の固有名詞は出さない（必要なら「例えば〜のような場合」程度）。',
      '断定はテーマに応じて適切に。根拠のない大言壮語だけは避ける。'
    ].join('\n');

    const antiAiRules = modeKey === 'honors' ? antiAiRulesHonors : antiAiRulesStandard;

    const presetBlock = outputFormatPresetBlock(outputPreset);

    const visionBlock =
      parsedImagesForVision.length === 1
        ? [
            '【画像あり】添付画像を確認し、読み取れる文字・図表のみを根拠に使う。',
            '判読できない箇所は捏造せず、推測が必要なら「画像からは判読できない」と短く触れるか省略する。',
            '画像が課題文・プリント・板書・スライドの場合は、その指示に可能な範囲で従う。'
          ].join('\n')
        : parsedImagesForVision.length > 1
          ? [
              `【画像が${parsedImagesForVision.length}枚】各画像の順序に意味がある場合はその順に参照し、読み取れる文字・図表のみを根拠に統合して使う。`,
              '判読できない箇所は捏造せず、推測が必要なら短く触れるか省略する。',
              '画像が課題文・プリント・板書・スライドの場合は、その指示に可能な範囲で従う。'
            ].join('\n')
          : '';

    const variationBlock =
      rewriteIntent === 'rephrase' && !rephraseWithBase
        ? '【再生成・別表現】同じテーマと要件のまま、言い回し・段落の切り方・具体例の置き方を変えてよい。論旨の筋は維持しつつ、直前の生成文を繰り返さず新規に書く。'
        : rewriteIntent === 'rephrase' && rephraseWithBase
          ? '【別表現】下記の現行下書きをベースに、意味と論点は保ちつつ言い回し・段落の切り方を変える。新しい事実は捏造しない。'
          : '';

    const rewriteIntentExtra = (() => {
      switch (rewriteIntent) {
        case 'natural':
          return '【推敲・自然化】「改訂する現行下書き」をベースに、意味と論点は保ち、テンプレ接続やAIっぽい整い方を弱め、自然なレポート文体に整える。新しい事実を捏造しない。';
        case 'shorter':
          return '【短縮】現行下書きの主旨と論の流れは保ち、冗長な繰り返しを削る。分量はおおよそ元の55〜80%を目安。構成の大枠は維持してよい。';
        case 'student':
          return '【大学生っぽく】過度な論文調を避け、普通の大学生が書いた温度感に寄せる。人間らしい段落のムラは少し残してよい。事実の捏造は禁止。';
        case 'intl':
          return '【留学生向け簡略化】内容は変えず、難語を減らし一文を短めに。専門語は必要なら短い括弧注釈。礼儀とレポート体裁は維持。';
        case 'trim_chars':
          return `【文字数修正】以下の下書きは指定文字数（${targetChars}字）を超えています。指定文字数以内に短く修正してください。意味と論点は保ち、具体例や説明を減らして分量を抑える。新しい事実は追加しない。`;
        default:
          return '';
      }
    })();

    const referenceRulesBlock =
      referenceMaterial.length > 0
        ? [
            '【参考資料あり】ユーザーが貼り付けた「参考資料」は根拠の補助であり、無断の長文転載にならないように扱う。',
            '以下の参考資料をもとに、内容を丸写しせず、大学生らしい自然なレポート下書きを作成してください。',
            '事実と意見を分け、参考資料にない内容は断定しないでください。',
            '参考資料に書かれていない数値・固有名詞・出来事を新たに補完しない（必要なら一般化または省略）。'
          ].join('\n')
        : [
            '【参考資料なし】ユーザーは参考資料の貼り付けをしていない。',
            '「参考資料によると」「資料にもあるように」「上記資料では」「前述の資料」「与えられた資料」など、資料を参照したかのような表現は使わない。',
            '根拠を示す必要があるときは、一般的な知識として述べるか、断定を避ける。'
          ].join('\n');

    const system = [
      'あなたは大学生向けのレポート下書きを作るアシスタント。',
      charCountStrictBlock(targetChars),
      studentModeBlock(modeKey),
      outputLanguageBlock(outputLang, japaneseStyle),
      presetBlock,
      visionBlock,
      referenceRulesBlock,
      antiAiRules,
      variationBlock,
      rewriteIntentExtra,
      quality === 'high'
        ? '高品質モード: 論旨の筋は通すが、AIっぽさは増やさない。具体例・段落のつながり・語彙の重複だけを整える。'
        : '通常モード: 速さ優先で簡潔に。テンプレ臭を最優先で避ける。'
    ]
      .filter(Boolean)
      .join('\n');

    const langReq =
      outputLang === 'en'
        ? '- Output headings and body in English only.'
        : outputLang === 'zh'
          ? '- 标题与正文一律使用简体中文。'
          : outputLang === 'vi'
            ? '- Đầu mục và nội dung toàn bộ bằng tiếng Việt.'
            : outputLang === 'ne'
              ? '- शीर्षक र मुख्य भाग सबै नेपाली मा लेख्नुहोस्।'
              : outputLang === 'hi'
                ? '- शीर्षक और मुख्य भाग पूरा हिंदी में लिखें।'
                : outputLang === 'id'
                  ? '- Judul dan isi seluruhnya dalam bahasa Indonesia.'
                  : '- 見出しと本文はすべて日本語で出力。';

    const themeLine = (() => {
      if (usesRevisionBase) {
        if (theme) return `テーマ: ${theme}`;
        if (referenceMaterial.length > 0) {
          return 'テーマ: （参考資料も参照しつつ、主に下記「改訂する現行下書き」を改訂）';
        }
        return 'テーマ: （下記「改訂する現行下書き」のみを改訂）';
      }
      if (theme) return `テーマ: ${theme}`;
      if (referenceMaterial.length > 0) {
        return 'テーマ: （未入力。参考資料と下記要件に基づきレポート下書きを作成してください。）';
      }
      return 'テーマ: （未入力。添付画像に写っている課題・資料の内容に基づき、レポートの下書きを作成してください。）';
    })();

    const imageRefLine =
      parsedImagesForVision.length === 0
        ? ''
        : parsedImagesForVision.length === 1
          ? '（参考: このメッセージ直後にユーザーが添付した画像があります。）'
          : `（参考: このメッセージ直後にユーザーが添付した画像が${parsedImagesForVision.length}枚、テキストの直後に続く順で添付されています。）`;

    const referenceUserBlock =
      referenceMaterial.length > 0 ? ['', '--- 参考資料（ユーザー貼り付け）---', referenceMaterial].join('\n') : '';

    const revisionUserBlock =
      usesRevisionBase && revisionBase.length > 0
        ? [
            '',
            '--- 改訂する現行下書き（これを本文として書き直す） ---',
            revisionBase,
            '---',
            '上記をシステム指示に従って改訂してください。上記にない事実・数値・固有名詞を新たに足さないこと。'
          ].join('\n')
        : '';

    const jaStyleUserLine =
      outputLang === 'ja'
        ? `文体: ${japaneseStyle === 'dearu' ? '常体（だ・である調）' : '敬体（です・ます調）'}`
        : '';

    const user = [
      themeLine,
      imageRefLine,
      revisionUserBlock,
      `指定文字数: ${targetChars}字（厳守・超過禁止）`,
      `口調: ${toneHint(tone)}`,
      `モード: ${studentModeLabel}`,
      `出力言語コード: ${outputLang}`,
      jaStyleUserLine,
      `出力形式プリセット: ${outputPreset}`,
      '',
      '要件:',
      langReq,
      '- 見出し→本文の構成。見出しは短くてよいが、「導入」「序論」「本論」「まとめ」「結論」の固定語は見出しに使わない。',
      paraRule,
      '- 大学生のレポートとして礼儀は守る。',
      '- 前置きやメタ発言（「以下に〜を述べます」等）は短く、本題に早く入る。',
      referenceUserBlock
    ]
      .filter(Boolean)
      .join('\n');

    const useVision = parsedImagesForVision.length > 0;
    const baseTemp = quality === 'high' ? 0.7 : 0.8;
    let tempBoost = 0;
    if (rewriteIntent === 'rephrase') tempBoost = rephraseWithBase ? 0.1 : 0.12;
    else if (REVISION_INTENTS.has(rewriteIntent) || rephraseWithBase) tempBoost = 0.1;
    if (rewriteIntent === 'trim_chars') tempBoost = 0.05;
    const temperature = Math.min(0.95, baseTemp + tempBoost);

    const textRaw = await runTextCompletion({
      system,
      user,
      images: parsedImagesForVision,
      temperature,
      quality,
      useVision,
      jsonMode: false
    });

    const enforced = await ensureWithinCharLimit({
      system,
      quality,
      targetChars,
      text: textRaw
    });
    const text = enforced.text;
    const charCount = countTextChars(text);

    req.actUsage.text += 1;
    writeStore(req.store);

    res.json({
      text,
      charCount,
      targetChars,
      charMin: charCountMinForTarget(targetChars),
      overLimit: false,
      adjusted: enforced.adjusted,
      adjustMethod: enforced.method ?? null,
      usage: usageForResponse(req)
    });
  } catch (err) {
    respondAiError(res, err, '/api/generate failed');
  }
});

app.post('/api/draft-score', async (req, res) => {
  try {
    attachActor(req, res);
    if (!textAiReady()) {
      return res.status(500).json({
        error: textAiMissingMessage()
      });
    }
    const actorKey = req.actUser?.id
      ? `user:${req.actUser.id}`
      : `anon:${req.cookies[ANON_COOKIE] || clientIp(req)}`;
    if (!rateLimit(`draft-score:${actorKey}`, { limit: 30, windowMs: 24 * 60 * 60 * 1000 })) {
      return res.status(429).json({ error: '下書きチェックの回数上限に達しました。明日またお試しください。' });
    }

    const text = String(req.body?.text ?? '').trim();
    const theme = String(req.body?.theme ?? '').trim().slice(0, 2000);
    const outputLangRaw = String(req.body?.outputLang ?? 'ja').trim();
    const outputLang = OUTPUT_LANGS.has(outputLangRaw) ? outputLangRaw : 'ja';

    if (text.length < 40) {
      return res.json({
        professor_alert: 'medium',
        grade_feeling: 'medium',
        checks: defaultDraftChecklist(),
        short: true
      });
    }

    const sample = text.length > 14000 ? text.slice(0, 14000) : text;
    const system = [
      'You output ONLY valid JSON (no markdown, no prose). Keys must be exactly: "professor_alert", "grade_feeling", "checks".',
      'professor_alert and grade_feeling must each be one of: low, medium, high (English, lowercase).',
      'checks must be an array with exactly these four keys once each: assignment_fit, evidence, ai_tone, citation.',
      'Each checks item must be {"key":"...", "status":"..."} and status must be one of: ok, warn, check.',
      'Use ok when the draft looks fine on that point, warn when the student should revise it, and check when there is not enough information.',
      'This is NOT a real professor grade, NOT a prediction of credits or scores. It is a playful readability tag for a student draft.',
      'professor_alert: how much a strict imaginary reader might worry about tone, thin evidence, AI-ish templating, or over-strong claims (higher = more "tense").',
      'grade_feeling: how well the draft seems to carry substance relative to the topic (NOT grading; higher = feels more "complete enough to polish").'
    ].join('\n');

    const userPayload = [
      `Draft language code: ${outputLang}`,
      theme ? `User topic / assignment hint: ${theme}` : 'Topic: unknown; infer only from the draft.',
      '---Draft body---',
      sample
    ].join('\n');

    const raw = await runTextCompletion({
      system,
      user: userPayload,
      images: [],
      temperature: 0.2,
      quality: 'normal',
      useVision: false,
      jsonMode: true
    });
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const professor_alert = normalizeTriLevel(parsed.professor_alert);
    const grade_feeling = normalizeTriLevel(parsed.grade_feeling);
    const checks = normalizeDraftChecklist(parsed.checks);
    res.json({ professor_alert, grade_feeling, checks });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[repotasu-ai] /api/draft-score failed (using fallback scores):', err);
    res.json({
      professor_alert: 'medium',
      grade_feeling: 'medium',
      checks: defaultDraftChecklist(),
      fallback: true
    });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    attachActor(req, res);
    if (!client) {
      return res.status(503).json({
        error: '表紙画像の生成には OPENAI_API_KEY が必要です（Gemini のみの設定では利用できません）。'
      });
    }
    const quotaError = enforceQuota(req.actUser, req.actUsage, 'image');
    if (quotaError) return res.status(403).json({ error: quotaError, code: 'FREE_LIMIT_IMAGE' });

    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: '画像プロンプトを入力してください。' });

    const result = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024'
    });
    const base64 = result.data?.[0]?.b64_json;
    if (!base64) return res.status(502).json({ error: '画像生成に失敗しました。' });

    req.actUsage.image += 1;
    writeStore(req.store);

    res.json({ imageBase64: base64, usage: usageForResponse(req) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.get(['/login', '/login.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/app', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const legalTemplatesDir = path.join(__dirname, 'legal-templates');

function escapeLegalHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function legalVars() {
  return {
    SITE_NAME: 'レポたすAI',
    BASE_URL: baseUrl.replace(/\/$/, ''),
    OPERATOR_NAME: String(process.env.LEGAL_OPERATOR_NAME || '【要記入：販売事業者名】').trim(),
    OPERATOR_ADDRESS: String(process.env.LEGAL_ADDRESS || '請求があった場合、遅滞なく開示いたします。').trim(),
    SUPPORT_EMAIL: String(process.env.SUPPORT_EMAIL || '【要記入：support@example.com】').trim(),
    PRO_PRICE: String(process.env.LEGAL_PRO_PRICE || '【要記入：月額○○円（税込）】').trim(),
    UPDATED: String(process.env.LEGAL_UPDATED || '2026年6月4日').trim()
  };
}

function renderLegalPage(name) {
  const file = path.join(legalTemplatesDir, `${name}.html`);
  if (!fs.existsSync(file)) return null;
  let html = fs.readFileSync(file, 'utf-8');
  const vars = legalVars();
  for (const [key, val] of Object.entries(vars)) {
    html = html.split(`{{${key}}}`).join(escapeLegalHtml(val));
  }
  return html;
}

for (const [route, page] of Object.entries({
  '/terms.html': 'terms',
  '/terms': 'terms',
  '/privacy.html': 'privacy',
  '/privacy': 'privacy',
  '/tokusho.html': 'tokusho',
  '/tokusho': 'tokusho',
  '/contact.html': 'contact',
  '/contact': 'contact'
})) {
  app.get(route, (_req, res) => {
    const html = renderLegalPage(page);
    if (!html) return res.status(404).send('Not found');
    res.type('html').send(html);
  });
}

app.get('/robots.txt', (_req, res) => {
  const origin = baseUrl.replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (_req, res) => {
  const origin = baseUrl.replace(/\/$/, '');
  const paths = ['/login.html', '/app', '/terms.html', '/privacy.html', '/tokusho.html', '/contact.html'];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`),
    '</urlset>'
  ].join('\n');
  res.type('application/xml').send(body);
});

app.get('*', (req, res) => {
  if (req.method !== 'GET') {
    res.status(404).end();
    return;
  }
  res.status(404).type('text/plain').send('Not found');
});

const port = Number(process.env.PORT ?? 5173);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[repotasu-ai] listening port=${port} BASE_URL=${baseUrl} dataDir=${dataDir} cookieSecure=${cookieSecureFlag()} trustProxy=${Boolean(
      app.get('trust proxy')
    )} NODE_ENV=${process.env.NODE_ENV || '(unset)'}`
  );
});

