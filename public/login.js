import {
  getLocale,
  setLocale,
  applyLoginPage,
  applyLoginMode,
  patchLoginGoogleHint,
  loginMsg,
  documentHtmlLang
} from './i18n.js';

const $ = (id) => document.getElementById(id);

const emailEl = $('email');
const passwordEl = $('password');
const submitBtn = $('submitBtn');
const statusEl = $('status');
const togglePw = $('togglePw');
const tabSignin = $('tabSignin');
const tabSignup = $('tabSignup');
const authPanel = $('authPanel');
const googleBtn = $('googleBtn');
const forgotLink = $('forgotLink');
const forgotRow = $('forgotRow');
const switchMode = $('switchMode');
const loginLocale = $('loginLocale');
const proIntentBanner = $('proIntentBanner');

const params = new URLSearchParams(window.location.search);
const intentPro = params.get('intent') === 'pro';
const stayOnPage = params.get('stay') === '1';

let mode = 'signin';
let googleEnabled = false;

function loc() {
  return getLocale();
}

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = `loginStatus ${kind}`.trim();
}

function applyMode() {
  applyLoginMode(loc(), mode);
  patchLoginGoogleHint(loc(), mode, googleEnabled ? true : false);
  forgotRow.hidden = mode !== 'signin';
  passwordEl.setAttribute('autocomplete', mode === 'signin' ? 'current-password' : 'new-password');
}

function setMode(next) {
  mode = next;
  applyMode();
  setStatus('');
  const signin = next === 'signin';
  if (tabSignin) {
    tabSignin.classList.toggle('authModeTab--active', signin);
    tabSignin.setAttribute('aria-selected', String(signin));
  }
  if (tabSignup) {
    tabSignup.classList.toggle('authModeTab--active', !signin);
    tabSignup.setAttribute('aria-selected', String(!signin));
  }
}

/** @param {{ locale?: string|null }|null|undefined} user */
function applyUserLocalePreference(user) {
  const locale = String(user?.locale || '').trim();
  if (!locale) return;
  const l = setLocale(locale);
  document.documentElement.lang = documentHtmlLang(l);
  if (loginLocale) loginLocale.value = l;
  applyLoginPage(l);
  if (proIntentBanner) proIntentBanner.hidden = !intentPro;
  applyMode();
  if (togglePw) togglePw.textContent = loginMsg(l, 'toggleHide');
}

async function syncLocaleForLoggedInUser(locale) {
  try {
    await fetch('/api/me/locale', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale })
    });
  } catch {
    /* ignore on login page */
  }
}

function initLocale() {
  const l = loc();
  document.documentElement.lang = documentHtmlLang(l);
  if (loginLocale) loginLocale.value = l;
  applyLoginPage(l);
  if (proIntentBanner) proIntentBanner.hidden = !intentPro;
  applyMode();
  if (togglePw) togglePw.textContent = loginMsg(l, 'toggleHide');
}

if (loginLocale) {
  loginLocale.addEventListener('change', () => {
    const l = setLocale(loginLocale.value);
    void syncLocaleForLoggedInUser(l);
    document.documentElement.lang = documentHtmlLang(l);
    applyLoginPage(l);
    if (proIntentBanner) proIntentBanner.hidden = !intentPro;
    applyMode();
    if (togglePw) togglePw.textContent = loginMsg(l, 'toggleHide');
  });
}

async function loadAuthConfig() {
  try {
    const res = await fetch('/api/auth/config', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    googleEnabled = Boolean(data.googleEnabled);
  } catch {
    googleEnabled = false;
  }
  applyMode();
}

function handleOAuthError() {
  const err = params.get('error');
  if (!err || !err.startsWith('google')) return;
  const key =
    err === 'google_denied'
      ? 'googleAuthDenied'
      : err === 'google_disabled'
        ? 'googleAuthDisabled'
        : 'googleAuthFail';
  setStatus(loginMsg(loc(), key), 'error');
  window.history.replaceState({}, '', window.location.pathname + (intentPro ? '?intent=pro' : ''));
}

function showLoggedInOnLoginPage(user) {
  if (authPanel) authPanel.hidden = true;
  setStatus(loginMsg(loc(), 'alreadyLoggedIn'), 'ok');
  const back = document.getElementById('backHome');
  if (back) back.setAttribute('href', '/app');
}

async function redirectIfLoggedIn() {
  const res = await fetch('/api/me', { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!data.user) return;
  applyUserLocalePreference(data.user);
  if (intentPro && data.user.plan !== 'pro') {
    const r = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      credentials: 'include'
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setStatus(d?.error || loginMsg(loc(), 'checkoutFail'), 'error');
    if (stayOnPage) showLoggedInOnLoginPage(data.user);
    return;
  }
  if (stayOnPage) {
    showLoggedInOnLoginPage(data.user);
    return;
  }
  window.location.href = '/app';
}

async function startCheckout() {
  const res = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || loginMsg(loc(), 'checkoutFail'));
  if (data.url) window.location.href = data.url;
}

async function submit() {
  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();
  if (!email || !password) {
    setStatus(loginMsg(loc(), 'valBoth'), 'error');
    if (!email) emailEl.focus();
    else passwordEl.focus();
    return;
  }
  if (mode === 'signup' && password.length < 6) {
    setStatus(loginMsg(loc(), 'valPw6'), 'error');
    passwordEl.focus();
    return;
  }

  const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/signup';
  submitBtn.disabled = true;
  setStatus(mode === 'signin' ? loginMsg(loc(), 'stIn') : loginMsg(loc(), 'stUp'), '');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || loginMsg(loc(), 'authFail'));
    passwordEl.value = '';
    const meRes = await fetch('/api/me', { credentials: 'include' });
    const me = await meRes.json().catch(() => ({}));
    if (!me.user) {
      throw new Error(loginMsg(loc(), 'sessionFail'));
    }
    applyUserLocalePreference(me.user);
    if (intentPro && data.user?.plan !== 'pro') {
      setStatus(loginMsg(loc(), 'stCheckout'), 'ok');
      await startCheckout();
      return;
    }
    if (stayOnPage) {
      showLoggedInOnLoginPage(me.user);
      return;
    }
    setStatus(loginMsg(loc(), 'stTop'), 'ok');
    window.location.href = '/app';
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

togglePw.addEventListener('click', () => {
  const show = passwordEl.type === 'password';
  passwordEl.type = show ? 'text' : 'password';
  togglePw.textContent = show ? loginMsg(loc(), 'toggleShow') : loginMsg(loc(), 'toggleHide');
  togglePw.setAttribute('aria-pressed', String(show));
});

tabSignin.addEventListener('click', () => setMode('signin'));
tabSignup.addEventListener('click', () => setMode('signup'));

tabSignin.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    tabSignup.focus();
    setMode('signup');
  }
});
tabSignup.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    tabSignin.focus();
    setMode('signin');
  }
});

switchMode.addEventListener('click', () => {
  setMode(mode === 'signin' ? 'signup' : 'signin');
});

submitBtn.addEventListener('click', submit);

emailEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    passwordEl.focus();
  }
});

passwordEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  }
});

forgotLink.addEventListener('click', (e) => {
  if (forgotLink.getAttribute('href') === '#') {
    e.preventDefault();
    setStatus(loginMsg(loc(), 'forgotMsg'), '');
  }
});

googleBtn.addEventListener('click', () => {
  if (!googleEnabled) {
    setStatus(mode === 'signin' ? loginMsg(loc(), 'gIn') : loginMsg(loc(), 'gUp'), 'error');
    return;
  }
  const q = intentPro ? '?intent=pro' : '';
  window.location.href = `/api/auth/google${q}`;
});

initLocale();
handleOAuthError();
loadAuthConfig().then(() => redirectIfLoggedIn().catch(() => setStatus(loginMsg(loc(), 'sessionFail'), 'error')));
