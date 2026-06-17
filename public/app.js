import {
  getLocale,
  setLocale,
  applyIndexPage,
  formatUsageLine,
  patchUpgradeLabel,
  msg,
  planBadgeText,
  patchCharsHint,
  documentHtmlLang,
  funScoreDisclaimer,
  funScoreLevelLabel,
  funStripLine,
  draftSample,
  draftCheckLabel,
  draftCheckStatusLabel
} from './i18n.js';

const $ = (id) => document.getElementById(id);

const themeEl = $('theme');
const referenceMaterialEl = $('referenceMaterial');
const referenceUrlEl = $('referenceUrl');
const referenceUrlLoad = $('referenceUrlLoad');
const historySelect = $('historySelect');
const reportImageInput = $('reportImageInput');
const reportImagePick = $('reportImagePick');
const reportImageList = $('reportImageList');
const reportImageClear = $('reportImageClear');
const targetCharsEl = $('targetChars');
const toneEl = $('tone');
const studentModeEl = $('studentMode');
const qualityEl = $('quality');
const outputLangEl = $('outputLang');
const japaneseSentenceStyleEl = $('japaneseSentenceStyle');
const jaSentenceFieldWrap = $('jaSentenceFieldWrap');
const outputPresetEl = $('outputPreset');
const localeEl = $('locale');
const generateBtn = $('generate');
const varyBtn = $('varyBtn');
const step1NextBtn = $('step1NextBtn');
const step2BackBtn = $('step2BackBtn');
const step3BackBtn = $('step3BackBtn');
const regenerateBtn = $('regenerateBtn');
const stepLoadingEl = $('stepLoading');
const generateOverlayEl = $('generateOverlay');
const generateOverlayTextEl = $('generateOverlayText');
const stepTrailText = $('stepTrailText');
const stepTabs = Array.from(document.querySelectorAll('[data-step-tab]'));
const stepPanel1 = $('stepPanel1');
const stepPanel2 = $('stepPanel2');
const stepPanel3 = $('stepPanel3');
const statusEl = $('status');
const outputEl = $('output');
const lastSettingsWrap = $('lastSettingsWrap');
const lastSettingsText = $('lastSettingsText');
const charCountBox = $('charCountBox');
const charCountCurrent = $('charCountCurrent');
const charCountTarget = $('charCountTarget');
const charCountRemain = $('charCountRemain');
const charCountWarn = $('charCountWarn');
const funMeterCharWrap = $('funMeterCharWrap');
const funCharLine = $('funCharLine');
const funCharRemainLine = $('funCharRemainLine');
const copyBtn = $('copy');
const clearBtn = $('clear');
const logoutBtn = $('logoutBtn');
const upgradeBtn = $('upgradeBtn');
const billingBtn = $('billingBtn');
const planBadgeEl = $('planBadge');
const usageLineEl = $('usageLine');
const linkLogin = $('linkLogin');
const linkPro = $('linkPro');
const imagePromptEl = $('imagePrompt');
const imageGenerateBtn = $('imageGenerateBtn');
const imageResultEl = $('imageResult');
const authStatus = $('authStatus');
const accountPanel = $('accountPanel');
const accountDeleteEmail = $('accountDeleteEmail');
const accountDeletePassword = $('accountDeletePassword');
const accountDeletePwWrap = $('accountDeletePwWrap');
const deleteAccountBtn = $('deleteAccountBtn');
const footLogin = $('footLogin');
const footPro = $('footPro');
const footAuthLinks = $('footAuthLinks');
const proCompareCard = $('proCompareCard');
const proCompareCta = $('proCompareCta');
const proUpsell = $('proUpsell');
const proUpsellText = $('proUpsellText');
const proUpsellBtn = $('proUpsellBtn');
const charsProBadge = $('charsProBadge');
const qualityProBadge = $('qualityProBadge');
const targetCharsFieldWrap = $('targetCharsFieldWrap');
const qualityFieldWrap = $('qualityFieldWrap');
const sampleButtons = document.querySelectorAll('[data-sample-key]');
const tweakHeadingBtn = $('tweakHeading');
const tweakWordBtn = $('tweakWord');

let currentUser = null;
/** @type {{ text: number, image: number, textLimit: number, imageLimit: number } | null} */
let anonymousUsage = null;

const MAX_REPORT_IMAGES = 5;
const MAX_SINGLE_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_EACH_WHEN_MULTI_BYTES = 2 * 1024 * 1024;
const MAX_REPORT_IMAGES_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_REFERENCE_CHARS = 20000;
const MIN_TWEAK_PREVIEW_CHARS = 80;
const LOCAL_DRAFT_KEY = 'repotasu_draft_history';
const MAX_LOCAL_DRAFTS = 25;

/** @type {unknown[]} */
let serverDraftsCache = [];

/** @type {{ id: string, dataUrl: string, size: number }[]} */
let reportImages = [];

/** @type {{ prof: 'low' | 'medium' | 'high', grade: 'low' | 'medium' | 'high', checks?: { key: string, status: string }[] } | null} */
let draftScoreCache = null;
let draftScorePending = false;
let currentStep = 1;
let lastGeneratedTargetChars = null;

const DRAFT_CHECK_KEYS = ['assignment_fit', 'evidence', 'ai_tone', 'citation'];
const DEFAULT_DRAFT_SCORE = { prof: 'medium', grade: 'medium' };

/** @type {number} */
let generateCooldownUntil = 0;
/** @type {ReturnType<typeof setInterval> | null} */
let generateCooldownTimer = null;

function looksLikeGeminiQuotaError(message) {
  const s = String(message || '').toLowerCase();
  return (
    s.includes('quota exceeded') ||
    s.includes('rate limit') ||
    s.includes('resource_exhausted') ||
    s.includes('generate_content_free_tier') ||
    s.includes('generativelanguage.googleapis.com')
  );
}

function isGenerateOnCooldown() {
  return Date.now() < generateCooldownUntil;
}

function cooldownSecondsRemaining() {
  return Math.max(0, Math.ceil((generateCooldownUntil - Date.now()) / 1000));
}

function clearGenerateCooldownTimer() {
  if (generateCooldownTimer) {
    clearInterval(generateCooldownTimer);
    generateCooldownTimer = null;
  }
}

/** @param {number} seconds */
function startGenerateCooldown(seconds) {
  const raw = Number(seconds);
  const sec = Math.min(60, Math.max(40, Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : 45));
  generateCooldownUntil = Date.now() + sec * 1000;
  clearGenerateCooldownTimer();
  updateGenerateCooldownUi();
  generateCooldownTimer = setInterval(updateGenerateCooldownUi, 1000);
}

function updateGenerateCooldownUi() {
  const remain = cooldownSecondsRemaining();
  if (remain <= 0) {
    generateCooldownUntil = 0;
    clearGenerateCooldownTimer();
    setGenerateControlsDisabled(false);
    syncOutputToolbar();
    return;
  }
  setGenerateControlsDisabled(true);
  setStatus(fmtMsg('aiRetryCountdown', { n: remain }), 'status--err');
}

function sanitizeClientErrorMessage(message) {
  if (!message || looksLikeGeminiQuotaError(message)) {
    return t('aiBusy');
  }
  return message;
}

function L() {
  return getLocale();
}

function t(key) {
  return msg(L())[key] ?? msg('ja')[key] ?? key;
}

function setStepLoading(loading) {
  if (stepLoadingEl) {
    stepLoadingEl.hidden = true;
    stepLoadingEl.textContent = '';
  }
  if (generateOverlayEl) generateOverlayEl.hidden = !loading;
  if (generateOverlayTextEl) generateOverlayTextEl.textContent = loading ? t('generating') : '';
  if (generateBtn) {
    generateBtn.classList.toggle('is-busy', loading);
    if (loading) generateBtn.setAttribute('aria-busy', 'true');
    else generateBtn.removeAttribute('aria-busy');
  }
  if (regenerateBtn) {
    regenerateBtn.classList.toggle('is-busy', loading);
    if (loading) regenerateBtn.setAttribute('aria-busy', 'true');
    else regenerateBtn.removeAttribute('aria-busy');
  }
}

function setCurrentStep(step) {
  const s = Math.min(3, Math.max(1, Number(step) || 1));
  currentStep = s;
  if (stepPanel1) stepPanel1.hidden = s !== 1;
  if (stepPanel2) stepPanel2.hidden = s !== 2;
  if (stepPanel3) stepPanel3.hidden = s !== 3;
  if (stepPanel1) stepPanel1.classList.toggle('stepPanel--active', s === 1);
  if (stepPanel2) stepPanel2.classList.toggle('stepPanel--active', s === 2);
  if (stepPanel3) stepPanel3.classList.toggle('stepPanel--active', s === 3);
  if (stepTrailText) stepTrailText.textContent = t('stepTrailText');
  for (const tab of stepTabs) {
    const isActive = Number(tab.getAttribute('data-step-tab')) === s;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-current', isActive ? 'step' : 'false');
  }
  if (s === 3) renderFunStrip();
}

function fmtMsg(key, vars = {}) {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{{${k}}}`, String(v));
  }
  return s;
}

/** @param {string} text */
function normalizeGeneratedText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .trim();
}

/** @param {HTMLSelectElement | null} selectEl */
function selectedOptionText(selectEl) {
  if (!selectEl) return '';
  const opt = selectEl.options[selectEl.selectedIndex];
  return (opt?.textContent || '').trim();
}

/** @param {string} id @param {string} fallback */
function uiLabelText(id, fallback) {
  const el = $(id);
  return (el?.textContent || '').trim() || fallback;
}

/** @param {number | null} targetChars */
function renderLastSettingsSummary(targetChars = null) {
  if (!lastSettingsWrap || !lastSettingsText) return;
  const target = Number.isFinite(Number(targetChars)) ? Number(targetChars) : readTargetCharsFromForm();
  const parts = [
    `${uiLabelText('lblOutputLang', 'Language')}: ${selectedOptionText(outputLangEl)}`,
    `${uiLabelText('lblMode', 'Mode')}: ${selectedOptionText(studentModeEl)}`,
    `${uiLabelText('lblTone', 'Tone')}: ${selectedOptionText(toneEl)}`,
    `${uiLabelText('lblQuality', 'Quality')}: ${selectedOptionText(qualityEl)}`,
    `${uiLabelText('lblChars', 'Chars')}: ${target}`
  ];
  if (outputLangEl?.value === 'ja') {
    parts.splice(1, 0, `${uiLabelText('lblJaSentence', 'Style')}: ${selectedOptionText(japaneseSentenceStyleEl)}`);
  }
  parts.push(`${uiLabelText('lblOutputPreset', 'Preset')}: ${selectedOptionText(outputPresetEl)}`);
  lastSettingsText.textContent = parts.filter(Boolean).join(' / ');
  lastSettingsWrap.hidden = false;
}

function applyDraftSample(key) {
  const sample = draftSample(L(), key);
  if (!sample) return;
  if (themeEl) themeEl.value = sample.theme || '';
  if (referenceMaterialEl) referenceMaterialEl.value = sample.referenceMaterial || '';
  if (targetCharsEl) targetCharsEl.value = String(sample.targetChars || 800);
  if (outputLangEl && sample.outputLang) outputLangEl.value = sample.outputLang;
  if (studentModeEl && sample.studentMode) studentModeEl.value = sample.studentMode;
  if (toneEl && sample.tone) toneEl.value = sample.tone;
  if (outputPresetEl && sample.outputPreset) outputPresetEl.value = sample.outputPreset;
  syncJapaneseOutputUi();
  applyCharLimitLock();
  updateCharCountDisplay(readTargetCharsFromForm(), outputEl?.value || '');
  setStatus(t('sampleApplied'), 'status--ok');
}

/** 本文のみの文字数（空白・改行・Markdown記号を除外） */
function countTextChars(text) {
  return String(text ?? '')
    .replace(/\s/g, '')
    .replace(/[#*_`>\-]/g, '').length;
}

function readTargetCharsFromForm() {
  const n = Number.parseInt(targetCharsEl?.value ?? '', 10);
  return Number.isFinite(n) ? n : 800;
}

function updateCharCountDisplay(targetChars, text) {
  const trimmed = (text || '').trim();
  const target = Number.isFinite(targetChars) ? targetChars : readTargetCharsFromForm();
  const current = trimmed ? countTextChars(trimmed) : 0;
  const remain = target - current;
  const hasText = trimmed.length > 0;
  const isOver = hasText && remain < 0;

  if (charCountBox) {
    if (!hasText) {
      charCountBox.hidden = true;
      charCountBox.classList.remove('over');
      if (charCountWarn) charCountWarn.hidden = true;
    } else {
      charCountBox.hidden = false;
      charCountBox.classList.toggle('over', isOver);
      if (charCountCurrent) charCountCurrent.textContent = fmtMsg('charCountCurrent', { n: current });
      if (charCountTarget) charCountTarget.textContent = fmtMsg('charCountTarget', { n: target });
      if (charCountRemain) {
        charCountRemain.textContent =
          remain >= 0
            ? fmtMsg('charCountRemain', { n: remain })
            : fmtMsg('charCountRemainOver', { n: Math.abs(remain) });
      }
      if (charCountWarn) {
        charCountWarn.hidden = !isOver;
        charCountWarn.textContent = isOver ? t('charsOverTargetWarn') : '';
      }
    }
  }

  if (funMeterCharWrap) {
    funMeterCharWrap.hidden = !hasText;
    funMeterCharWrap.classList.toggle('funMeterCharCheck--over', isOver);
    if (hasText) {
      if (funCharLine) funCharLine.textContent = fmtMsg('funCharLine', { current, target });
      if (funCharRemainLine) {
        funCharRemainLine.textContent =
          remain >= 0
            ? fmtMsg('charCountRemain', { n: remain })
            : fmtMsg('charCountRemainOver', { n: Math.abs(remain) });
      }
    }
  }
}

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`.trim();
}

function setAuthStatus(text, kind = '') {
  if (!text) {
    authStatus.hidden = true;
    authStatus.textContent = '';
    authStatus.className = 'authBanner';
    return;
  }
  authStatus.hidden = false;
  authStatus.textContent = text;
  authStatus.className = `authBanner ${kind}`.trim();
}

function renderFunStrip() {
  const loc = L();
  const profEl = $('funProfValue');
  const gradeEl = $('funGradeValue');
  const profBar = $('funProfBar');
  const gradeBar = $('funGradeBar');
  const disc = $('funDisclaimer');
  const card = $('funMeterRow');
  if (disc) disc.textContent = funScoreDisclaimer(loc);
  const hasOut = (outputEl?.value || '').trim().length > 0;
  const prof = draftScoreCache?.prof;
  const grade = draftScoreCache?.grade;
  const pending = draftScorePending && hasOut && !(prof && grade);
  if (profEl) {
    profEl.textContent = pending ? t('funScoreLoading') : funScoreLevelLabel(loc, 'prof', prof);
    profEl.title = pending ? t('funScoreLoading') : funStripLine(loc, 'prof', prof);
  }
  if (gradeEl) {
    gradeEl.textContent = pending ? t('funScoreLoading') : funScoreLevelLabel(loc, 'grade', grade);
    gradeEl.title = pending ? t('funScoreLoading') : funStripLine(loc, 'grade', grade);
  }
  if (prof && grade) {
    const pl = /** @type {'low'|'medium'|'high'} */ (prof);
    const gl = /** @type {'low'|'medium'|'high'} */ (grade);
    renderProfessorIconBar(profBar, profLevelToFive(pl));
    renderMeterBar(gradeBar, gl);
    if (profBar) {
      profBar.setAttribute('aria-label', funStripLine(loc, 'prof', pl));
      profBar.removeAttribute('aria-hidden');
    }
    if (gradeBar) {
      gradeBar.setAttribute('aria-label', funStripLine(loc, 'grade', gl));
      gradeBar.removeAttribute('aria-hidden');
    }
  } else {
    if (profBar) {
      profBar.innerHTML = '';
      profBar.removeAttribute('aria-label');
      profBar.setAttribute('aria-hidden', 'true');
    }
    if (gradeBar) {
      gradeBar.innerHTML = '';
      gradeBar.removeAttribute('aria-label');
      gradeBar.setAttribute('aria-hidden', 'true');
    }
  }
  if (card) {
    if (prof && grade) {
      card.dataset.prof = prof;
      card.dataset.grade = grade;
    } else {
      delete card.dataset.prof;
      delete card.dataset.grade;
    }
  }

  const metricsWrap = $('funMeterMetricsWrap');
  const emptyHint = $('funMeterEmptyHint');
  if (emptyHint) emptyHint.classList.toggle('funMeterCard__empty--hidden', hasOut);
  if (metricsWrap) metricsWrap.classList.toggle('funMeterCard__metrics--dim', !hasOut);
  renderDraftChecklist(draftScoreCache?.checks, draftScorePending && hasOut, hasOut);
  if (hasOut) updateCharCountDisplay(readTargetCharsFromForm(), outputEl.value);
}

/** @param {string} x */
function normalizeScoreTri(x) {
  return x === 'low' || x === 'medium' || x === 'high' ? x : 'medium';
}

function defaultDraftChecks() {
  return DRAFT_CHECK_KEYS.map((key) => ({ key, status: 'check' }));
}

function fallbackDraftScore() {
  return { ...DEFAULT_DRAFT_SCORE, checks: defaultDraftChecks() };
}

/** @param {unknown} x */
function normalizeDraftCheckStatus(x) {
  return x === 'ok' || x === 'warn' || x === 'check' ? x : 'check';
}

/** @param {unknown} raw */
function normalizeDraftChecks(raw) {
  const byKey = new Map();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = String(item?.key || '');
      if (!DRAFT_CHECK_KEYS.includes(key)) continue;
      byKey.set(key, {
        key,
        status: normalizeDraftCheckStatus(item?.status)
      });
    }
  }
  return DRAFT_CHECK_KEYS.map((key) => byKey.get(key) || { key, status: 'check' });
}

/** @param {{ key: string, status: string }[] | undefined} checks @param {boolean} pending @param {boolean} hasOut */
function renderDraftChecklist(checks, pending, hasOut) {
  const wrap = $('draftChecklist');
  const list = $('draftChecklistList');
  if (!wrap || !list) return;
  wrap.hidden = !hasOut;
  list.innerHTML = '';
  if (!hasOut) return;

  const loc = L();
  const items = pending ? defaultDraftChecks() : normalizeDraftChecks(checks);
  for (const item of items) {
    const status = normalizeDraftCheckStatus(item.status);
    const li = document.createElement('li');
    li.className = 'draftChecklist__item';

    const badge = document.createElement('span');
    badge.className = `draftChecklist__status draftChecklist__status--${status}`;
    badge.textContent = pending ? t('funScoreLoading') : draftCheckStatusLabel(loc, status);

    const label = document.createElement('span');
    label.textContent = draftCheckLabel(loc, item.key);

    li.append(badge, label);
    list.appendChild(li);
  }
}

/** @param {'low'|'medium'|'high'} level */
function meterFillCount(level) {
  if (level === 'low') return 2;
  if (level === 'high') return 5;
  return 3;
}

/** @param {'low'|'medium'|'high'} level */
function profLevelToFive(level) {
  if (level === 'low') return 1;
  if (level === 'high') return 5;
  return 3;
}

/** @param {HTMLElement | null} trackEl @param {'low'|'medium'|'high'} level */
function renderMeterBar(trackEl, level) {
  if (!trackEl) return;
  const n = meterFillCount(level);
  trackEl.innerHTML = '';
  for (let i = 0; i < 5; i += 1) {
    const seg = document.createElement('span');
    seg.className = i < n ? 'funMeterBarSeg funMeterBarSeg--on' : 'funMeterBarSeg';
    trackEl.appendChild(seg);
  }
}

/** @param {HTMLElement | null} trackEl @param {number} activeLevel */
function renderProfessorIconBar(trackEl, activeLevel) {
  if (!trackEl) return;
  trackEl.innerHTML = '';
  for (let i = 0; i < 5; i += 1) {
    const level = i + 1;
    const card = document.createElement('span');
    card.className = `funProfCard funProfCard--${level}`;
    if (level === activeLevel) card.classList.add('is-active');
    card.setAttribute('aria-hidden', 'true');
    const crop = document.createElement('span');
    crop.className = 'funProfCrop';
    crop.style.setProperty('--prof-x', String((level - 1) * -44));
    card.appendChild(crop);
    trackEl.appendChild(card);
  }
}

async function fetchDraftScore(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < 40) {
    draftScorePending = false;
    draftScoreCache = fallbackDraftScore();
    renderFunStrip();
    return;
  }
  draftScorePending = true;
  renderFunStrip();
  try {
    const res = await fetch('/api/draft-score', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        theme: themeEl.value.trim(),
        outputLang: outputLangEl.value
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      draftScoreCache = fallbackDraftScore();
      return;
    }
    draftScoreCache = {
      prof: normalizeScoreTri(data.professor_alert),
      grade: normalizeScoreTri(data.grade_feeling),
      checks: normalizeDraftChecks(data.checks)
    };
  } catch {
    draftScoreCache = fallbackDraftScore();
  } finally {
    draftScorePending = false;
    renderFunStrip();
  }
}

function syncJapaneseOutputUi() {
  const ja = outputLangEl.value === 'ja';
  if (jaSentenceFieldWrap) jaSentenceFieldWrap.hidden = !ja;
  if (japaneseSentenceStyleEl) japaneseSentenceStyleEl.disabled = !ja;
}

function syncOutputToolbar() {
  const hasDraft = (outputEl?.value || '').trim().length > 0;
  if (varyBtn) varyBtn.disabled = !hasDraft;
  if (copyBtn) copyBtn.disabled = !hasDraft;
}

function hideProUpsell() {
  if (proUpsell) proUpsell.hidden = true;
}

function showProUpsell(kind) {
  if (isProPlan() || !proUpsell) return;
  const lead =
    kind === 'image'
      ? t('freeLimitImage')
      : kind === 'chars'
        ? t('charsOverFreeLimit')
        : t('freeLimitText');
  if (proUpsellText) {
    proUpsellText.textContent = `${lead} ${t('proUpsellLead')}`;
  }
  proUpsell.hidden = false;
}

async function startProCheckout() {
  if (currentUser) {
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setAuthStatus(data.error || t('checkoutFail'), 'authBanner--err');
    } catch (_e) {
      setAuthStatus(t('checkoutFail'), 'authBanner--err');
    }
    return;
  }
  const proceed = window.confirm(t('proLoginNeedAccount'));
  if (!proceed) return;
  setAuthStatus(t('proLoginRedirecting'), 'authBanner--ok');
  window.location.href = '/login.html?intent=pro&stay=1';
}

function syncProUi() {
  const isPro = isProPlan();
  if (proCompareCard) proCompareCard.hidden = isPro;
  if (charsProBadge) charsProBadge.hidden = isPro;
  if (qualityProBadge) qualityProBadge.hidden = isPro;
  if (isPro) hideProUpsell();
}

function isProPlan() {
  return currentUser?.plan === 'pro';
}

function charLimitsFromUsage() {
  const u = currentUser?.usage ?? anonymousUsage;
  const isPro = isProPlan();
  return {
    min: Number(u?.charMin) || 100,
    max: Number(u?.charMax) || (isPro ? 10000 : 4000)
  };
}

function applyQualityLock() {
  const isPro = isProPlan();
  const highOpt = qualityEl.querySelector('option[value="high"]');
  if (highOpt) {
    highOpt.disabled = !isPro;
    highOpt.title = isPro ? '' : 'Pro';
  }
  if (!isPro && qualityEl.value === 'high') qualityEl.value = 'normal';
  syncProUi();
}

function applyCharLimitLock({ clamp = true } = {}) {
  const isPro = isProPlan();
  const { min, max } = charLimitsFromUsage();
  patchCharsHint(L(), isPro);
  if (targetCharsEl) {
    targetCharsEl.min = String(min);
    targetCharsEl.max = String(max);
    if (clamp) {
      const n = Number.parseInt(targetCharsEl.value, 10);
      if (Number.isFinite(n)) {
        if (n > max) targetCharsEl.value = String(max);
        else if (n < min) targetCharsEl.value = String(min);
      }
    }
  }
}

function refreshHeader() {
  const loc = L();
  if (currentUser) {
    planBadgeEl.textContent = planBadgeText(loc, currentUser.plan === 'pro' ? 'pro' : 'free');
    const u = currentUser.usage;
    usageLineEl.textContent = formatUsageLine(loc, {
      plan: currentUser.plan === 'pro' ? 'pro' : 'free',
      text: u?.text,
      image: u?.image,
      textLimit: u?.textLimit,
      imageLimit: u?.imageLimit
    });
    linkLogin.hidden = true;
    linkPro.hidden = true;
    logoutBtn.hidden = false;
    upgradeBtn.hidden = currentUser.plan === 'pro';
    upgradeBtn.disabled = currentUser.plan === 'pro';
    patchUpgradeLabel(loc, currentUser.plan);
    const showBilling = currentUser.plan === 'pro' || currentUser.hasBilling;
    if (billingBtn) {
      billingBtn.hidden = !showBilling;
      billingBtn.disabled = !showBilling;
    }
    if (accountPanel) accountPanel.hidden = false;
    if (accountDeletePwWrap) {
      accountDeletePwWrap.hidden = !currentUser.hasPassword;
    }
    if (footAuthLinks) footAuthLinks.hidden = true;
  } else {
    planBadgeEl.textContent = planBadgeText(loc, 'free');
    const a = anonymousUsage;
    usageLineEl.textContent = formatUsageLine(loc, {
      plan: null,
      text: a?.text,
      image: a?.image,
      textLimit: a?.textLimit,
      imageLimit: a?.imageLimit
    });
    linkLogin.hidden = false;
    linkPro.hidden = false;
    logoutBtn.hidden = true;
    upgradeBtn.hidden = true;
    if (billingBtn) billingBtn.hidden = true;
    if (accountPanel) accountPanel.hidden = true;
    if (footAuthLinks) {
      footAuthLinks.hidden = false;
      if (footLogin) footLogin.setAttribute('href', '/login.html?stay=1');
      if (footPro) footPro.setAttribute('href', '/login.html?intent=pro&stay=1');
    }
    if (linkLogin) linkLogin.setAttribute('href', '/login.html?stay=1');
    if (linkPro) linkPro.setAttribute('href', '/login.html?intent=pro&stay=1');
  }
  applyQualityLock();
  applyCharLimitLock();
  syncProUi();
}

function validateTargetChars() {
  const { min, max } = charLimitsFromUsage();
  const n = Number.parseInt(targetCharsEl?.value ?? '', 10);
  if (!Number.isFinite(n) || n < min) {
    setStatus(t('charsBelowMin'), 'status--err');
    return false;
  }
  if (n > max) {
    if (!isProPlan()) showProUpsell('chars');
    setStatus(t(isProPlan() ? 'charsOverMaxLimit' : 'charsOverFreeLimit'), 'status--err');
    return false;
  }
  hideProUpsell();
  return true;
}

function currentSettingsFromForm() {
  const targetChars = Number(targetCharsEl.value || 800);
  return {
    theme: themeEl.value.trim(),
    referenceMaterial: (referenceMaterialEl?.value || '').trim().slice(0, MAX_REFERENCE_CHARS),
    tone: toneEl.value,
    studentMode: studentModeEl.value,
    targetChars: Number.isFinite(targetChars) ? targetChars : 800,
    quality: qualityEl.value,
    outputLang: outputLangEl.value,
    japaneseStyle: outputLangEl.value === 'ja' ? (japaneseSentenceStyleEl?.value ?? 'desu') : 'desu',
    outputPreset: outputPresetEl.value
  };
}

function applySettingsFromDraft(settings) {
  if (!settings) return;
  if (typeof settings.theme === 'string') themeEl.value = settings.theme;
  if (typeof settings.referenceMaterial === 'string' && referenceMaterialEl) {
    referenceMaterialEl.value = settings.referenceMaterial;
  }
  if (settings.tone) toneEl.value = settings.tone;
  if (settings.studentMode) studentModeEl.value = settings.studentMode;
  if (settings.targetChars != null) targetCharsEl.value = String(settings.targetChars);
  if (settings.quality) qualityEl.value = settings.quality;
  if (settings.outputLang) outputLangEl.value = settings.outputLang;
  if (settings.outputPreset) outputPresetEl.value = settings.outputPreset;
  if (japaneseSentenceStyleEl && settings.japaneseStyle) {
    japaneseSentenceStyleEl.value = settings.japaneseStyle;
  }
  syncJapaneseOutputUi();
  applyCharLimitLock();
  applyQualityLock();
}

function readLocalDrafts() {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalDrafts(list) {
  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(list.slice(0, MAX_LOCAL_DRAFTS)));
}

function mergedDraftsForUi() {
  const byId = new Map();
  for (const d of readLocalDrafts()) {
    if (d?.id) byId.set(d.id, d);
  }
  for (const d of serverDraftsCache) {
    if (d?.id) byId.set(d.id, d);
  }
  return Array.from(byId.values()).sort((a, b) =>
    String(b.savedAt || '').localeCompare(String(a.savedAt || ''))
  );
}

function refreshHistoryDropdown() {
  if (!historySelect) return;
  const prev = historySelect.value;
  historySelect.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = t('historyPlaceholder');
  historySelect.appendChild(opt0);
  for (const d of mergedDraftsForUi()) {
    const opt = document.createElement('option');
    opt.value = d.id;
    const pv = (d.preview || d.settings?.theme || '').replace(/\s+/g, ' ').trim().slice(0, 48);
    const dt = (d.savedAt || '').slice(0, 16).replace('T', ' ');
    opt.textContent = dt ? `${dt} — ${pv || '…'}` : pv || d.id;
    historySelect.appendChild(opt);
  }
  if (prev && [...historySelect.options].some((o) => o.value === prev)) {
    historySelect.value = prev;
  }
}

async function syncServerDrafts() {
  if (!currentUser) {
    serverDraftsCache = [];
    refreshHistoryDropdown();
    return;
  }
  try {
    const res = await fetch('/api/drafts', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    serverDraftsCache = Array.isArray(data.drafts) ? data.drafts : [];
  } catch {
    serverDraftsCache = [];
  }
  refreshHistoryDropdown();
}

async function saveDraftHistory(text) {
  const preview = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!preview) return;
  const entry = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    preview,
    settings: currentSettingsFromForm()
  };
  const local = readLocalDrafts().filter((d) => d.id !== entry.id);
  local.unshift(entry);
  writeLocalDrafts(local);
  if (currentUser) {
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ draft: entry })
      });
      await syncServerDrafts();
      return;
    } catch {
      /* local only */
    }
  }
  refreshHistoryDropdown();
}

async function loadReferenceFromUrl() {
  const url = (referenceUrlEl?.value || '').trim();
  if (!url) {
    setStatus(t('urlNeedUrl'), 'status--err');
    referenceUrlEl?.focus();
    return;
  }
  if (referenceUrlLoad) referenceUrlLoad.disabled = true;
  setStatus(t('urlLoading'), '');
  try {
    const res = await fetch('/api/fetch-reference-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('urlFail'));
    const title = String(data.title || '').trim();
    const text = String(data.text || '').trim();
    const src = String(data.url || url).trim();
    const header = title ? `【${title}】\n${src}` : src;
    const block = `${header}\n\n${text}`;
    const cur = (referenceMaterialEl?.value || '').trim();
    referenceMaterialEl.value = cur ? `${cur}\n\n---\n\n${block}` : block;
    if (referenceMaterialEl.value.length > MAX_REFERENCE_CHARS) {
      referenceMaterialEl.value = referenceMaterialEl.value.slice(0, MAX_REFERENCE_CHARS);
    }
    setStatus(t('urlOk'), 'status--ok');
  } catch (e) {
    setStatus(e instanceof Error ? e.message : t('urlFail'), 'status--err');
  } finally {
    if (referenceUrlLoad) referenceUrlLoad.disabled = false;
  }
}

function perFileCapAfterAdd() {
  return reportImages.length >= 1 ? MAX_EACH_WHEN_MULTI_BYTES : MAX_SINGLE_IMAGE_BYTES;
}

function syncReportImageList() {
  if (!reportImageList) return;
  reportImageList.innerHTML = '';
  for (const item of reportImages) {
    const wrap = document.createElement('div');
    wrap.className = 'reportImageThumbWrap';
    const img = document.createElement('img');
    img.src = item.dataUrl;
    img.alt = '';
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'reportImageThumbRemove';
    rm.setAttribute('aria-label', 'remove');
    rm.textContent = '×';
    rm.addEventListener('click', () => {
      reportImages = reportImages.filter((x) => x.id !== item.id);
      syncReportImageList();
      if (reportImageClear) reportImageClear.hidden = reportImages.length === 0;
    });
    wrap.appendChild(img);
    wrap.appendChild(rm);
    reportImageList.appendChild(wrap);
  }
  if (reportImageClear) reportImageClear.hidden = reportImages.length === 0;
}

function quickTweakButtons() {
  return Array.from(document.querySelectorAll('.quickTweakBtn'));
}

function setGenerateControlsDisabled(disabled) {
  const locked = disabled || isGenerateOnCooldown();
  generateBtn.disabled = locked;
  for (const b of quickTweakButtons()) b.disabled = locked;
  if (varyBtn) {
    if (locked) {
      varyBtn.disabled = true;
    } else {
      syncOutputToolbar();
    }
  }
}

/** @param {{ rewriteIntent?: string, revisionBase?: string }} [opts] */
function buildGenerateBody(opts = {}) {
  const rewriteIntent = opts.rewriteIntent || '';
  const isRephrase = rewriteIntent === 'rephrase';
  const isRevision =
    ['natural', 'shorter', 'student', 'intl', 'trim_chars'].includes(rewriteIntent) ||
    (isRephrase && Boolean(opts.revisionBase));

  const theme = themeEl.value.trim();
  const ref = (referenceMaterialEl?.value || '').trim();
  const targetChars = Number(targetCharsEl.value || 800);
  const body = {
    theme,
    referenceMaterial: ref.length > MAX_REFERENCE_CHARS ? ref.slice(0, MAX_REFERENCE_CHARS) : ref,
    tone: toneEl.value,
    studentMode: studentModeEl.value,
    quality: qualityEl.value,
    targetChars: Number.isFinite(targetChars) ? targetChars : 800,
    outputLang: outputLangEl.value,
    japaneseStyle: outputLangEl.value === 'ja' ? (japaneseSentenceStyleEl?.value ?? 'desu') : 'desu',
    outputPreset: outputPresetEl.value,
    variation: isRephrase
  };
  if (rewriteIntent) body.rewriteIntent = rewriteIntent;
  if (isRevision && opts.revisionBase) {
    const rb = opts.revisionBase;
    body.revisionBase = rb.length > 20000 ? rb.slice(0, 20000) : rb;
  }
  if (!isRevision) {
    if (reportImages.length === 1) {
      body.reportImageDataUrl = reportImages[0].dataUrl;
    } else if (reportImages.length > 1) {
      body.reportImageDataUrls = reportImages.map((x) => x.dataUrl);
    }
  }
  return body;
}

/** @param {{ rewriteIntent?: string, revisionBase?: string, charLimitRetry?: boolean }} [opts] */
async function runGenerate(opts = {}) {
  const rewriteIntent = opts.rewriteIntent || '';
  const isTrimChars = rewriteIntent === 'trim_chars';
  const isTweak = ['natural', 'shorter', 'student', 'intl'].includes(rewriteIntent);
  const isRephrase = rewriteIntent === 'rephrase';

  if (isTrimChars) {
    const revisionBase = (opts.revisionBase || outputEl?.value || '').trim();
    if (revisionBase.length < 40) {
      setStatus(t('tweakNeedPreview'), 'status--err');
      return;
    }
    opts = { ...opts, revisionBase };
  } else if (isTweak) {
    const revisionBase = (outputEl?.value || '').trim();
    if (revisionBase.length < MIN_TWEAK_PREVIEW_CHARS) {
      setStatus(t('tweakNeedPreview'), 'status--err');
      return;
    }
    opts = { ...opts, revisionBase };
  } else if (isRephrase) {
    const revisionBase = (outputEl?.value || '').trim();
    if (revisionBase.length >= MIN_TWEAK_PREVIEW_CHARS) {
      opts = { ...opts, revisionBase };
    }
  } else {
    const theme = themeEl.value.trim();
    const ref = (referenceMaterialEl?.value || '').trim();
    if (!theme && reportImages.length === 0 && !ref) {
      setStatus(t('themeOrImageRequired'), 'status--err');
      return;
    }
    if (!validateTargetChars()) return;
  }

  if (isGenerateOnCooldown()) {
    updateGenerateCooldownUi();
    return;
  }

  setStepLoading(true);
  if (isTrimChars && opts.charLimitRetry) {
    setStatus(t('charsOverTargetRetrying'), '');
  } else {
    setStatus('', '');
  }
  setGenerateControlsDisabled(true);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(buildGenerateBody(opts))
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === 'CHAR_LIMIT_PRO') {
        showProUpsell('chars');
        setStatus(t('charsOverFreeLimit'), 'status--err');
      } else if (data.code === 'CHAR_LIMIT') {
        setStatus(t('charsOverMaxLimit'), 'status--err');
      } else if (data.code === 'FREE_LIMIT_TEXT') {
        showProUpsell('text');
        setStatus(t('freeLimitText'), 'status--err');
      } else if (data.code === 'AI_RATE_LIMIT') {
        const msg = data.error && !looksLikeGeminiQuotaError(data.error) ? data.error : t('aiBusy');
        setStatus(msg, 'status--err');
        startGenerateCooldown(Number(data.retryAfterSeconds) || 45);
        return;
      } else {
        setStatus(sanitizeClientErrorMessage(data.error) || t('genFail'), 'status--err');
      }
      return;
    }

    hideProUpsell();

    let text = normalizeGeneratedText(data.text || '');
    const targetChars = Number(data.targetChars) || readTargetCharsFromForm();
    const charCount = Number.isFinite(Number(data.charCount))
      ? Number(data.charCount)
      : countTextChars(text);

    outputEl.value = text;
    updateCharCountDisplay(targetChars, text);
    syncOutputToolbar();
    lastGeneratedTargetChars = targetChars;
    renderLastSettingsSummary(targetChars);
    draftScoreCache = null;
    draftScorePending = true;
    renderFunStrip();
    await fetchDraftScore(outputEl.value);
    if (!isTweak && !isTrimChars) void saveDraftHistory(outputEl.value);

    if (data.adjusted) {
      setStatus(t('charsAutoAdjusted'), 'status--ok');
    } else {
      setStatus(t('ok'), 'status--ok');
    }
    setCurrentStep(3);
    await loadMe();
  } catch (_e) {
    setStatus(t('genFail'), 'status--err');
  } finally {
    setStepLoading(false);
    if (!isGenerateOnCooldown()) {
      setGenerateControlsDisabled(false);
    }
  }
}

async function loadMe() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('me');
    const data = await res.json();
    currentUser = data.user ?? null;
    anonymousUsage = data.anonymous?.usage ?? null;
    const preferred = currentUser?.locale ? setLocale(currentUser.locale) : L();
    localeEl.value = preferred;
    applyIndexPage(preferred);
    renderFunStrip();
    refreshHeader();
    syncJapaneseOutputUi();
    syncOutputToolbar();
    await syncServerDrafts();
  } catch (_e) {
    setAuthStatus(t('sessionLoadFail'), 'authBanner--err');
  }
}

async function syncUserLocale(loc) {
  if (!currentUser) return;
  try {
    await fetch('/api/me/locale', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: loc })
    });
  } catch {
    // Keep local preference, but let users know it may not sync across devices.
    setStatus(t('sessionLoadFail'), 'status--err');
  }
}

function initLocale() {
  const loc = getLocale();
  localeEl.value = loc;
  document.documentElement.lang = documentHtmlLang(loc);
  applyIndexPage(loc);
  renderFunStrip();
  syncJapaneseOutputUi();
  syncOutputToolbar();
  applyCharLimitLock();
  refreshHistoryDropdown();
  syncProUi();
}

referenceUrlLoad?.addEventListener('click', () => {
  void loadReferenceFromUrl();
});

for (const btn of sampleButtons) {
  btn.addEventListener('click', () => {
    applyDraftSample(btn.getAttribute('data-sample-key') || '');
  });
}

referenceUrlEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    void loadReferenceFromUrl();
  }
});

historySelect?.addEventListener('change', () => {
  const id = historySelect.value;
  if (!id) return;
  const d = mergedDraftsForUi().find((x) => x.id === id);
  if (!d) return;
  applySettingsFromDraft(d.settings);
  setStatus(t('historyRestored'), 'status--ok');
});

targetCharsEl?.addEventListener('input', () => {
  // Keep editing smooth: avoid snapping to min/max while typing.
  applyCharLimitLock({ clamp: false });
  if ((outputEl?.value || '').trim()) {
    updateCharCountDisplay(readTargetCharsFromForm(), outputEl.value);
  }
});

outputEl?.addEventListener('input', () => {
  const text = outputEl.value;
  updateCharCountDisplay(readTargetCharsFromForm(), text);
  syncOutputToolbar();
  if (!(text || '').trim()) {
    draftScoreCache = null;
    renderFunStrip();
  }
});

localeEl.addEventListener('change', () => {
  const loc = setLocale(localeEl.value);
  localeEl.value = loc;
  void syncUserLocale(loc);
  applyIndexPage(loc);
  renderFunStrip();
  refreshHeader();
  syncJapaneseOutputUi();
  syncOutputToolbar();
  applyCharLimitLock();
  refreshHistoryDropdown();
  if (lastSettingsWrap && !lastSettingsWrap.hidden) {
    renderLastSettingsSummary(lastGeneratedTargetChars);
  }
  if ((outputEl?.value || '').trim()) {
    updateCharCountDisplay(readTargetCharsFromForm(), outputEl.value);
  }
});

outputLangEl.addEventListener('change', syncJapaneseOutputUi);

for (const tab of stepTabs) {
  tab.addEventListener('click', () => {
    const step = Number(tab.getAttribute('data-step-tab'));
    if (step === 3 && !(outputEl?.value || '').trim()) return;
    setCurrentStep(step);
  });
}

step1NextBtn?.addEventListener('click', () => {
  if (!(themeEl?.value || '').trim()) {
    setStatus(t('stepThemeRequired'), 'status--err');
    themeEl?.focus();
    return;
  }
  setStatus('', '');
  setCurrentStep(2);
});
step2BackBtn?.addEventListener('click', () => setCurrentStep(1));
step3BackBtn?.addEventListener('click', () => setCurrentStep(2));

reportImagePick?.addEventListener('click', () => {
  reportImageInput?.click();
});

reportImageInput?.addEventListener('change', async () => {
  const files = reportImageInput.files;
  if (!files?.length) return;

  for (const file of Array.from(files)) {
    if (reportImages.length >= MAX_REPORT_IMAGES) {
      setStatus(t('imageMaxCount'), 'status--err');
      break;
    }
    const currentTotal = reportImages.reduce((sum, x) => sum + x.size, 0);
    if (currentTotal + file.size > MAX_REPORT_IMAGES_TOTAL_BYTES) {
      setStatus(t('imageTotalTooLarge'), 'status--err');
      break;
    }
    const willHaveMulti = reportImages.length >= 1;
    const limit = willHaveMulti ? MAX_EACH_WHEN_MULTI_BYTES : MAX_SINGLE_IMAGE_BYTES;
    if (willHaveMulti) {
      for (const ex of reportImages) {
        if (ex.size > MAX_EACH_WHEN_MULTI_BYTES) {
          setStatus(t('imageTooLargeMulti'), 'status--err');
          reportImageInput.value = '';
          return;
        }
      }
    }
    if (file.size > limit) {
      setStatus(willHaveMulti ? t('imageTooLargeMulti') : t('imageTooLarge'), 'status--err');
      break;
    }
    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === 'string' ? reader.result : null;
        if (url) reportImages.push({ id: crypto.randomUUID(), dataUrl: url, size: file.size });
        syncReportImageList();
        resolve();
      };
      reader.onerror = () => {
        setStatus(t('genFail'), 'status--err');
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
  reportImageInput.value = '';
});

reportImageClear?.addEventListener('click', () => {
  reportImages = [];
  syncReportImageList();
  if (reportImageInput) reportImageInput.value = '';
});

generateBtn?.addEventListener('click', () => void runGenerate({}));
regenerateBtn?.addEventListener('click', () => void runGenerate({}));
varyBtn?.addEventListener('click', () => void runGenerate({ rewriteIntent: 'rephrase' }));

const tweakBindings = [
  ['tweakNatural', 'natural'],
  ['tweakShorter', 'shorter']
];
for (const [elId, intent] of tweakBindings) {
  const el = $(elId);
  if (el) el.addEventListener('click', () => void runGenerate({ rewriteIntent: intent }));
}

clearBtn?.addEventListener('click', () => {
  outputEl.value = '';
  updateCharCountDisplay(readTargetCharsFromForm(), '');
  syncOutputToolbar();
  if (lastSettingsWrap) lastSettingsWrap.hidden = true;
  draftScoreCache = null;
  renderFunStrip();
  setStatus('', '');
});

tweakHeadingBtn?.addEventListener('click', () => {
  if (outputPresetEl) outputPresetEl.value = 'word_heading';
  void runGenerate({ rewriteIntent: 'rephrase' });
});

tweakWordBtn?.addEventListener('click', () => {
  if (outputPresetEl) outputPresetEl.value = 'word_heading';
  void runGenerate({ rewriteIntent: 'rephrase' });
});

copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value);
    setStatus(t('copyOk'), 'status--ok');
  } catch (_e) {
    setStatus(t('copyFail'), 'status--err');
  }
});

logoutBtn?.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
  } catch (_e) {
    setAuthStatus(t('genFail'), 'authBanner--err');
  }
});

upgradeBtn?.addEventListener('click', () => void startProCheckout());

proCompareCta?.addEventListener('click', () => void startProCheckout());
proUpsellBtn?.addEventListener('click', () => void startProCheckout());

billingBtn?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/billing/create-portal-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setAuthStatus(data.error || t('billingFail'), 'authBanner--err');
  } catch (_e) {
    setAuthStatus(t('billingFail'), 'authBanner--err');
  }
});

deleteAccountBtn?.addEventListener('click', async () => {
  if (!currentUser) return;
  if (!window.confirm(t('deleteAccountConfirm'))) return;
  const confirmEmail = accountDeleteEmail?.value.trim() || '';
  const password = accountDeletePassword?.value || '';
  deleteAccountBtn.disabled = true;
  try {
    const res = await fetch('/api/auth/delete-account', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmEmail, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('genFail'));
    window.location.href = '/login.html';
  } catch (e) {
    setAuthStatus(e instanceof Error ? e.message : String(e), 'authBanner--err');
  } finally {
    deleteAccountBtn.disabled = false;
  }
});

if (imageGenerateBtn && imagePromptEl && imageResultEl) {
  imageGenerateBtn.addEventListener('click', async () => {
    const prompt = imagePromptEl.value.trim();
    if (!prompt) {
      setAuthStatus(t('imgPrompt'), 'authBanner--err');
      return;
    }
    setAuthStatus(t('imgGen'), '');
    imageGenerateBtn.disabled = true;
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'FREE_LIMIT_IMAGE') {
          showProUpsell('image');
          setAuthStatus(t('freeLimitImage'), 'authBanner--err');
        } else {
          setAuthStatus(data.error || t('imgFail'), 'authBanner--err');
        }
        return;
      }
      if (data.imageBase64) {
        imageResultEl.src = `data:image/png;base64,${data.imageBase64}`;
        imageResultEl.hidden = false;
      }
      setAuthStatus(t('imgOk'), 'authBanner--ok');
      await loadMe();
    } catch (_e) {
      setAuthStatus(t('imgFail'), 'authBanner--err');
    } finally {
      imageGenerateBtn.disabled = false;
    }
  });
}

const params = new URLSearchParams(window.location.search);
if (params.get('payment') === 'success') {
  window.history.replaceState({}, '', window.location.pathname);
  setAuthStatus(t('paySuccess'), 'authBanner--ok');
} else if (params.get('payment') === 'cancel') {
  window.history.replaceState({}, '', window.location.pathname);
  setAuthStatus(t('payCancel'), '');
}

initLocale();
syncJapaneseOutputUi();
syncOutputToolbar();
syncReportImageList();
refreshHistoryDropdown();
setCurrentStep(1);
loadMe();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) void loadMe();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void loadMe();
});
