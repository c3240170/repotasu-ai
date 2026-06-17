import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const required = [
  'server.js',
  'public/index.html',
  'public/app.js',
  'public/i18n.js',
  'public/login.js',
  'public/login.html',
  'legal-templates/terms.html'
];

let ok = true;
for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`[build] missing: ${rel}`);
    ok = false;
  }
}

function countTextChars(text) {
  return String(text ?? '')
    .replace(/\s/g, '')
    .replace(/[#*_`>\-]/g, '').length;
}

const sample = 'あいう えお';
const counted = countTextChars(sample);
if (counted !== 5) {
  console.error(`[build] char count sanity failed: expected 5 got ${counted}`);
  ok = false;
}

const retryMsg = 'Please retry in 43.566447637s.';
const retryMatch = retryMsg.match(/retry in ([\d.]+)\s*s/i);
if (!retryMatch || Math.ceil(Number(retryMatch[1])) !== 44) {
  console.error('[build] gemini retry parse failed');
  ok = false;
}

const quotaBlob =
  'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests';
if (
  !/quota exceeded|rate limit|resource_exhausted|generate_content_free_tier/i.test(
    quotaBlob.toLowerCase()
  )
) {
  console.error('[build] quota detection pattern failed');
  ok = false;
}

const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf-8');
for (const id of [
  'theme',
  'generate',
  'output',
  'charCountBox',
  'funMeterCharWrap',
  'draftChecklist',
  'reportImageGuide',
  'proCompareCard',
  'proCompareNote',
  'sampleConbini'
]) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`[build] index.html missing #${id}`);
    ok = false;
  }
}

const i18nText = fs.readFileSync(path.join(root, 'public/i18n.js'), 'utf-8');
const strStart = i18nText.indexOf('const STR = ');
let strEnd = i18nText.indexOf(';\n\n/** @param {Locale} loc @param', strStart);
if (strEnd < 0) strEnd = i18nText.indexOf(';\r\n\r\n/** @param {Locale} loc @param', strStart);
if (strStart < 0 || strEnd < 0) {
  console.error('[build] could not locate STR in i18n.js');
  ok = false;
} else {
  const source = i18nText.slice(strStart + 'const STR = '.length, strEnd);
  const STR = vm.runInNewContext(`(${source})`);
  const locales = ['ja', 'en', 'zh', 'vi', 'ne', 'hi', 'id'];
  const topKeys = Object.keys(STR.ja);
  const msgKeys = Object.keys(STR.ja.msg);
  const proCompareKeys = Object.keys(STR.ja.proCompare);
  const draftCheckKeys = Object.keys(STR.ja.draftChecks);
  const draftCheckStatusKeys = Object.keys(STR.ja.draftCheckStatus);
  for (const loc of locales) {
    if (!STR[loc]) {
      console.error(`[build] i18n missing locale: ${loc}`);
      ok = false;
      continue;
    }
    for (const key of topKeys) {
      if (!(key in STR[loc])) {
        console.error(`[build] i18n ${loc} missing key: ${key}`);
        ok = false;
      }
    }
    for (const key of msgKeys) {
      if (!(key in STR[loc].msg)) {
        console.error(`[build] i18n ${loc}.msg missing key: ${key}`);
        ok = false;
      }
    }
    for (const key of proCompareKeys) {
      if (!(key in STR[loc].proCompare)) {
        console.error(`[build] i18n ${loc}.proCompare missing key: ${key}`);
        ok = false;
      }
    }
    for (const key of draftCheckKeys) {
      if (!(key in STR[loc].draftChecks)) {
        console.error(`[build] i18n ${loc}.draftChecks missing key: ${key}`);
        ok = false;
      }
    }
    for (const key of draftCheckStatusKeys) {
      if (!(key in STR[loc].draftCheckStatus)) {
        console.error(`[build] i18n ${loc}.draftCheckStatus missing key: ${key}`);
        ok = false;
      }
    }
  }
}

if (!ok) process.exit(1);
console.log('[build] OK');
