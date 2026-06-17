/** @typedef {'ja'|'en'|'zh'|'vi'|'ne'|'hi'|'id'} Locale */

const STORAGE_KEY = 'repotasu_locale';

/** @type {Record<Locale, true>} */
const VALID = { ja: true, en: true, zh: true, vi: true, ne: true, hi: true, id: true };

/** @param {string} raw @returns {Locale} */
function normalizeLocale(raw) {
  if (raw in VALID) return /** @type {Locale} */ (raw);
  return 'ja';
}

export function getLocale() {
  return normalizeLocale(localStorage.getItem(STORAGE_KEY) || 'ja');
}

/** @param {string} loc */
export function setLocale(loc) {
  const l = normalizeLocale(loc);
  localStorage.setItem(STORAGE_KEY, l);
  document.documentElement.lang = documentHtmlLang(l);
  return l;
}

/** @param {Locale} loc */
export function documentHtmlLang(loc) {
  if (loc === 'zh') return 'zh-Hans';
  return loc;
}

/** @param {Locale} loc */
export function applyIndexPage(loc) {
  const S = STR[loc] ?? STR.ja;
  document.documentElement.lang = documentHtmlLang(loc);
  const g = (id) => document.getElementById(id);

  document.title = S.pageTitle;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', S.metaDesc);

  const set = (id, text) => {
    const el = g(id);
    if (el) el.textContent = text;
  };

  set('tagline', S.tagline);
  set('v1', S.value1);
  set('v2', S.value2);
  set('v3', S.value3);
  const funMeter = g('funMeterRow');
  if (funMeter) funMeter.setAttribute('aria-label', S.funMeterAria);
  set('funMeterCardTitle', S.funMeterCardTitle);
  set('funMeterBadgePill', S.funMeterTag);
  const emptyHint = g('funMeterEmptyHint');
  if (emptyHint) emptyHint.textContent = S.funMeterAfterGen;
  set('draftChecklistTitle', S.draftChecklistTitle);
  set('funProfLabel', S.funProfTitle);
  set('funGradeLabel', S.funGradeTitle);
  set('funDisclaimer', S.funScoreDisclaimer);
  set('localeLabel', S.localeLabel);
  set('linkLogin', S.login);
  set('linkPro', S.proShort);
  const up = g('upgradeBtn');
  if (up && !up.disabled && up.textContent !== S.upgradeDone) up.textContent = S.upgrade;
  set('logoutBtn', S.logout);

  set('cardReportTitle', S.reportTitle);
  set('cardReportLead', S.reportLead);
  set('stepTrailText', S.stepTrailText);
  set('stepTab1', S.stepTab1);
  set('stepTab2', S.stepTab2);
  set('stepTab3', S.stepTab3);
  set('stepTitle1', S.stepTitle1);
  set('stepTitle2', S.stepTitle2);
  set('stepTitle3', S.stepTitle3);
  set('step1NextBtn', S.stepNext);
  set('step2BackBtn', S.stepBack);
  set('step3BackBtn', S.stepBack);
  set('regenerateBtn', S.regenerateBtn);
  set('lblAdvancedSettings', S.advancedSettingsLabel);
  const qRow = g('quickTweakRow');
  if (qRow) qRow.setAttribute('aria-label', S.tweakGroupAria);
  set('tweakNatural', S.tweakMoreNatural);
  set('tweakShorter', S.tweakShorter);
  set('tweakHeading', S.tweakHeading);
  set('tweakWord', S.tweakWord);
  set('lblTheme', S.themeLabel);
  set('hintTheme', S.themeHint);
  const themeEl = g('theme');
  if (themeEl) themeEl.placeholder = S.themePh;
  set('sampleStarterTitle', S.sampleStarterTitle);
  set('sampleStarterHint', S.sampleStarterHint);
  set('sampleConbini', S.sampleConbini);
  set('sampleCulture', S.sampleCulture);
  set('sampleSdg', S.sampleSdg);

  set('lblReference', S.referenceLabel);
  set('hintReference', S.referenceHint);
  set('lblUrlBeta', S.urlBetaTitle);
  set('urlBetaNote', S.urlBetaNote);
  const urlIn = g('referenceUrl');
  if (urlIn) urlIn.placeholder = S.urlPlaceholder || 'https://';
  const urlBtn = g('referenceUrlLoad');
  if (urlBtn) urlBtn.textContent = S.urlLoadBtn;
  set('lblHistory', S.historyLabel);
  set('hintHistory', S.historyHint);

  set('lblReportImage', S.reportImageLabel);
  set('hintReportImage', S.reportImageHint);
  const riClear = g('reportImageClear');
  if (riClear) riClear.textContent = S.reportImageClear;
  const riPick = g('reportImagePick');
  if (riPick) riPick.textContent = S.reportImagePick;
  set('reportImageGuide', S.reportImageGuide);

  set('lblOutputPreset', S.outputPresetLabel);
  set('hintOutputPreset', S.outputPresetHint);
  setOptionTexts('outputPreset', S.outputPresetDefault, S.outputPresetWord, S.outputPresetNoBullets);

  set('lblMode', S.modeLabel);
  set('hintMode', S.modeHint);
  setOptionTexts('studentMode', S.modeAverage, S.modeHonors, S.modeBarely);

  set('lblChars', S.charsLabel);
  set('hintChars', S.charsHint);

  set('lblTone', S.toneLabel);
  setOptionTexts('tone', S.toneFormal, S.toneCasual, S.toneFriendly);

  set('lblQuality', S.qualityLabel);
  set('hintQuality', S.qualityHint);
  setOptionTexts('quality', S.qualityNormal, S.qualityHigh);

  set('lblOutputLang', S.outputLangLabel);
  set('hintOutputLang', S.outputLangHint);
  setOptionTexts(
    'outputLang',
    S.langOutEn,
    S.langOutVi,
    S.langOutNe,
    S.langOutHi,
    S.langOutZh,
    S.langOutJa,
    S.langOutId
  );

  set('lblJaSentence', S.jaSentenceLabel);
  set('hintJaSentence', S.jaSentenceHint);
  setOptionTexts('japaneseSentenceStyle', S.jaStyleDesu, S.jaStyleDearu);

  set('generate', S.genBtn);

  set('cardPreviewTitle', S.previewTitle);
  set('cardPreviewLead', S.previewLead);
  set('lastSettingsTitle', S.lastSettingsTitle);
  set('copy', S.copy);
  set('clear', S.clear);
  const out = g('output');
  if (out) out.placeholder = S.outputPh;

  set('cardImageTitle', S.imageTitle);
  set('cardImageLead', S.imageLead);
  const imgP = g('imagePrompt');
  if (imgP) imgP.placeholder = S.imagePh;
  set('imageGenerateBtn', S.imageBtn);

  set('planLineFree', S.planLineFree);
  set('planLinePro', S.planLinePro);
  set('footLogin', S.footLogin);
  set('footPro', S.footPro);
  set('footTerms', S.footTerms);
  set('footPrivacy', S.footPrivacy);
  set('footTokusho', S.footTokusho);
  set('footContact', S.footContact);
  set('footNote', S.footNote);
  set('billingBtn', S.billing);
  set('accountPanelSummary', S.accountPanelTitle);
  set('accountPanelLead', S.accountPanelLead);
  set('accountDeleteEmailLabel', S.accountDeleteEmailLabel);
  set('accountDeletePwLabel', S.accountDeletePwLabel);
  set('deleteAccountBtn', S.deleteAccount);
  applyProCompare(loc);
}

/** @param {Locale} loc */
export function applyProCompare(loc) {
  const S = STR[loc] ?? STR.ja;
  const P = S.proCompare ?? STR.ja.proCompare ?? STR.en.proCompare;
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('proCompareTitle', P.title);
  set('proCompareLead', P.lead);
  set('proCompareColFree', P.colFree);
  set('proCompareColPro', P.colPro);
  set('proCompareRowText', P.rowText);
  set('proCompareRowTextFree', P.rowTextFree);
  set('proCompareRowTextPro', P.rowTextPro);
  set('proCompareRowImage', P.rowImage);
  set('proCompareRowImageFree', P.rowImageFree);
  set('proCompareRowImagePro', P.rowImagePro);
  set('proCompareRowChars', P.rowChars);
  set('proCompareRowCharsFree', P.rowCharsFree);
  set('proCompareRowCharsPro', P.rowCharsPro);
  set('proCompareRowQuality', P.rowQuality);
  set('proCompareRowQualityFree', P.rowQualityFree);
  set('proCompareRowQualityPro', P.rowQualityPro);
  set('proCompareNote', P.note);
  set('proCompareCta', P.cta);
  set('proUpsellPerk1', P.perk1);
  set('proUpsellPerk2', P.perk2);
  set('proUpsellPerk3', P.perk3);
  set('charsProBadge', P.badgeChars);
  set('qualityProBadge', P.badgeQuality);
}

/** @param {Locale} loc @param {'pro'|'free'|null} plan */
export function patchUpgradeLabel(loc, plan) {
  const up = document.getElementById('upgradeBtn');
  if (!up || up.hidden) return;
  const S = STR[loc] ?? STR.ja;
  up.textContent = plan === 'pro' ? S.upgradeDone : S.upgrade;
}

/** @param {string} selectId @param {...string} labels */
function setOptionTexts(selectId, ...labels) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const opts = sel.querySelectorAll('option');
  labels.forEach((text, i) => {
    if (opts[i]) opts[i].textContent = text;
  });
}

/** @param {Locale} loc */
export function applyLoginPage(loc) {
  const S = LOGIN[loc] ?? LOGIN.ja;
  document.documentElement.lang = documentHtmlLang(loc);
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  document.title = S.pageTitle;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && S.metaDesc) meta.setAttribute('content', S.metaDesc);
  set('loginPromoPill', S.promo);
  set('tabSignin', S.tabIn);
  set('tabSignup', S.tabUp);
  set('modeHeading', S.modeHeadingIn);
  set('modeHint', S.modeHintIn);
  set('proIntentBanner', S.proIntentBanner);
  set('googleBtnLabel', S.googleLabel);
  set('googleHint', S.googleHint);
  const or = document.querySelector('.loginOr');
  if (or) or.textContent = S.or;
  set('forgotQuestion', S.forgotQuestion);
  const fl = document.getElementById('forgotLink');
  if (fl) fl.textContent = S.forgotLink;
  set('loginNavHint', S.tabHint);
  set('submitBtn', S.submitIn);
  const skip = document.getElementById('skipLoginLink');
  if (skip) skip.textContent = S.skipLogin;
  set('loginLocaleLabel', S.localeLabel);
  set('loginEmailLabel', S.emailLabel);
  set('loginPasswordLabel', S.passwordLabel);
  const tabs = document.getElementById('authModeTabs');
  if (tabs) tabs.setAttribute('aria-label', S.ariaAuthTabs);
}

/** @param {Locale} loc @param {'signin'|'signup'} mode */
export function applyLoginMode(loc, mode) {
  const S = LOGIN[loc] ?? LOGIN.ja;
  const signin = mode === 'signin';
  const mh = document.getElementById('modeHeading');
  const mm = document.getElementById('modeHint');
  const sb = document.getElementById('submitBtn');
  const sw = document.getElementById('switchMode');
  const pr = document.getElementById('switchPrompt');
  if (mh) mh.textContent = signin ? S.modeHeadingIn : S.modeHeadingUp;
  if (mm) mm.textContent = signin ? S.modeHintIn : S.modeHintUp;
  if (sb) sb.textContent = signin ? S.submitIn : S.submitUp;
  if (sw) sw.textContent = signin ? S.switchToUp : S.switchToIn;
  if (pr) pr.textContent = signin ? S.promptNoAccount : S.promptHasAccount;
  const gl = document.getElementById('googleBtnLabel');
  if (gl) gl.textContent = signin ? S.googleLabel : S.googleLabelUp;
  patchLoginGoogleHint(loc, mode, null);
}

/** @param {Locale} loc @param {'signin'|'signup'} mode @param {boolean|null} enabled null = disabled hint */
export function patchLoginGoogleHint(loc, mode, enabled) {
  const S = LOGIN[loc] ?? LOGIN.ja;
  const signin = mode === 'signin';
  const gh = document.getElementById('googleHint');
  const btn = document.getElementById('googleBtn');
  if (btn) btn.disabled = enabled === false;
  if (!gh) return;
  if (enabled === true) {
    gh.textContent = signin ? (S.googleHintOn ?? S.googleHint) : (S.googleHintUpOn ?? S.googleHintUp);
  } else if (enabled === false) {
    gh.textContent = signin ? S.googleHint : S.googleHintUp;
  } else {
    gh.textContent = signin ? S.googleHint : S.googleHintUp;
  }
}

/** @param {Locale} loc @param {string} key */
export function loginMsg(loc, key) {
  const L = LOGIN[loc] ?? LOGIN.ja;
  const m = L.msg?.[key];
  return m ?? LOGIN.ja.msg[key] ?? key;
}

/**
 * @param {Locale} loc
 * @param {{ plan: string, text?: number, image?: number, textLimit?: number|null, imageLimit?: number|null }} ctx
 */
export function formatUsageLine(loc, ctx) {
  const S = STR[loc] ?? STR.ja;
  if (ctx.plan === 'pro') return S.usagePro;
  const tl = Number(ctx.textLimit);
  const il = Number(ctx.imageLimit);
  const t = Number(ctx.text ?? 0);
  const i = Number(ctx.image ?? 0);
  const tRem = Number.isFinite(tl) ? Math.max(0, tl - t) : 0;
  const iRem = Number.isFinite(il) ? Math.max(0, il - i) : 0;
  const sub = (template) =>
    template
      .replace('{{tRem}}', String(tRem))
      .replace('{{iRem}}', String(iRem))
      .replace('{{t}}', String(t))
      .replace('{{tl}}', String(ctx.textLimit ?? '—'))
      .replace('{{i}}', String(i))
      .replace('{{il}}', String(ctx.imageLimit ?? '—'));
  if (ctx.plan === 'free' && ctx.text != null) {
    return sub(S.usageFmt);
  }
  if (ctx.text != null) {
    return sub(S.usageAnonFmt);
  }
  return S.usageTrial;
}

/** @param {Locale} loc */
export function planFreeLabel(loc) {
  return (STR[loc] ?? STR.ja).planFree;
}

/** @param {Locale} loc @param {'pro'|'free'|null} plan */
export function planBadgeText(loc, plan) {
  const S = STR[loc] ?? STR.ja;
  if (plan === 'pro') return S.badgePlanPro;
  return S.badgePlanFree;
}

/** @param {Locale} loc @param {boolean} isPro */
export function formatCharsHint(loc, isPro) {
  const S = STR[loc] ?? STR.ja;
  const min = 100;
  const max = isPro ? 10000 : 4000;
  const fmt =
    !isPro && S.charsHintFmtFree
      ? S.charsHintFmtFree
      : (S.charsHintFmt ?? STR.ja.charsHintFmt);
  return fmt.replace('{{min}}', String(min)).replace('{{max}}', String(max));
}

/** @param {Locale} loc @param {boolean} isPro */
export function patchCharsHint(loc, isPro) {
  const el = document.getElementById('hintChars');
  if (el) el.textContent = formatCharsHint(loc, isPro);
}

/** @param {Locale} loc */
export function msg(loc) {
  return (STR[loc] ?? STR.ja).msg;
}

/** @param {Locale} loc @param {string} key */
export function draftSample(loc, key) {
  const S = STR[loc] ?? STR.ja;
  return S.sampleDrafts?.[key] ?? STR.ja.sampleDrafts?.[key] ?? null;
}

/** @param {Locale} loc @param {string} key */
export function draftCheckLabel(loc, key) {
  const S = STR[loc] ?? STR.ja;
  return S.draftChecks?.[key] ?? STR.ja.draftChecks?.[key] ?? key;
}

/** @param {Locale} loc @param {string} status */
export function draftCheckStatusLabel(loc, status) {
  const S = STR[loc] ?? STR.ja;
  return S.draftCheckStatus?.[status] ?? STR.ja.draftCheckStatus?.[status] ?? status;
}

const STR = {
  ja: {
    pageTitle: 'レポたすAI｜自然なレポート下書き',
    metaDesc:
      '大学生・留学生向け。カンペ感を抑えた自然な下書き。Language で UI を日本語・English・中文・Tiếng Việt・नेपाली・हिन्दी・Bahasa Indonesiaに切替可能。',
    tagline: 'カンペ感を抑えた、自然なレポート下書き',
    value1: '自然な文体',
    value2: 'スマホで完結',
    value3: 'すぐコピー',
    funProfTitle: '教授警戒度',
    funGradeTitle: '自然さ',
    scoreProfLow: '低',
    scoreProfMid: '中',
    scoreProfHigh: '高',
    scoreGradeLow: 'あと一押し',
    scoreGradeMid: 'まあまあ',
    scoreGradeHigh: 'かなりいい',
    funScoreDisclaimer: '実在の教授の評価ではありません（AIによる目安です）。',
    funScoreLoading: '判定中…',
    funMeterAria: '下書きの参考メーター',
    funMeterCardTitle: '下書きチェック',
    funMeterTag: 'AIっぽさ目安',
    funMeterAfterGen: '生成すると、ここに表示されます',
    draftChecklistTitle: '提出前チェック',
    draftChecks: {
      assignment_fit: '課題文に答えている',
      evidence: '根拠・資料の厚み',
      ai_tone: 'AIっぽい言い回し',
      citation: '引用・事実確認'
    },
    draftCheckStatus: { ok: 'OK', warn: '要確認', check: '確認' },
    localeLabel: '言語',
    badgePlanFree: '無料',
    badgePlanPro: 'Pro',
    login: 'ログイン',
    proShort: 'Pro',
    upgrade: 'Pro にする',
    upgradeDone: 'すでに Pro です',
    billing: '請求・解約',
    logout: 'ログアウト',
    planFree: 'お試し',
    reportTitle: 'レポート下書きを作成',
    reportLead: 'テーマ・参考資料・画像・文字数を入れて生成。細かい条件は「詳細設定」から。',
    stepTrailText: '課題入力 → 詳細設定 → 生成結果',
    stepTab1: '1. 課題入力',
    stepTab2: '2. 詳細設定',
    stepTab3: '3. 生成結果',
    stepTitle1: '課題を入力',
    stepTitle2: '詳細設定',
    stepTitle3: '生成結果',
    stepNext: '次へ',
    stepBack: '戻る',
    regenerateBtn: 'もう一度生成',
    advancedSettingsLabel: '▼ 詳細設定',
    themeLabel: 'テーマ',
    themeHint: '課題文をそのまま貼ってもOK',
    themePh: '例：地球温暖化を迎えるために身近にできる対策',
    sampleStarterTitle: '迷ったら例題から',
    sampleStarterHint: 'テーマ・参考資料・文字数が入ります',
    sampleConbini: 'コンビニ文化',
    sampleCulture: '異文化コミュニケーション',
    sampleSdg: 'SDGs と大学生活',
    sampleDrafts: {
      conbini: {
        theme: '日本のコンビニ文化が大学生の生活にもたらす利点と課題について',
        referenceMaterial:
          'コンビニは24時間営業、少量購入、公共料金支払い、ATM、コピー機などを通じて生活を支える。一方で、食品ロスや深夜労働、地域の小売店への影響も指摘される。',
        targetChars: 900,
        outputLang: 'ja',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: '留学生が日本の大学で経験する異文化コミュニケーションの課題と工夫',
        referenceMaterial:
          '異文化コミュニケーションでは、言語力だけでなく、沈黙の受け止め方、敬語、グループワークでの役割分担、質問のタイミングなどが学習体験に影響する。',
        targetChars: 1000,
        outputLang: 'ja',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'SDGsを大学生活の中で実践するためにできること',
        referenceMaterial:
          '身近な実践として、節電、マイボトルの利用、食品ロスの削減、古着の活用、地域ボランティアへの参加がある。小さな行動でも継続すると学内文化に影響を与えられる。',
        targetChars: 800,
        outputLang: 'ja',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: '参考資料・授業プリントの内容',
    referenceHint: '授業プリント・参考記事・メモなどを貼り付け',
    urlBetaTitle: '参考URL読み込み β',
    urlBetaNote: '※一部サイトは読み込めない場合があります。取得した本文は参考資料欄に追加されます。',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: '読み込む',
    historyLabel: '下書き履歴',
    historyHint: '設定を復元（画像は含みません）',
    reportImageLabel: '課題プリント画像（任意）',
    reportImageHint: '課題文のスクショやプリント写真。複数枚まで追加できます（複数時は各2MB目安・最大5枚）。',
    reportImageClear: '画像をすべて外す',
    reportImagePick: '課題画像を選択',
    reportImageGuide: '課題文・条件・評価基準が写っている画像ほど、下書きに反映しやすくなります。',
    outputPresetLabel: '出力形式',
    outputPresetHint: '大学の指定に合わせて選べます',
    outputPresetDefault: '標準',
    outputPresetWord: 'Word向け（見出し階層）',
    outputPresetNoBullets: '箇条書きなし',
    varyBtn: '別の言い回し',
    modeLabel: 'モード',
    modeHint: '完成度の目安（口調とは別）',
    modeHonors: '優等生（完成度高めOK）',
    modeAverage: '普通の大学生',
    modeBarely: 'ギリ単（最低限・素早く）',
    charsLabel: '文字数目安',
    charsHint: '100〜4000',
    charsHintFmt: '{{min}}〜{{max}}字',
    toneLabel: '口調',
    toneFormal: 'フォーマル',
    toneCasual: '自然',
    toneFrank: '率直',
    toneConfident: '堂々',
    toneFriendly: 'やさしめ',
    qualityLabel: '品質',
    qualityHint: '高品質は Pro のみ（論旨を整え、AIっぽさは増やさない）',
    qualityNormal: '標準',
    qualityHigh: '高品質（Pro）',
    outputLangLabel: '下書きの言語',
    outputLangHint: '提出言語に合わせて選べます',
    langOutEn: 'English',
    langOutVi: 'Tiếng Việt',
    langOutNe: 'नेपाली',
    langOutHi: 'हिन्दी',
    langOutZh: '中文（简体）',
    langOutJa: '日本語',
    langOutId: 'Bahasa Indonesia',
    jaSentenceLabel: '文体（日本語のとき）',
    jaSentenceHint: '文末を「だ・である」か「です・ます」にそろえます',
    jaStyleDesu: 'です・ます調',
    jaStyleDearu: 'だ・である調',
    genBtn: 'レポートを作成',
    tweakGroupAria: '生成済みの下書きを少し調整',
    tweakMoreNatural: 'もっと自然に',
    tweakShorter: '短く',
    tweakHeading: '見出しをつける',
    tweakWord: 'Word向けに整える',
    previewTitle: 'レポート下書き',
    previewLead: '生成した文章は、そのまま編集して使えます。',
    lastSettingsTitle: '今回の設定',
    copy: 'コピー',
    clear: 'クリア',
    outputPh: '生成結果がここに表示されます',
    imageTitle: '表紙画像を作る（β）',
    imageLead: '表紙やスライド用。無料は 1 日 1 枚まで。',
    imagePh: '例：落ち着いた色調で、大学図書館でノートを取る学生のイラスト',
    imageBtn: '画像を生成',
    planLineFree: 'Free テキスト 3 回/日 · 画像 1 回/日',
    planLinePro: 'Pro 無制限 · 高品質モード',
    footLogin: 'ログイン・新規登録',
    footPro: 'Pro（課金）',
    footTerms: '利用規約',
    footPrivacy: 'プライバシー',
    footTokusho: '特商法表記',
    footContact: 'お問い合わせ',
    accountPanelTitle: 'アカウント設定',
    accountPanelLead: 'ログイン中のアカウントを管理します。削除すると下書き履歴も消えます。',
    accountDeleteEmailLabel: '確認用メール',
    accountDeletePwLabel: 'パスワード',
    deleteAccount: 'アカウントを削除',
    deleteAccountConfirm: 'アカウントを完全に削除します。よろしいですか？',
    deleteAccountOk: 'アカウントを削除しました。',
    billingFail: '請求ページを開けませんでした。',
    footNote: '下書き補助ツールです。提出前の内容・引用・学内ルールはご自身でご確認ください。',
    usagePro: 'Pro のため、テキスト・画像は無制限です。',
    usageFmt:
      '無料枠：テキストはあと {{tRem}} 回・画像はあと {{iRem}} 枚使えます（0時・日本時間にリセット）',
    usageAnonFmt:
      '無料で試せます：このブラウザの残りが テキスト {{tRem}} 回・画像 {{iRem}} 枚（ログイン不要）',
    usageTrial: '無料でお試しできます。アカウントなしでも始められます。',
    proCompare: {
      title: 'Free と Pro',
      lead: '締切前に何度も直したい時期向けです',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'テキスト生成',
      rowTextFree: '3回/日',
      rowTextPro: '無制限',
      rowImage: '表紙画像',
      rowImageFree: '1枚/日',
      rowImagePro: '無制限',
      rowChars: '文字数目安',
      rowCharsFree: '〜4,000字',
      rowCharsPro: '〜10,000字',
      rowQuality: '高品質モード',
      rowQualityFree: '—',
      rowQualityPro: '利用可',
      note: '締切前に回数を気にせず、長めの下書きまで続けて直せます。',
      cta: 'Pro にする',
      perk1: '締切前でも回数を気にせず生成',
      perk2: '長めの課題に使える最大10,000字',
      perk3: '論旨を整える高品質モード',
      badgeChars: 'Proで10,000字',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'テーマを入力してください。',
      generating: '生成中...',
      ok: 'OK。必要なら少し手直しして使ってください。',
      genFail: '生成に失敗しました。',
      aiBusy: '現在AIが混み合っています。少し時間を置いてからもう一度お試しください。',
      aiRetryCountdown: 'あと{{n}}秒で再試行できます',
      logoutOk: 'ログアウトしました。',
      imgPrompt: '画像プロンプトを入力してください。',
      imgGen: '画像生成中…',
      imgOk: '画像を生成しました。',
      imgFail: '画像生成に失敗しました。',
      copyOk: 'コピーしました。',
      copyFail: 'コピーに失敗。手動で選択してコピーしてください。',
      paySuccess: 'お支払いありがとうございます。反映されないときはこのページを再読み込みしてください。',
      payCancel: '決済をキャンセルしました。',
      checkoutFail: '決済ページの作成に失敗しました。',
      themeOrImageRequired: 'テーマを入力するか、参考資料を貼るか、資料画像を選んでください。',
      stepThemeRequired: '先にテーマを入力してください。',
      imageTooLarge: '画像は 4MB 以下にしてください。',
      imageMaxCount: '資料画像は最大5枚までです。',
      imageTooLargeMulti: '複数枚のときは各画像を2MB以下にしてください。',
      imageTotalTooLarge: '資料画像の合計が大きすぎます。枚数を減らすか圧縮してください（合計8MBまで）。',
      sessionLoadFail: '利用状況の取得に失敗しました。ページを再読み込みしてください。',
      tweakNeedPreview: '先に「レポートを作成」で下書きを表示してから、こちらのボタンをお試しください。',
      charsOverFreeLimit: '無料枠は文字数目安が4000字までです。長文は Pro でお試しください。',
      charsOverMaxLimit: '文字数目安は最大10000字までです。',
      charsBelowMin: '文字数目安は100字以上にしてください。',
      freeLimitText: '本日の無料枠（テキスト）を使い切りました。',
      freeLimitImage: '本日の無料枠（画像）を使い切りました。',
      proUpsellLead: '締切前に続けて直すなら Pro で次が使えます',
      proLoginNeedAccount: 'Proの決済にはログインが必要です。ログイン後はそのまま決済ページへ進みます。続けますか？',
      proLoginRedirecting: 'ログインページへ移動します…',
      urlNeedUrl: 'URLを入力してください。',
      urlLoading: 'ページを読み込み中…',
      urlOk: '参考資料欄に追加しました。',
      urlFail: 'URLの読み込みに失敗しました。',
      historyPlaceholder: '履歴から選ぶ…',
      historyRestored: '履歴の設定を復元しました。',
      sampleApplied: '例題を入力しました。このまま生成できます。',
      charCountCurrent: '現在の文字数：{{n}}字',
      charCountTarget: '指定文字数：{{n}}字',
      charCountRemain: '残り：{{n}}字',
      charCountRemainOver: '残り：-{{n}}字',
      charsOverTargetWarn: '指定文字数を超えています。短くしてください。',
      funCharLine: '文字数：{{current}} / {{target}}字',
      charsOverTargetRetrying: '文字数超過のため、短く修正しています…',
      charsAutoAdjusted: '指定文字数に収まるよう自動で調整しました。'
    }
  },
  en: {
    pageTitle: 'Repotasu AI — Natural report drafts',
    metaDesc:
      'For university students. Less “teleprompter” AI, more natural drafts. UI: JA / EN / ZH / VI / NE / HI / ID.',
    tagline: 'Natural drafts with less “cue-card” AI tone',
    value1: 'Natural tone',
    value2: 'Works on your phone',
    value3: 'One-tap copy',
    funProfTitle: 'Prof radar',
    funGradeTitle: 'Natural flow',
    scoreProfLow: 'low',
    scoreProfMid: 'medium',
    scoreProfHigh: 'high',
    scoreGradeLow: 'needs a push',
    scoreGradeMid: 'okay',
    scoreGradeHigh: 'solid',
    funScoreDisclaimer: "Not a real professor's grade—an AI rough gauge only.",
    funScoreLoading: 'Scoring…',
    funMeterAria: 'Reference gauges for your draft',
    funMeterCardTitle: 'Draft check',
    funMeterTag: 'AI-ish note',
    funMeterAfterGen: 'Appears here after you generate.',
    draftChecklistTitle: 'Pre-submit checklist',
    draftChecks: {
      assignment_fit: 'Answers the assignment',
      evidence: 'Evidence / source depth',
      ai_tone: 'AI-ish phrasing',
      citation: 'Citations / fact check'
    },
    draftCheckStatus: { ok: 'OK', warn: 'Review', check: 'Check' },
    localeLabel: 'Language',
    badgePlanFree: 'Free',
    badgePlanPro: 'Pro',
    login: 'Log in',
    proShort: 'Pro',
    upgrade: 'Get Pro',
    upgradeDone: 'Already Pro',
    billing: 'Billing',
    logout: 'Log out',
    planFree: 'Try free',
    reportTitle: 'Create your report draft',
    reportLead: 'Add topic, reference, images, and length—then generate. More under “Advanced settings”.',
    stepTrailText: 'Task Input → Detailed Settings → Result',
    stepTab1: '1. Task Input',
    stepTab2: '2. Detailed Settings',
    stepTab3: '3. Result',
    stepTitle1: 'Enter your task',
    stepTitle2: 'Detailed settings',
    stepTitle3: 'Generated result',
    stepNext: 'Next',
    stepBack: 'Back',
    regenerateBtn: 'Generate again',
    advancedSettingsLabel: '▼ Advanced settings',
    themeLabel: 'Topic',
    themeHint: 'Paste the assignment text as-is',
    themePh: 'e.g. Benefits and challenges of convenience stores in Japan',
    sampleStarterTitle: 'Start from an example',
    sampleStarterHint: 'Fills topic, reference, and length',
    sampleConbini: 'Convenience stores',
    sampleCulture: 'Intercultural communication',
    sampleSdg: 'SDGs on campus',
    sampleDrafts: {
      conbini: {
        theme: 'Benefits and challenges of convenience store culture for university students in Japan',
        referenceMaterial:
          'Convenience stores support daily life through 24-hour service, small purchases, bill payment, ATMs, and copy machines. At the same time, food waste, late-night labor, and effects on local shops are concerns.',
        targetChars: 900,
        outputLang: 'en',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: 'Challenges and strategies in intercultural communication for international students at Japanese universities',
        referenceMaterial:
          'Intercultural communication is affected not only by language ability, but also by how silence is understood, honorific speech, group-work roles, and the timing of questions.',
        targetChars: 1000,
        outputLang: 'en',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'Practical ways to connect the SDGs with everyday university life',
        referenceMaterial:
          'Practical actions include saving electricity, using a reusable bottle, reducing food waste, reusing clothing, and joining local volunteer work. Small actions can shape campus culture when continued.',
        targetChars: 800,
        outputLang: 'en',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: 'Reference material / class handout text',
    referenceHint: 'Paste handouts, articles, or your notes',
    urlBetaTitle: 'Import from URL (beta)',
    urlBetaNote: 'Some sites may not load. Fetched text is appended to the reference field.',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: 'Load',
    historyLabel: 'Draft history',
    historyHint: 'Restore settings (images not included)',
    reportImageLabel: 'Assignment print images (optional)',
    reportImageHint: 'Screenshots or photos of the assignment sheet. Up to 5 images (~2MB each when multiple; one image up to ~4MB).',
    reportImageClear: 'Remove all images',
    reportImagePick: 'Choose assignment images',
    reportImageGuide: 'Images showing the prompt, conditions, or rubric are easier to reflect in the draft.',
    outputPresetLabel: 'Output format',
    outputPresetHint: 'Match your course requirements',
    outputPresetDefault: 'Default',
    outputPresetWord: 'Word-friendly (heading levels)',
    outputPresetNoBullets: 'No bullet lists',
    varyBtn: 'Rephrase',
    modeLabel: 'Mode',
    modeHint: 'How polished it feels (separate from voice)',
    modeHonors: 'Honor student (polished OK)',
    modeAverage: 'Typical student',
    modeBarely: 'Minimum / fast',
    charsLabel: 'Target length',
    charsHint: '100–4000',
    charsHintFmt: '{{min}}–{{max}} chars',
    charsHintFmtFree: '{{min}}–{{max}} chars (free up to 4000)',
    toneLabel: 'Voice',
    toneFormal: 'Formal',
    toneCasual: 'Natural',
    toneFrank: 'Frank',
    toneConfident: 'Confident',
    toneFriendly: 'Gentle',
    qualityLabel: 'Quality',
    qualityHint: 'High quality: Pro only (clearer logic, not more “AI sparkle”)',
    qualityNormal: 'Standard',
    qualityHigh: 'High (Pro)',
    outputLangLabel: 'Draft language',
    outputLangHint: 'Match the language you will submit.',
    langOutEn: 'English',
    langOutVi: 'Vietnamese',
    langOutNe: 'Nepali',
    langOutHi: 'Hindi',
    langOutZh: 'Chinese (Simplified)',
    langOutJa: 'Japanese',
    langOutId: 'Indonesian',
    jaSentenceLabel: 'Sentence style (Japanese output)',
    jaSentenceHint: 'Polite (desu/masu) vs plain academic (da/dearu).',
    jaStyleDesu: 'Polite (です・ます)',
    jaStyleDearu: 'Plain (だ・である)',
    genBtn: 'Create report',
    tweakGroupAria: 'Fine-tune the draft you already generated',
    tweakMoreNatural: 'More natural',
    tweakShorter: 'Shorter',
    tweakHeading: 'Add headings',
    tweakWord: 'Format for Word',
    previewTitle: 'Report draft',
    previewLead: 'Edit the generated text as you like.',
    lastSettingsTitle: 'Last used settings',
    copy: 'Copy',
    clear: 'Clear',
    outputPh: 'Generated text appears here',
    imageTitle: 'Make a cover image (beta)',
    imageLead: 'For cover or slides. Free: 1 per day in this browser.',
    imagePh: 'e.g. calm colors, student taking notes in a library',
    imageBtn: 'Generate image',
    planLineFree: 'Free: 3 text / day · 1 image / day',
    planLinePro: 'Pro: unlimited · high quality mode',
    footLogin: 'Log in / Sign up',
    footPro: 'Pro (billing)',
    footTerms: 'Terms',
    footPrivacy: 'Privacy',
    footTokusho: 'Legal notice',
    footContact: 'Contact',
    accountPanelTitle: 'Account',
    accountPanelLead: 'Manage your signed-in account. Deletion removes draft history.',
    accountDeleteEmailLabel: 'Confirm email',
    accountDeletePwLabel: 'Password',
    deleteAccount: 'Delete account',
    deleteAccountConfirm: 'Permanently delete your account?',
    deleteAccountOk: 'Account deleted.',
    billingFail: 'Could not open billing page.',
    footNote: 'This tool only helps with drafts. Please verify facts, citations, and school rules before submitting.',
    usagePro: 'Pro: unlimited text and images.',
    usageFmt:
      'Free quota left: {{tRem}} text runs · {{iRem}} image slots (resets at midnight)',
    usageAnonFmt:
      'Try free in this browser: {{tRem}} text runs · {{iRem}} images left (no login)',
    usageTrial: 'Free to try. You can start without creating an account.',
    proCompare: {
      title: 'Free vs Pro',
      lead: 'For deadline weeks when you need more revisions',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'Text drafts',
      rowTextFree: '3/day',
      rowTextPro: 'Unlimited',
      rowImage: 'Cover images',
      rowImageFree: '1/day',
      rowImagePro: 'Unlimited',
      rowChars: 'Target length',
      rowCharsFree: 'up to 4k',
      rowCharsPro: 'up to 10k',
      rowQuality: 'High quality',
      rowQualityFree: '—',
      rowQualityPro: 'Yes',
      note: 'Keep revising longer drafts without worrying about the daily limit.',
      cta: 'Get Pro',
      perk1: 'Generate freely before deadlines',
      perk2: 'Up to 10,000 characters for longer assignments',
      perk3: 'High quality mode for clearer logic',
      badgeChars: 'Pro: 10k chars',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'Please enter a topic.',
      generating: 'Generating...',
      ok: 'Done. Edit lightly before submitting.',
      genFail: 'Generation failed.',
      aiBusy: 'The AI service is busy. Please wait a moment and try again.',
      aiRetryCountdown: 'You can retry in {{n}} seconds',
      logoutOk: 'Logged out.',
      imgPrompt: 'Please enter an image prompt.',
      imgGen: 'Generating image…',
      imgOk: 'Image generated.',
      imgFail: 'Image generation failed.',
      copyOk: 'Copied.',
      copyFail: 'Copy failed. Select and copy manually.',
      paySuccess: 'Thank you for your payment. Reload if it does not reflect.',
      payCancel: 'Payment canceled.',
      checkoutFail: 'Could not start checkout.',
      themeOrImageRequired: 'Enter a topic, paste reference material, or choose a source image.',
      stepThemeRequired: 'Please enter a topic first.',
      imageTooLarge: 'Please use an image under 4MB.',
      imageMaxCount: 'You can attach up to 5 source images.',
      imageTooLargeMulti: 'When using multiple images, keep each file under 2MB.',
      imageTotalTooLarge: 'Total image size is too large. Use fewer or smaller files (about 8MB combined).',
      sessionLoadFail: 'Could not load account status. Please reload the page.',
      tweakNeedPreview: 'Generate a draft with “Create report” first, then use these buttons.',
      charsOverFreeLimit: 'Free accounts are limited to 4,000 characters. Try Pro for longer drafts.',
      charsOverMaxLimit: 'Target length cannot exceed 10,000 characters.',
      charsBelowMin: 'Target length must be at least 100 characters.',
      freeLimitText: "You've used today's free text quota.",
      freeLimitImage: "You've used today's free image quota.",
      proUpsellLead: 'For deadline revisions, Pro unlocks:',
      proLoginNeedAccount:
        'Pro checkout requires an account. After signing in, you will continue to checkout. Continue?',
      proLoginRedirecting: 'Redirecting to sign-in…',
      urlNeedUrl: 'Enter a URL.',
      urlLoading: 'Loading page…',
      urlOk: 'Added to the reference field.',
      urlFail: 'Could not load that URL.',
      historyPlaceholder: 'Choose from history…',
      historyRestored: 'Restored settings from history.',
      sampleApplied: 'Example filled in. You can generate now.',
      charCountCurrent: 'Current: {{n}} chars',
      charCountTarget: 'Target: {{n}} chars',
      charCountRemain: 'Remaining: {{n}} chars',
      charCountRemainOver: 'Over by: {{n}} chars',
      charsOverTargetWarn: 'Over target length. Please shorten the text.',
      funCharLine: 'Length: {{current}} / {{target}} chars',
      charsOverTargetRetrying: 'Over limit—shortening…',
      charsAutoAdjusted: 'Adjusted automatically to fit the target length.'
    }
  },
  zh: {
    pageTitle: 'レポたすAI｜自然的报告草稿',
    metaDesc: '面向大学生与留学生。减少“提词器感”。界面可切换 日/英/中/越/尼/印地/印尼。',
    tagline: '减少提词器感，更自然的报告草稿',
    value1: '自然文体',
    value2: '手机完成',
    value3: '一键复制',
    funProfTitle: '教授雷达',
    funGradeTitle: '自然感',
    scoreProfLow: '低',
    scoreProfMid: '中',
    scoreProfHigh: '高',
    scoreGradeLow: '还差一口气',
    scoreGradeMid: '还行',
    scoreGradeHigh: '比较像样',
    funScoreDisclaimer: '并非真实教授评分，仅供参考（由 AI 估算）。',
    funScoreLoading: '判定中…',
    funMeterAria: '草稿参考指标',
    funMeterCardTitle: '草稿快测',
    funMeterTag: 'AI感提示（参考）',
    funMeterAfterGen: '生成后将显示在这里。',
    draftChecklistTitle: '提交前检查',
    draftChecks: {
      assignment_fit: '是否回应作业要求',
      evidence: '论据与资料厚度',
      ai_tone: 'AI感表达',
      citation: '引用与事实确认'
    },
    draftCheckStatus: { ok: 'OK', warn: '需确认', check: '检查' },
    localeLabel: '界面语言',
    badgePlanFree: '免费',
    badgePlanPro: 'Pro',
    login: '登录',
    proShort: 'Pro',
    upgrade: '开通 Pro',
    upgradeDone: '已是 Pro',
    billing: '账单·解约',
    logout: '退出',
    planFree: '免费体验',
    reportTitle: '创建报告草稿',
    reportLead: '填写主题、参考资料、图片与字数后生成；更多选项在「详细设置」。',
    stepTrailText: '课题输入 → 详细设置 → 生成结果',
    stepTab1: '1. 课题输入',
    stepTab2: '2. 详细设置',
    stepTab3: '3. 生成结果',
    stepTitle1: '输入课题',
    stepTitle2: '详细设置',
    stepTitle3: '生成结果',
    stepNext: '下一步',
    stepBack: '返回',
    regenerateBtn: '再次生成',
    advancedSettingsLabel: '▼ 详细设置',
    themeLabel: '主题',
    themeHint: '可直接粘贴作业要求',
    themePh: '例：日本便利店文化对生活的利弊',
    sampleStarterTitle: '不知道写什么？从例题开始',
    sampleStarterHint: '自动填写主题、参考资料和字数',
    sampleConbini: '便利店文化',
    sampleCulture: '跨文化沟通',
    sampleSdg: 'SDGs 与大学生活',
    sampleDrafts: {
      conbini: {
        theme: '日本便利店文化给大学生生活带来的优点与问题',
        referenceMaterial:
          '便利店通过24小时营业、小额购物、缴费、ATM、复印机等服务支撑日常生活。同时，食品浪费、深夜劳动以及对本地小店的影响也受到关注。',
        targetChars: 900,
        outputLang: 'zh',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: '留学生在日本大学遇到的跨文化沟通问题与应对方法',
        referenceMaterial:
          '跨文化沟通不仅受语言能力影响，也受沉默的理解方式、敬语、分组作业中的角色分担、提问时机等因素影响。',
        targetChars: 1000,
        outputLang: 'zh',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: '在大学生活中实践 SDGs 可以做的事情',
        referenceMaterial:
          '身边可以做的行动包括节电、使用水壶、减少食品浪费、旧衣再利用、参加社区志愿活动。小行动持续下去，也能影响校园文化。',
        targetChars: 800,
        outputLang: 'zh',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: '参考资料·课堂讲义文字',
    referenceHint: '讲义、参考文章或笔记，粘贴于此',
    urlBetaTitle: '参考网址导入 β',
    urlBetaNote: '※部分网站可能无法读取。正文会追加到参考资料栏。',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: '读取',
    historyLabel: '草稿历史',
    historyHint: '恢复设置（不含图片）',
    reportImageLabel: '作业讲义图片（可选）',
    reportImageHint: '作业要求截图或讲义照片。最多5张；多张时每张建议2MB以内，单张最大约4MB。',
    reportImageClear: '移除全部图片',
    reportImagePick: '选择作业图片',
    reportImageGuide: '包含题目、条件或评分标准的图片，更容易反映到草稿中。',
    outputPresetLabel: '输出形式',
    outputPresetHint: '按学校要求选择',
    outputPresetDefault: '标准',
    outputPresetWord: 'Word 友好（标题层级）',
    outputPresetNoBullets: '不使用条目列表',
    varyBtn: '换种说法',
    modeLabel: '模式',
    modeHint: '完成度目标（与口吻分开）',
    modeHonors: '优等生（可更完整）',
    modeAverage: '普通大学生',
    modeBarely: '及格线（最少最快）',
    charsLabel: '目标字数',
    charsHint: '100〜4000',
    charsHintFmt: '{{min}}〜{{max}}字',
    charsHintFmtFree: '{{min}}〜{{max}}字（免费最多4000）',
    toneLabel: '口吻',
    toneFormal: '正式',
    toneCasual: '自然',
    toneFrank: '直率',
    toneConfident: '自信',
    toneFriendly: '更柔和',
    qualityLabel: '质量',
    qualityHint: '高质量仅 Pro（理顺逻辑，不增加“AI味”）',
    qualityNormal: '标准',
    qualityHigh: '高质量（Pro）',
    outputLangLabel: '草稿语言',
    outputLangHint: '与提交语言一致。',
    langOutEn: '英语',
    langOutVi: '越南语',
    langOutNe: '尼泊尔语',
    langOutHi: '印地语',
    langOutZh: '简体中文',
    langOutJa: '日语',
    langOutId: '印尼语',
    jaSentenceLabel: '文体（日语输出时）',
    jaSentenceHint: '句尾统一为「だ・である」或「です・ます」。',
    jaStyleDesu: 'です・ます体',
    jaStyleDearu: 'だ・である体',
    genBtn: '创建报告',
    tweakGroupAria: '微调已生成的草稿',
    tweakMoreNatural: '更自然',
    tweakShorter: '缩短',
    tweakHeading: '添加小标题',
    tweakWord: '整理为 Word 格式',
    previewTitle: '报告草稿',
    previewLead: '生成后可继续编辑使用。',
    lastSettingsTitle: '本次设置',
    copy: '复制',
    clear: '清空',
    outputPh: '生成结果将显示在此',
    imageTitle: '生成封面图（β）',
    imageLead: '封面或幻灯片用。本浏览器免费每天 1 张。',
    imagePh: '例：柔和色调，图书馆记笔记的学生插画',
    imageBtn: '生成图片',
    planLineFree: 'Free 文本每天 3 次 · 图片 1 次',
    planLinePro: 'Pro 无限 · 高质量模式',
    footLogin: '登录·注册',
    footPro: 'Pro（付费）',
    footTerms: '使用条款',
    footPrivacy: '隐私',
    footTokusho: '法定标示',
    footContact: '联系',
    accountPanelTitle: '账户设置',
    accountPanelLead: '管理已登录账户。删除将清除草稿历史。',
    accountDeleteEmailLabel: '确认邮箱',
    accountDeletePwLabel: '密码',
    deleteAccount: '删除账户',
    deleteAccountConfirm: '确定永久删除账户？',
    deleteAccountOk: '账户已删除。',
    billingFail: '无法打开账单页面。',
    footNote: '仅为草稿辅助。提交前请自行核对内容、引用与校规。',
    usagePro: 'Pro：文本与图片均不限。',
    usageFmt: '免费剩余：文本还可 {{tRem}} 次 · 图片还可 {{iRem}} 张（0 点重置）',
    usageAnonFmt: '可免费试用：本浏览器还剩 文本 {{tRem}} 次 · 图片 {{iRem}} 张（无需登录）',
    usageTrial: '可免费试用，无需注册即可开始。',
    proCompare: {
      title: 'Free 与 Pro',
      lead: '适合截止日前需要多次修改的时候',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: '文本草稿',
      rowTextFree: '每天3次',
      rowTextPro: '不限',
      rowImage: '封面图片',
      rowImageFree: '每天1张',
      rowImagePro: '不限',
      rowChars: '目标字数',
      rowCharsFree: '最多4,000字',
      rowCharsPro: '最多10,000字',
      rowQuality: '高质量模式',
      rowQualityFree: '—',
      rowQualityPro: '可用',
      note: '截止日前可不必担心每日次数，持续修改更长的草稿。',
      cta: '开通 Pro',
      perk1: '截止日前不必担心次数',
      perk2: '长篇作业最多10,000字',
      perk3: '理顺逻辑的高质量模式',
      badgeChars: 'Pro 10,000字',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: '请输入主题。',
      generating: '生成中…（约 10〜20 秒）',
      ok: '完成。提交前请再稍作修改。',
      genFail: '生成失败。',
      aiBusy: '当前 AI 服务较忙。请稍等后再试。',
      aiRetryCountdown: '还需 {{n}} 秒后可重试',
      logoutOk: '已退出登录。',
      imgPrompt: '请输入图片提示。',
      imgGen: '图片生成中…',
      imgOk: '图片已生成。',
      imgFail: '图片生成失败。',
      copyOk: '已复制。',
      copyFail: '复制失败，请手动选择复制。',
      paySuccess: '感谢付款。若未反映请刷新页面。',
      payCancel: '已取消付款。',
      checkoutFail: '无法打开结账页面。',
      themeOrImageRequired: '请输入主题、粘贴参考资料，或选择资料图片。',
      stepThemeRequired: '请先输入主题。',
      imageTooLarge: '图片请控制在 4MB 以下。',
      imageMaxCount: '资料图片最多5张。',
      imageTooLargeMulti: '多张时请每张控制在 2MB 以下。',
      imageTotalTooLarge: '资料图片总量过大。请减少张数或压缩（合计约8MB以内）。',
      sessionLoadFail: '无法取得使用状况。请刷新页面。',
      tweakNeedPreview: '请先用「创建报告」生成草稿，再使用这些按钮。',
      charsOverFreeLimit: '免费版目标字数最多4000字。更长请使用 Pro。',
      charsOverMaxLimit: '目标字数最多10000字。',
      charsBelowMin: '目标字数请填写100字以上。',
      freeLimitText: '今天的免费文本次数已用完。',
      freeLimitImage: '今天的免费图片次数已用完。',
      proUpsellLead: '截止日前想继续修改，Pro 可使用：',
      proLoginNeedAccount: '购买 Pro 需要先登录。登录后会直接继续到付款页面。要继续吗？',
      proLoginRedirecting: '正在跳转到登录页面…',
      urlNeedUrl: '请输入 URL。',
      urlLoading: '正在读取页面…',
      urlOk: '已追加到参考资料栏。',
      urlFail: '无法读取该 URL。',
      historyPlaceholder: '从历史中选择…',
      historyRestored: '已恢复历史设置。',
      sampleApplied: '已填入例题。可以直接生成。',
      charCountCurrent: '当前字数：{{n}}字',
      charCountTarget: '指定字数：{{n}}字',
      charCountRemain: '剩余：{{n}}字',
      charCountRemainOver: '超出：{{n}}字',
      charsOverTargetWarn: '已超过指定字数。请缩短内容或重新生成。',
      funCharLine: '字数：{{current}} / {{target}}字',
      charsOverTargetRetrying: '超出字数，正在缩短…',
      charsAutoAdjusted: '已自动调整到目标字数以内。'
    }
  },
  vi: {
    pageTitle: 'Repotasu AI — Bản nháp báo cáo tự nhiên',
    metaDesc:
      'Cho sinh viên & du học sinh. Ít “giọng đọc prompter”, nháp tự nhiên hơn. Giao diện: JA / EN / ZH / VI / NE / HI / ID.',
    tagline: 'Bản nháp tự nhiên, bớt cảm giác AI đọc kịch bản',
    value1: 'Văn phong tự nhiên',
    value2: 'Làm xong trên điện thoại',
    value3: 'Sao chép một chạm',
    funProfTitle: 'Độ “nhạy” khi đọc',
    funGradeTitle: 'Độ tự nhiên',
    scoreProfLow: 'thấp',
    scoreProfMid: 'vừa',
    scoreProfHigh: 'cao',
    scoreGradeLow: 'còn thiếu',
    scoreGradeMid: 'tạm ổn',
    scoreGradeHigh: 'khá ổn',
    funScoreDisclaimer: 'Không phải điểm của giáo sư thật—chỉ là thang tham khảo do AI.',
    funScoreLoading: 'Đang chấm…',
    funMeterAria: 'Chỉ số tham khảo cho bản nháp',
    funMeterCardTitle: 'Kiểm tra nháp',
    funMeterTag: 'Gợn AI (tham khảo)',
    funMeterAfterGen: 'Sẽ hiển thị sau khi bạn tạo.',
    draftChecklistTitle: 'Kiểm tra trước khi nộp',
    draftChecks: {
      assignment_fit: 'Đúng yêu cầu đề bài',
      evidence: 'Độ dày luận cứ / tài liệu',
      ai_tone: 'Cách diễn đạt giống AI',
      citation: 'Trích dẫn / kiểm chứng'
    },
    draftCheckStatus: { ok: 'OK', warn: 'Cần xem', check: 'Kiểm tra' },
    localeLabel: 'Ngôn ngữ',
    badgePlanFree: 'Free',
    badgePlanPro: 'Pro',
    login: 'Đăng nhập',
    proShort: 'Pro',
    upgrade: 'Nâng cấp Pro',
    upgradeDone: 'Bạn đã là Pro',
    billing: 'Thanh toán',
    logout: 'Đăng xuất',
    planFree: 'Dùng thử',
    reportTitle: 'Tạo bản nháp báo cáo',
    reportLead: 'Nhập chủ đề, tài liệu tham khảo, ảnh và độ dài rồi tạo; tùy chọn trong “Cài đặt nâng cao”.',
    stepTrailText: 'Nhập đề bài → Cài đặt chi tiết → Kết quả',
    stepTab1: '1. Nhập đề bài',
    stepTab2: '2. Cài đặt chi tiết',
    stepTab3: '3. Kết quả',
    stepTitle1: 'Nhập đề bài',
    stepTitle2: 'Cài đặt chi tiết',
    stepTitle3: 'Kết quả tạo',
    stepNext: 'Tiếp theo',
    stepBack: 'Quay lại',
    regenerateBtn: 'Tạo lại',
    advancedSettingsLabel: '▼ Cài đặt nâng cao',
    themeLabel: 'Chủ đề',
    themeHint: 'Dán nguyên đề bài cũng được',
    themePh: 'Ví dụ: Lợi ích và thách thức của văn hóa cửa hàng tiện lợi ở Nhật',
    sampleStarterTitle: 'Chưa biết bắt đầu? Dùng ví dụ',
    sampleStarterHint: 'Tự điền chủ đề, tài liệu và độ dài',
    sampleConbini: 'Văn hóa cửa hàng tiện lợi',
    sampleCulture: 'Giao tiếp liên văn hóa',
    sampleSdg: 'SDGs trong đời sống ĐH',
    sampleDrafts: {
      conbini: {
        theme: 'Lợi ích và thách thức của văn hóa cửa hàng tiện lợi đối với sinh viên đại học ở Nhật',
        referenceMaterial:
          'Cửa hàng tiện lợi hỗ trợ đời sống qua dịch vụ 24 giờ, mua số lượng nhỏ, thanh toán hóa đơn, ATM và máy photocopy. Tuy nhiên cũng có vấn đề về lãng phí thực phẩm, lao động ban đêm và ảnh hưởng đến cửa hàng địa phương.',
        targetChars: 900,
        outputLang: 'vi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: 'Khó khăn và cách xử lý giao tiếp liên văn hóa của du học sinh tại đại học Nhật Bản',
        referenceMaterial:
          'Giao tiếp liên văn hóa không chỉ phụ thuộc vào năng lực ngôn ngữ mà còn liên quan đến cách hiểu sự im lặng, kính ngữ, phân vai trong làm việc nhóm và thời điểm đặt câu hỏi.',
        targetChars: 1000,
        outputLang: 'vi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'Những việc có thể làm để thực hành SDGs trong đời sống đại học',
        referenceMaterial:
          'Các hành động gần gũi gồm tiết kiệm điện, dùng bình nước cá nhân, giảm lãng phí thực phẩm, tái sử dụng quần áo và tham gia hoạt động tình nguyện địa phương. Hành động nhỏ nếu duy trì có thể ảnh hưởng đến văn hóa trong trường.',
        targetChars: 800,
        outputLang: 'vi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: 'Tài liệu tham khảo / nội dung in lớp',
    referenceHint: 'Dán tài liệu lớp, bài tham khảo hoặc ghi chú',
    urlBetaTitle: 'Nhập từ URL (beta)',
    urlBetaNote: 'Một số trang có thể không tải được. Nội dung sẽ thêm vào mục tài liệu tham khảo.',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: 'Tải',
    historyLabel: 'Lịch sử bản nháp',
    historyHint: 'Khôi phục cài đặt (không gồm ảnh)',
    reportImageLabel: 'Ảnh đề bài / phiếu bài tập (tuỳ chọn)',
    reportImageHint: 'Ảnh chụp yêu cầu đề bài hoặc phiếu in. Tối đa 5 ảnh; nhiều ảnh thì ~2MB/ảnh, một ảnh tối đa ~4MB.',
    reportImageClear: 'Bỏ tất cả ảnh',
    reportImagePick: 'Chọn ảnh đề bài',
    reportImageGuide: 'Ảnh có đề bài, điều kiện hoặc tiêu chí chấm sẽ dễ được phản ánh vào bản nháp hơn.',
    outputPresetLabel: 'Định dạng đầu ra',
    outputPresetHint: 'Chọn theo yêu cầu môn học',
    outputPresetDefault: 'Mặc định',
    outputPresetWord: 'Thân thiện Word (cấp tiêu đề)',
    outputPresetNoBullets: 'Không dùng gạch đầu dòng',
    varyBtn: 'Cách nói khác',
    modeLabel: 'Chế độ',
    modeHint: 'Mức hoàn thiện (khác với cách nói)',
    modeHonors: 'Học sinh giỏi (có thể chỉn chu hơn)',
    modeAverage: 'Sinh viên bình thường',
    modeBarely: 'Tối thiểu / nhanh',
    charsLabel: 'Độ dài mục tiêu',
    charsHint: '100–4000',
    charsHintFmt: '{{min}}–{{max}} ký tự',
    charsHintFmtFree: '{{min}}–{{max}} ký tự (miễn phí tối đa 4000)',
    toneLabel: 'Cách nói',
    toneFormal: 'Trang trọng',
    toneCasual: 'Tự nhiên',
    toneFrank: 'Thẳng thắn',
    toneConfident: 'Tự tin',
    toneFriendly: 'Nhẹ nhàng',
    qualityLabel: 'Chất lượng',
    qualityHint: 'Chất lượng cao: chỉ Pro (logic rõ hơn, không “lấp lánh” kiểu AI)',
    qualityNormal: 'Tiêu chuẩn',
    qualityHigh: 'Cao (Pro)',
    outputLangLabel: 'Ngôn ngữ bản nháp',
    outputLangHint: 'Chọn đúng ngôn ngữ bạn sẽ nộp.',
    langOutEn: 'Tiếng Anh',
    langOutVi: 'Tiếng Việt',
    langOutNe: 'Tiếng Nepal',
    langOutHi: 'Tiếng Hindi',
    langOutZh: 'Tiếng Trung (Giản thể)',
    langOutJa: 'Tiếng Nhật',
    langOutId: 'Tiếng Indonesia',
    jaSentenceLabel: 'Văn phong (khi xuất bản tiếng Nhật)',
    jaSentenceHint: 'Chọn kiểu cuối câu: lịch sự (desu/masu) hay thường thể học thuật (da/dearu).',
    jaStyleDesu: 'Thể です・ます',
    jaStyleDearu: 'Thể だ・である',
    genBtn: 'Tạo báo cáo',
    tweakGroupAria: 'Tinh chỉnh nhẹ bản nháp đã tạo',
    tweakMoreNatural: 'Tự nhiên hơn',
    tweakShorter: 'Ngắn lại',
    tweakHeading: 'Thêm tiêu đề',
    tweakWord: 'Định dạng cho Word',
    previewTitle: 'Bản nháp báo cáo',
    previewLead: 'Chỉnh sửa văn bản đã tạo theo ý bạn.',
    lastSettingsTitle: 'Cài đặt đã dùng',
    copy: 'Sao chép',
    clear: 'Xóa',
    outputPh: 'Kết quả sẽ hiển thị ở đây',
    imageTitle: 'Tạo ảnh bìa (beta)',
    imageLead: 'Ảnh bìa / slide. Miễn phí: 1 ảnh/ngày trên trình duyệt này.',
    imagePh: 'Ví dụ: tông màu dịu, sinh viên ghi chép trong thư viện',
    imageBtn: 'Tạo ảnh',
    planLineFree: 'Free: 3 lần văn/ngày · 1 ảnh/ngày',
    planLinePro: 'Pro: không giới hạn · chế độ chất lượng cao',
    footLogin: 'Đăng nhập / Đăng ký',
    footPro: 'Pro (thanh toán)',
    footTerms: 'Điều khoản',
    footPrivacy: 'Riêng tư',
    footTokusho: 'Pháp lý',
    footContact: 'Liên hệ',
    accountPanelTitle: 'Tài khoản',
    accountPanelLead: 'Quản lý tài khoản đã đăng nhập. Xóa sẽ mất lịch sử nháp.',
    accountDeleteEmailLabel: 'Xác nhận email',
    accountDeletePwLabel: 'Mật khẩu',
    deleteAccount: 'Xóa tài khoản',
    deleteAccountConfirm: 'Xóa vĩnh viễn tài khoản?',
    deleteAccountOk: 'Đã xóa tài khoản.',
    billingFail: 'Không mở được trang thanh toán.',
    footNote:
      'Công cụ chỉ hỗ trợ nháp. Vui lòng tự kiểm tra nội dung, trích dẫn và quy định nhà trường trước khi nộp.',
    usagePro: 'Pro: văn bản và hình ảnh không giới hạn.',
    usageFmt: 'Miễn phí còn: {{tRem}} lần văn · {{iRem}} ảnh (reset nửa đêm)',
    usageAnonFmt: 'Dùng thử miễn phí trên trình duyệt này: còn {{tRem}} lần văn · {{iRem}} ảnh (không cần đăng nhập)',
    usageTrial: 'Miễn phí dùng thử. Bắt đầu không cần tài khoản.',
    proCompare: {
      title: 'Free và Pro',
      lead: 'Cho những tuần sát hạn cần sửa nhiều lần',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'Bản nháp',
      rowTextFree: '3/ngày',
      rowTextPro: 'Không giới hạn',
      rowImage: 'Ảnh bìa',
      rowImageFree: '1/ngày',
      rowImagePro: 'Không giới hạn',
      rowChars: 'Độ dài',
      rowCharsFree: 'tối đa 4.000',
      rowCharsPro: 'tối đa 10.000',
      rowQuality: 'Chất lượng cao',
      rowQualityFree: '—',
      rowQualityPro: 'Có',
      note: 'Sửa bản nháp dài liên tục trước hạn mà không phải lo giới hạn mỗi ngày.',
      cta: 'Nâng cấp Pro',
      perk1: 'Tạo thoải mái trước hạn nộp',
      perk2: 'Tối đa 10.000 ký tự cho bài dài',
      perk3: 'Chế độ chất lượng cao giúp logic rõ hơn',
      badgeChars: 'Pro: 10.000 ký tự',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'Vui lòng nhập chủ đề.',
      generating: 'Đang tạo… (khoảng 10–20 giây)',
      ok: 'Xong. Chỉnh nhẹ trước khi nộp.',
      genFail: 'Tạo thất bại.',
      aiBusy: 'Dịch vụ AI đang bận. Vui lòng chờ một chút rồi thử lại.',
      aiRetryCountdown: 'Có thể thử lại sau {{n}} giây',
      logoutOk: 'Đã đăng xuất.',
      imgPrompt: 'Vui lòng nhập mô tả ảnh.',
      imgGen: 'Đang tạo ảnh…',
      imgOk: 'Đã tạo ảnh.',
      imgFail: 'Tạo ảnh thất bại.',
      copyOk: 'Đã sao chép.',
      copyFail: 'Sao chép thất bại. Hãy chọn và sao chép thủ công.',
      paySuccess: 'Cảm ơn bạn đã thanh toán. Tải lại trang nếu chưa thấy cập nhật.',
      payCancel: 'Đã huỷ thanh toán.',
      checkoutFail: 'Không mở được trang thanh toán.',
      themeOrImageRequired: 'Nhập chủ đề, dán tài liệu tham khảo, hoặc chọn ảnh tài liệu.',
      stepThemeRequired: 'Vui lòng nhập chủ đề trước.',
      imageTooLarge: 'Ảnh phải nhỏ hơn 4MB.',
      imageMaxCount: 'Tối đa 5 ảnh tài liệu.',
      imageTooLargeMulti: 'Nhiều ảnh: mỗi ảnh dưới 2MB.',
      imageTotalTooLarge: 'Tổng dung lượng ảnh quá lớn. Giảm số ảnh hoặc nén lại (tổng khoảng 8MB).',
      sessionLoadFail: 'Không tải được trạng thái sử dụng. Vui lòng tải lại trang.',
      tweakNeedPreview: 'Hãy tạo bản nháp bằng “Tạo báo cáo” trước, rồi dùng các nút này.',
      charsOverFreeLimit: 'Bản miễn phí tối đa 4000 ký tự. Dùng Pro cho bản dài hơn.',
      charsOverMaxLimit: 'Độ dài mục tiêu tối đa 10000 ký tự.',
      charsBelowMin: 'Độ dài mục tiêu cần ít nhất 100 ký tự.',
      freeLimitText: 'Bạn đã dùng hết lượt văn bản miễn phí hôm nay.',
      freeLimitImage: 'Bạn đã dùng hết lượt ảnh miễn phí hôm nay.',
      proUpsellLead: 'Khi cần sửa sát hạn, Pro mở khóa:',
      proLoginNeedAccount:
        'Thanh toán Pro cần đăng nhập. Sau khi đăng nhập, bạn sẽ được chuyển thẳng đến trang thanh toán. Tiếp tục?',
      proLoginRedirecting: 'Đang chuyển đến trang đăng nhập…',
      urlNeedUrl: 'Nhập URL.',
      urlLoading: 'Đang tải trang…',
      urlOk: 'Đã thêm vào tài liệu tham khảo.',
      urlFail: 'Không tải được URL này.',
      historyPlaceholder: 'Chọn từ lịch sử…',
      historyRestored: 'Đã khôi phục cài đặt từ lịch sử.',
      sampleApplied: 'Đã điền ví dụ. Bạn có thể tạo ngay.',
      charCountCurrent: 'Hiện tại: {{n}} ký tự',
      charCountTarget: 'Mục tiêu: {{n}} ký tự',
      charCountRemain: 'Còn lại: {{n}} ký tự',
      charCountRemainOver: 'Vượt: {{n}} ký tự',
      charsOverTargetWarn: 'Vượt độ dài mục tiêu. Hãy rút ngắn hoặc tạo lại.',
      funCharLine: 'Độ dài: {{current}} / {{target}} ký tự',
      charsOverTargetRetrying: 'Đang rút ngắn do vượt giới hạn…',
      charsAutoAdjusted: 'Đã tự động chỉnh để vừa độ dài mục tiêu.'
    }
  },
  ne: {
    pageTitle: 'रेपोतासु AI — प्राकृतिक प्रतिवेदन मस्यौदा',
    metaDesc:
      'विश्वविद्यालयका विद्यार्थी र अन्तर्राष्ट्रिय विद्यार्थीका लागि। कम “AI टेलिप्रम्प्टर” जस्तो, बढी प्राकृतिक मस्यौदा। UI: JA / EN / ZH / VI / NE / HI / ID।',
    tagline: 'प्राकृतिक मस्यौदा, कम “प्रोम्प्टर” जस्तो AI',
    value1: 'प्राकृतिक शैली',
    value2: 'मोबाइलमै पूरा',
    value3: 'एक ट्यापमा प्रतिलिपि',
    funProfTitle: 'प्राध्यापक “खतरा”',
    funGradeTitle: 'प्राकृतिकता',
    scoreProfLow: 'कम',
    scoreProfMid: 'मध्यम',
    scoreProfHigh: 'उच्च',
    scoreGradeLow: 'अझै कमजोर',
    scoreGradeMid: 'मध्यम',
    scoreGradeHigh: 'राम्रो',
    funScoreDisclaimer: 'वास्तविक प्राध्यापकको मूल्याङ्कन होइन—AI को सन्दर्भ मात्र।',
    funScoreLoading: 'जाँच हुँदैछ…',
    funMeterAria: 'मस्यौदाको सन्दर्भ माप',
    funMeterCardTitle: 'मस्यौदा चेक',
    funMeterTag: 'AI सङ्केत (सन्दर्भ)',
    funMeterAfterGen: 'बनाएपछि यहाँ देखिन्छ।',
    draftChecklistTitle: 'पेश गर्नु अघि चेक',
    draftChecks: {
      assignment_fit: 'कार्यको मागमा जवाफ छ',
      evidence: 'आधार / स्रोतको मजबुती',
      ai_tone: 'AI जस्तो वाक्य',
      citation: 'उद्धरण / तथ्य जाँच'
    },
    draftCheckStatus: { ok: 'OK', warn: 'जाँच्नुहोस्', check: 'चेक' },
    localeLabel: 'भाषा',
    badgePlanFree: 'निःशुल्क',
    badgePlanPro: 'Pro',
    login: 'लगइन',
    proShort: 'Pro',
    upgrade: 'Pro लिनुहोस्',
    upgradeDone: 'पहिले नै Pro',
    billing: 'बिलिङ',
    logout: 'लगआउट',
    planFree: 'निःशुल्क प्रयास',
    reportTitle: 'प्रतिवेदन मस्यौदा बनाउनुहोस्',
    reportLead: 'विषय, सन्दर्भ, छवि र लम्बाइ लेखेर बनाउनुहोस्; थप “विस्तृत सेटिङ” मा।',
    stepTrailText: 'कार्य इनपुट → विस्तृत सेटिङ → परिणाम',
    stepTab1: '1. कार्य इनपुट',
    stepTab2: '2. विस्तृत सेटिङ',
    stepTab3: '3. परिणाम',
    stepTitle1: 'कार्य इनपुट गर्नुहोस्',
    stepTitle2: 'विस्तृत सेटिङ',
    stepTitle3: 'उत्पादन परिणाम',
    stepNext: 'अर्को',
    stepBack: 'फर्कनुहोस्',
    regenerateBtn: 'फेरि बनाउनुहोस्',
    advancedSettingsLabel: '▼ विस्तृत सेटिङ',
    themeLabel: 'विषय',
    themeHint: 'कार्य विवरण पेस्ट गर्न पनि हुन्छ',
    themePh: 'उदाहरण: जापानमा कनभिनियन्स स्टोर संस्कृतिको फाइदा र चुनौती',
    sampleStarterTitle: 'अलमल भए उदाहरणबाट सुरु',
    sampleStarterHint: 'विषय, सन्दर्भ र लम्बाइ भरिन्छ',
    sampleConbini: 'कनभिनियन्स स्टोर संस्कृति',
    sampleCulture: 'अन्तर्सांस्कृतिक सञ्चार',
    sampleSdg: 'SDGs र विश्वविद्यालय जीवन',
    sampleDrafts: {
      conbini: {
        theme: 'जापानमा कनभिनियन्स स्टोर संस्कृतिले विश्वविद्यालय विद्यार्थीको जीवनमा ल्याउने फाइदा र चुनौती',
        referenceMaterial:
          'कनभिनियन्स स्टोरले २४ घण्टा सेवा, सानो परिमाणको खरिद, बिल भुक्तानी, ATM र कपी मेसिनमार्फत दैनिक जीवनलाई सहयोग गर्छ। अर्कोतर्फ खाद्य फोहोर, रातिको श्रम र स्थानीय पसलमा प्रभाव जस्ता समस्या पनि छन्।',
        targetChars: 900,
        outputLang: 'ne',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: 'जापानी विश्वविद्यालयमा अन्तर्राष्ट्रिय विद्यार्थीले भोग्ने अन्तर्सांस्कृतिक सञ्चारका चुनौती र उपाय',
        referenceMaterial:
          'अन्तर्सांस्कृतिक सञ्चार भाषिक क्षमतामा मात्र निर्भर हुँदैन। मौनताको अर्थ, सम्मानजनक भाषा, समूहकार्यको भूमिका विभाजन र प्रश्न सोध्ने समयले पनि सिकाइ अनुभवलाई असर गर्छ।',
        targetChars: 1000,
        outputLang: 'ne',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'विश्वविद्यालय जीवनमा SDGs अभ्यास गर्न सकिने कामहरू',
        referenceMaterial:
          'नजिकका अभ्यासमा बिजुली बचत, आफ्नै बोतल प्रयोग, खाद्य फोहोर घटाउने, पुराना कपडा पुन: प्रयोग र स्थानीय स्वयंसेवामा सहभागी हुनु पर्छन्। साना काम निरन्तर भए क्याम्पस संस्कृतिमा प्रभाव पर्न सक्छ।',
        targetChars: 800,
        outputLang: 'ne',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: 'सन्दर्भ सामग्री / कक्षा हस्तपत्र',
    referenceHint: 'हस्तपत्र, सन्दर्भ लेख वा नोट यहाँ पेस्ट गर्नुहोस्',
    urlBetaTitle: 'URL बाट आयात (beta)',
    urlBetaNote: 'केही साइट लोड नहुन सक्छन्। पाठ सन्दर्भ सामग्रीमा थपिन्छ।',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: 'लोड',
    historyLabel: 'मस्यौदा इतिहास',
    historyHint: 'सेटिङ पुनर्स्थापना (तस्बिर समावेश छैन)',
    reportImageLabel: 'कार्यपत्र छवि (वैकल्पिक)',
    reportImageHint: 'कार्यको निर्देशन वा प्रिन्टको फोटो। अधिकतम ५ वटा; धेरै छ भने प्रत्येक ~२MB, एउटा मात्र भए ~४MB।',
    reportImageClear: 'सबै छवि हटाउनुहोस्',
    reportImagePick: 'कार्य छवि छान्नुहोस्',
    reportImageGuide: 'प्रश्न, शर्त वा मूल्याङ्कन मापदण्ड देखिने छविले मस्यौदामा राम्रोसँग झल्काउन मद्दत गर्छ।',
    outputPresetLabel: 'आउटपुट ढाँचा',
    outputPresetHint: 'विश्वविद्यालयको नियम अनुसार',
    outputPresetDefault: 'पूर्वनिर्धारित',
    outputPresetWord: 'Word मैत्री (शीर्षक तह)',
    outputPresetNoBullets: 'बुलेट सूची नगर्नु',
    varyBtn: 'फरक शब्दमा',
    modeLabel: 'मोड',
    modeHint: 'पूर्णताको स्तर (बोल्ने शैलीभन्दा छुट्टै)',
    modeHonors: 'उत्कृष्ट विद्यार्थी (बढी पोलिश ठीक छ)',
    modeAverage: 'सामान्य विद्यार्थी',
    modeBarely: 'न्यूनतम / छिटो',
    charsLabel: 'लक्षित लम्बाइ',
    charsHint: '१००–४०००',
    charsHintFmt: '{{min}}–{{max}} अक्षर',
    charsHintFmtFree: '{{min}}–{{max}} अक्षर (निःशुल्क अधिकतम ४०००)',
    toneLabel: 'बोल्ने शैली',
    toneFormal: 'औपचारिक',
    toneCasual: 'प्राकृतिक',
    toneFrank: 'सिधा',
    toneConfident: 'आत्मविश्वासी',
    toneFriendly: 'सजिलो',
    qualityLabel: 'गुणस्तर',
    qualityHint: 'उच्च गुणस्तर: केवल Pro (तर्क स्पष्ट, “AI चम्किलो” होइन)',
    qualityNormal: 'मानक',
    qualityHigh: 'उच्च (Pro)',
    outputLangLabel: 'मस्यौदाको भाषा',
    outputLangHint: 'पेश गर्ने भाषा अनुसार छान्नुहोस्।',
    langOutEn: 'अङ्ग्रेजी',
    langOutVi: 'भियतनामी',
    langOutNe: 'नेपाली',
    langOutHi: 'हिन्दी',
    langOutZh: 'चिनियाँ (सरलीकृत)',
    langOutJa: 'जापानी',
    langOutId: 'बहासा इन्डोनेसिया',
    jaSentenceLabel: 'शैली (जापानी आउटपुटमा)',
    jaSentenceHint: 'अन्त्य: नम्र (です/ます) वा साधारण शैक्षिक (だ/である)।',
    jaStyleDesu: 'です・ます शैली',
    jaStyleDearu: 'だ・である शैली',
    genBtn: 'प्रतिवेदन बनाउनुहोस्',
    tweakGroupAria: 'बनाइएको मस्यौदा अलिकति मिलाउनुहोस्',
    tweakMoreNatural: 'अझ प्राकृतिक',
    tweakShorter: 'छोटो',
    tweakHeading: 'शीर्षक थप्नुहोस्',
    tweakWord: 'Word का लागि मिलाउनुहोस्',
    previewTitle: 'प्रतिवेदन मस्यौदा',
    previewLead: 'उत्पादित पाठ आफै सम्पादन गर्न सक्नुहुन्छ।',
    lastSettingsTitle: 'अन्तिम सेटिङ',
    copy: 'प्रतिलिपि',
    clear: 'खाली',
    outputPh: 'नतिजा यहाँ देखिनेछ',
    imageTitle: 'कभर छवि बनाउनुहोस् (beta)',
    imageLead: 'कभर वा स्लाइड। निःशुल्क: यो ब्राउजरमा दिनमा १ वटा।',
    imagePh: 'उदाहरण: शान्त रङ, पुस्तकालयमा नोट लिँदै विद्यार्थी',
    imageBtn: 'छवि बनाउनुहोस्',
    planLineFree: 'Free: पाठ दिनमा ३ पटक · छवि १ पटक',
    planLinePro: 'Pro: असीम · उच्च गुणस्तर मोड',
    footLogin: 'लगइन / दर्ता',
    footPro: 'Pro (भुक्तानी)',
    footTerms: 'सर्तहरू',
    footPrivacy: 'गोपनीयता',
    footTokusho: 'कानूनी',
    footContact: 'सम्पर्क',
    accountPanelTitle: 'खाता',
    accountPanelLead: 'साइन इन खाता व्यवस्थापन। मेटाउँदा इतिहास हराउँछ।',
    accountDeleteEmailLabel: 'इमेल पुष्टि',
    accountDeletePwLabel: 'पासवर्ड',
    deleteAccount: 'खाता मेटाउनुहोस्',
    deleteAccountConfirm: 'खाता स्थायी रूपमा मेटाउने?',
    deleteAccountOk: 'खाता मेटियो।',
    billingFail: 'बिलिङ पृष्ठ खोल्न सकिएन।',
    footNote:
      'यो उपकरण मात्र मस्यौदामा मद्दत गर्छ। पेश गर्नु अघि तथ्य, उद्धरण र विद्यालय नियम आफै जाँच गर्नुहोस्।',
    usagePro: 'Pro: पाठ र छवि असीम।',
    usageFmt: 'निःशुल्क बाँकी: पाठ {{tRem}} पटक · छवि {{iRem}} (मध्यरातमा रिसेट)',
    usageAnonFmt: 'निःशुल्क प्रयास: यो ब्राउजरमा बाँकी पाठ {{tRem}} · छवि {{iRem}} (लगइन बिना)',
    usageTrial: 'निःशुल्क प्रयास। खाता बिना सुरु गर्न सकिन्छ।',
    proCompare: {
      title: 'Free र Pro',
      lead: 'म्याद नजिकिँदा धेरै पटक सुधार गर्नका लागि',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'पाठ मस्यौदा',
      rowTextFree: '३/दिन',
      rowTextPro: 'असीम',
      rowImage: 'कभर छवि',
      rowImageFree: '१/दिन',
      rowImagePro: 'असीम',
      rowChars: 'लक्षित लम्बाइ',
      rowCharsFree: '४,००० सम्म',
      rowCharsPro: '१०,००० सम्म',
      rowQuality: 'उच्च गुणस्तर',
      rowQualityFree: '—',
      rowQualityPro: 'उपलब्ध',
      note: 'म्याद अघि दैनिक सीमा नसोची लामो मस्यौदा पनि पटक-पटक सुधार्न सकिन्छ।',
      cta: 'Pro लिनुहोस्',
      perk1: 'म्यादअघि पटकको चिन्ता बिना बनाउनुहोस्',
      perk2: 'लामा असाइनमेन्टका लागि १०,००० अक्षरसम्म',
      perk3: 'तर्क स्पष्ट बनाउने उच्च गुणस्तर मोड',
      badgeChars: 'Pro: १०,००० अक्षर',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'कृपया विषय लेख्नुहोस्।',
      generating: 'बनाइँदैछ… (लगभग १०–२० सेकेन्ड)',
      ok: 'भयो। पेश गर्नु अघि अलिक सम्पादन गर्नुहोस्।',
      genFail: 'बनाउन सकिएन।',
      aiBusy: 'AI सेवा व्यस्त छ। कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।',
      aiRetryCountdown: '{{n}} सेकेन्डपछि फेरि प्रयास गर्न सकिन्छ',
      logoutOk: 'लगआउट भयो।',
      imgPrompt: 'कृपया छवि विवरण लेख्नुहोस्।',
      imgGen: 'छवि बनाइँदैछ…',
      imgOk: 'छवि बनियो।',
      imgFail: 'छवि बनाउन सकिएन।',
      copyOk: 'प्रतिलिपि भयो।',
      copyFail: 'प्रतिलिपि असफल। हातले चयन गर्नुहोस्।',
      paySuccess: 'भुक्तानीका लागि धन्यवाद। नदेखिए पृष्ठ रिफ्रेस गर्नुहोस्।',
      payCancel: 'भुक्तानी रद्द भयो।',
      checkoutFail: 'चेकआउट सुरु गर्न सकिएन।',
      themeOrImageRequired: 'विषय लेख्नुहोस्, सन्दर्भ पाठ पेस्ट गर्नुहोस्, वा स्रोत छवि छान्नुहोस्।',
      stepThemeRequired: 'पहिले विषय लेख्नुहोस्।',
      imageTooLarge: 'छवि ४MB भन्दा सानो राख्नुहोस्।',
      imageMaxCount: 'अधिकतम ५ वटा स्रोत छवि।',
      imageTooLargeMulti: 'धेरै छवि: प्रत्येक २MB भन्दा सानो।',
      imageTotalTooLarge: 'छविको जम्मा आकार ठूलो छ। संख्या घटाउनुहोस् वा कम्प्रेस गर्नुहोस् (जम्मा करिब ८MB)।',
      sessionLoadFail: 'प्रयोग स्थिति लोड भएन। पृष्ठ पुन: लोड गर्नुहोस्।',
      tweakNeedPreview: 'पहिले “प्रतिवेदन बनाउनुहोस्” ले मस्यौदा देखाउनुहोस्, अनि यी बटन प्रयोग गर्नुहोस्।',
      charsOverFreeLimit: 'निःशुल्कमा अधिकतम ४००० अक्षर। लामो मस्यौदाका लागि Pro प्रयोग गर्नुहोस्।',
      charsOverMaxLimit: 'लक्षित लम्बाइ अधिकतम १०००० अक्षर।',
      charsBelowMin: 'लक्षित लम्बाइ कम्तीमा १०० अक्षर हुनुपर्छ।',
      freeLimitText: 'आजको निःशुल्क पाठ सीमा सकियो।',
      freeLimitImage: 'आजको निःशुल्क छवि सीमा सकियो।',
      proUpsellLead: 'म्याद अघि निरन्तर सुधार्न Pro ले खोल्छ:',
      proLoginNeedAccount:
        'Pro भुक्तानीका लागि लगइन चाहिन्छ। लगइनपछि सिधै भुक्तानी पृष्ठमा जानुहुन्छ। जारी राख्ने?',
      proLoginRedirecting: 'लगइन पृष्ठतर्फ जाँदै…',
      urlNeedUrl: 'URL लेख्नुहोस्।',
      urlLoading: 'पृष्ठ लोड हुँदैछ…',
      urlOk: 'सन्दर्भ सामग्रीमा थपियो।',
      urlFail: 'यो URL लोड गर्न सकिएन।',
      historyPlaceholder: 'इतिहासबाट छान्नुहोस्…',
      historyRestored: 'इतिहासबाट सेटिङ पुनर्स्थापना भयो।',
      sampleApplied: 'उदाहरण भरियो। अब बनाउन सकिन्छ।',
      charCountCurrent: 'हालको अक्षर: {{n}}',
      charCountTarget: 'लक्ष्य: {{n}}',
      charCountRemain: 'बाँकी: {{n}}',
      charCountRemainOver: 'बढी: {{n}}',
      charsOverTargetWarn: 'लक्ष्य भन्दा बढी। छोटो पार्नुहोस् वा फेरि बनाउनुहोस्।',
      funCharLine: 'लम्बाइ: {{current}} / {{target}} अक्षर',
      charsOverTargetRetrying: 'सीमा नाघ्यो—छोटो पार्दै…',
      charsAutoAdjusted: 'लक्षित लम्बाइमा मिल्ने गरी स्वत: मिलाइयो।'
    }
  },
  hi: {
    pageTitle: 'रेपोतासु AI — प्राकृतिक रिपोर्ट ड्राफ्ट',
    metaDesc:
      'विश्वविद्यालय छात्र व अंतर्राष्ट्रीय छात्रों के लिए। कम “टेलीप्रॉम्प्टर” जैसा AI, अधिक प्राकृतिक ड्राफ्ट। UI: JA / EN / ZH / VI / NE / HI / ID।',
    tagline: 'प्राकृतिक ड्राफ्ट, कम “क्यू-कार्ड” AI टोन',
    value1: 'प्राकृतिक लहजा',
    value2: 'फोन पर पूरा',
    value3: 'एक टैप कॉपी',
    funProfTitle: 'प्रोफ़ेसर “अलर्ट”',
    funGradeTitle: 'स्वाभाविकता',
    scoreProfLow: 'कम',
    scoreProfMid: 'मध्यम',
    scoreProfHigh: 'ज़्यादा',
    scoreGradeLow: 'और मेहनत चाहिए',
    scoreGradeMid: 'ठीक-ठाक',
    scoreGradeHigh: 'काफ़ी ठोस',
    funScoreDisclaimer: 'यह असली प्रोफ़ेसर का ग्रेड नहीं है—केवल AI का संकेत।',
    funScoreLoading: 'जाँच हो रही है…',
    funMeterAria: 'ड्राफ्ट के लिए संदर्भ संकेत',
    funMeterCardTitle: 'ड्राफ्ट चेक',
    funMeterTag: 'AI संकेत (संदर्भ)',
    funMeterAfterGen: 'जनरेट करने के बाद यहाँ दिखेगा।',
    draftChecklistTitle: 'जमा करने से पहले चेक',
    draftChecks: {
      assignment_fit: 'असाइनमेंट का जवाब देता है',
      evidence: 'तर्क / स्रोत की मजबूती',
      ai_tone: 'AI जैसी भाषा',
      citation: 'उद्धरण / तथ्य जांच'
    },
    draftCheckStatus: { ok: 'OK', warn: 'देखें', check: 'चेक' },
    localeLabel: 'भाषा',
    badgePlanFree: 'मुफ़्त',
    badgePlanPro: 'Pro',
    login: 'लॉग इन',
    proShort: 'Pro',
    upgrade: 'Pro लें',
    upgradeDone: 'पहले से Pro',
    billing: 'बिलिंग',
    logout: 'लॉग आउट',
    planFree: 'मुफ़्त आज़माएँ',
    reportTitle: 'रिपोर्ट ड्राफ्ट बनाएँ',
    reportLead: 'विषय, संदर्भ, छवियाँ और लंबाई भरकर बनाएँ; और विकल्प “विस्तृत सेटिंग” में।',
    stepTrailText: 'कार्य इनपुट → विस्तृत सेटिंग → परिणाम',
    stepTab1: '1. कार्य इनपुट',
    stepTab2: '2. विस्तृत सेटिंग',
    stepTab3: '3. परिणाम',
    stepTitle1: 'कार्य दर्ज करें',
    stepTitle2: 'विस्तृत सेटिंग',
    stepTitle3: 'जनरेट परिणाम',
    stepNext: 'आगे',
    stepBack: 'वापस',
    regenerateBtn: 'फिर से जनरेट करें',
    advancedSettingsLabel: '▼ विस्तृत सेटिंग',
    themeLabel: 'विषय',
    themeHint: 'असाइनमेंट टेक्स्ट चिपकाएँ',
    themePh: 'उदाहरण: जापान में कन्वीनियंस स्टोर संस्कृति के फायदे और चुनौतियाँ',
    sampleStarterTitle: 'उलझन हो तो उदाहरण से शुरू करें',
    sampleStarterHint: 'विषय, संदर्भ और लंबाई भर जाएगी',
    sampleConbini: 'कन्वीनियंस स्टोर संस्कृति',
    sampleCulture: 'अंतर-सांस्कृतिक संचार',
    sampleSdg: 'SDGs और विश्वविद्यालय जीवन',
    sampleDrafts: {
      conbini: {
        theme: 'जापान में कन्वीनियंस स्टोर संस्कृति से विश्वविद्यालय छात्रों के जीवन को मिलने वाले लाभ और चुनौतियाँ',
        referenceMaterial:
          'कन्वीनियंस स्टोर 24 घंटे सेवा, छोटी खरीद, बिल भुगतान, ATM और कॉपी मशीनों से दैनिक जीवन में मदद करते हैं। वहीं भोजन की बर्बादी, रात का श्रम और स्थानीय दुकानों पर प्रभाव जैसी चिंताएँ भी हैं।',
        targetChars: 900,
        outputLang: 'hi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: 'जापानी विश्वविद्यालयों में अंतरराष्ट्रीय छात्रों के अंतर-सांस्कृतिक संचार की चुनौतियाँ और उपाय',
        referenceMaterial:
          'अंतर-सांस्कृतिक संचार केवल भाषा क्षमता पर निर्भर नहीं करता। मौन को समझने का तरीका, सम्मानसूचक भाषा, समूह कार्य में भूमिकाएँ और प्रश्न पूछने का समय भी सीखने के अनुभव को प्रभावित करते हैं।',
        targetChars: 1000,
        outputLang: 'hi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'विश्वविद्यालय जीवन में SDGs को व्यवहार में लाने के तरीके',
        referenceMaterial:
          'पास के व्यवहारों में बिजली बचाना, अपनी बोतल इस्तेमाल करना, भोजन की बर्बादी घटाना, पुराने कपड़ों का उपयोग और स्थानीय स्वयंसेवा शामिल हैं। छोटे काम जारी रहें तो परिसर की संस्कृति पर असर डाल सकते हैं।',
        targetChars: 800,
        outputLang: 'hi',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: 'संदर्भ सामग्री / क्लास हैंडआउट',
    referenceHint: 'हैंडआउट, लेख या नोट यहाँ चिपकाएँ',
    urlBetaTitle: 'URL से आयात (beta)',
    urlBetaNote: 'कुछ साइटें लोड नहीं हो सकतीं। पाठ संदर्भ फ़ील्ड में जोड़ा जाएगा।',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: 'लोड करें',
    historyLabel: 'ड्राफ्ट इतिहास',
    historyHint: 'सेटिंग पुनर्स्थापित करें (छवियाँ शामिल नहीं)',
    reportImageLabel: 'असाइनमेंट शीट छवि (वैकल्पिक)',
    reportImageHint: 'असाइनमेंट निर्देश का स्क्रीनशॉट या फोटो। अधिकतम 5; कई हों तो प्रत्येक ~2MB, एकल में ~4MB तक।',
    reportImageClear: 'सभी छवियाँ हटाएँ',
    reportImagePick: 'असाइनमेंट छवि चुनें',
    reportImageGuide: 'प्रश्न, शर्तें या rubric दिखाने वाली छवि ड्राफ्ट में बेहतर जुड़ती है।',
    outputPresetLabel: 'आउटपुट प्रारूप',
    outputPresetHint: 'विश्वविद्यालय नियमों के अनुसार',
    outputPresetDefault: 'डिफ़ॉल्ट',
    outputPresetWord: 'Word अनुकूल (शीर्षक स्तर)',
    outputPresetNoBullets: 'बिना बुलेट सूची',
    varyBtn: 'अलग अंदाज़',
    modeLabel: 'मोड',
    modeHint: 'पूर्णता स्तर (लहजे से अलग)',
    modeHonors: 'मेधावी (अधिक पॉलिश ठीक है)',
    modeAverage: 'सामान्य छात्र',
    modeBarely: 'न्यूनतम / तेज़',
    charsLabel: 'लक्ष्य लंबाई',
    charsHint: '100–4000',
    charsHintFmt: '{{min}}–{{max}} अक्षर',
    charsHintFmtFree: '{{min}}–{{max}} अक्षर (मुफ़्त अधिकतम 4000)',
    toneLabel: 'लहजा',
    toneFormal: 'औपचारिक',
    toneCasual: 'प्राकृतिक',
    toneFrank: 'सीधा',
    toneConfident: 'आत्मविश्वासपूर्ण',
    toneFriendly: 'सरल',
    qualityLabel: 'गुणवत्ता',
    qualityHint: 'उच्च गुणवत्ता: केवल Pro (स्पष्ट तर्क, अधिक “AI चमक” नहीं)',
    qualityNormal: 'मानक',
    qualityHigh: 'उच्च (Pro)',
    outputLangLabel: 'ड्राफ्ट भाषा',
    outputLangHint: 'वह भाषा चुनें जिसमें आप जमा करेंगे।',
    langOutEn: 'अंग्रेज़ी',
    langOutVi: 'वियतनामी',
    langOutNe: 'नेपाली',
    langOutHi: 'हिंदी',
    langOutZh: 'चीनी (सरलीकृत)',
    langOutJa: 'जापानी',
    langOutId: 'बहासा इन्डोनेशिया',
    jaSentenceLabel: 'लहजा (जापानी आउटपुट पर)',
    jaSentenceHint: 'विनम्र (です/ます) बनाम सादा शैक्षिक (だ/である) अंत।',
    jaStyleDesu: 'です・ます शैली',
    jaStyleDearu: 'だ・である शैली',
    genBtn: 'रिपोर्ट बनाएँ',
    tweakGroupAria: 'बने हुए ड्राफ्ट को थोड़ा ठीक करें',
    tweakMoreNatural: 'ज़्यादा स्वाभाविक',
    tweakShorter: 'छोटा',
    tweakHeading: 'हेडिंग जोड़ें',
    tweakWord: 'Word के लिए फॉर्मेट करें',
    previewTitle: 'रिपोर्ट ड्राफ्ट',
    previewLead: 'उत्पन्न पाठ संपादित करें।',
    lastSettingsTitle: 'अंतिम सेटिंग',
    copy: 'कॉपी',
    clear: 'साफ़ करें',
    outputPh: 'परिणाम यहाँ दिखेगा',
    imageTitle: 'कवर छवि बनाएँ (β)',
    imageLead: 'कवर या स्लाइड। मुफ़्त: इस ब्राउज़र में प्रति दिन 1।',
    imagePh: 'उदाहरण: शांत रंग, पुस्तकालय में नोट लेता छात्र',
    imageBtn: 'छवि बनाएँ',
    planLineFree: 'Free: 3 टेक्स्ट/दिन · 1 छवि/दिन',
    planLinePro: 'Pro: असीम · उच्च गुणवत्ता मोड',
    footLogin: 'लॉग इन / साइन अप',
    footPro: 'Pro (बिलिंग)',
    footTerms: 'नियम',
    footPrivacy: 'गोपनीयता',
    footTokusho: 'कानूनी',
    footContact: 'संपर्क',
    accountPanelTitle: 'खाता',
    accountPanelLead: 'साइन इन खाता प्रबंधन। हटाने पर इतिहास मिटेगा।',
    accountDeleteEmailLabel: 'ईमेल पुष्टि',
    accountDeletePwLabel: 'पासवर्ड',
    deleteAccount: 'खाता हटाएँ',
    deleteAccountConfirm: 'खाता स्थायी रूप से हटाएँ?',
    deleteAccountOk: 'खाता हटा दिया गया।',
    billingFail: 'बिलिंग पेज नहीं खुला।',
    footNote:
      'यह केवल ड्राफ्ट सहायक है। जमा से पहले तथ्य, उद्धरण और स्कूल नियम स्वयं जाँचें।',
    usagePro: 'Pro: टेक्स्ट और छवि असीम।',
    usageFmt: 'मुफ़्त बाकी: टेक्स्ट {{tRem}} बार · छवि {{iRem}} (मध्यरात्रि रीसेट)',
    usageAnonFmt: 'मुफ़्त आज़माएँ: इस ब्राउज़र में बाकी टेक्स्ट {{tRem}} · छवि {{iRem}} (बिना लॉग इन)',
    usageTrial: 'मुफ़्त में आज़माएँ। बिना खाते शुरू कर सकते हैं।',
    proCompare: {
      title: 'Free और Pro',
      lead: 'डेडलाइन से पहले कई बार सुधार करने के लिए',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'टेक्स्ट ड्राफ्ट',
      rowTextFree: '3/दिन',
      rowTextPro: 'असीम',
      rowImage: 'कवर छवि',
      rowImageFree: '1/दिन',
      rowImagePro: 'असीम',
      rowChars: 'लक्ष्य लंबाई',
      rowCharsFree: '4,000 तक',
      rowCharsPro: '10,000 तक',
      rowQuality: 'उच्च गुणवत्ता',
      rowQualityFree: '—',
      rowQualityPro: 'उपलब्ध',
      note: 'डेडलाइन से पहले दैनिक सीमा की चिंता बिना लंबे ड्राफ्ट सुधारते रहें।',
      cta: 'Pro लें',
      perk1: 'डेडलाइन से पहले सीमा की चिंता बिना बनाएँ',
      perk2: 'लंबे असाइनमेंट के लिए 10,000 अक्षर तक',
      perk3: 'तर्क साफ़ करने वाला उच्च गुणवत्ता मोड',
      badgeChars: 'Pro: 10,000 अक्षर',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'कृपया विषय दर्ज करें।',
      generating: 'बन रहा है… (लगभग 10–20 सेकंड)',
      ok: 'हो गया। जमा से पहले थोड़ा संपादित करें।',
      genFail: 'जनरेशन विफल।',
      aiBusy: 'AI सेवा व्यस्त है। कृपया थोड़ा इंतज़ार करके फिर कोशिश करें।',
      aiRetryCountdown: '{{n}} सेकंड बाद फिर कोशिश कर सकते हैं',
      logoutOk: 'लॉग आउट हो गया।',
      imgPrompt: 'कृपया छवि प्रॉम्प्ट दर्ज करें।',
      imgGen: 'छवि बन रही है…',
      imgOk: 'छवि बन गई।',
      imgFail: 'छवि विफल।',
      copyOk: 'कॉपी हो गया।',
      copyFail: 'कॉपी विफल। मैन्युअल चयन करें।',
      paySuccess: 'भुगतान के लिए धन्यवाद। न दिखे तो पृष्ठ रीलोड करें।',
      payCancel: 'भुगतान रद्द।',
      checkoutFail: 'चेकआउट शुरू नहीं हो सका।',
      themeOrImageRequired: 'विषय दर्ज करें, संदर्भ पाठ चिपकाएँ, या स्रोत छवि चुनें।',
      stepThemeRequired: 'पहले विषय दर्ज करें।',
      imageTooLarge: 'छवि 4MB से छोटी रखें।',
      imageMaxCount: 'अधिकतम 5 स्रोत छवियाँ।',
      imageTooLargeMulti: 'कई छवियों पर प्रत्येक 2MB से कम रखें।',
      imageTotalTooLarge: 'कुल छवि आकार बहुत बड़ा है। संख्या घटाएँ या संपीड़ित करें (कुल लगभग 8MB)।',
      sessionLoadFail: 'उपयोग स्थिति लोड नहीं हुई। पेज फिर से लोड करें।',
      tweakNeedPreview: 'पहले “रिपोर्ट बनाएँ” से ड्राफ्ट दिखाएँ, फिर ये बटन आज़माएँ।',
      charsOverFreeLimit: 'मुफ़्त में अधिकतम 4000 अक्षर। लंबे ड्राफ्ट के लिए Pro आज़माएँ।',
      charsOverMaxLimit: 'लक्ष्य लंबाई अधिकतम 10000 अक्षर।',
      charsBelowMin: 'लक्ष्य लंबाई कम से कम 100 अक्षर होनी चाहिए।',
      freeLimitText: 'आज की मुफ़्त टेक्स्ट सीमा समाप्त हो गई।',
      freeLimitImage: 'आज की मुफ़्त छवि सीमा समाप्त हो गई।',
      proUpsellLead: 'डेडलाइन से पहले लगातार सुधार के लिए Pro खोलता है:',
      proLoginNeedAccount:
        'Pro भुगतान के लिए लॉग इन ज़रूरी है। लॉग इन के बाद आप सीधे चेकआउट पर जाएँगे। जारी रखें?',
      proLoginRedirecting: 'लॉग इन पेज पर भेज रहे हैं…',
      urlNeedUrl: 'URL दर्ज करें।',
      urlLoading: 'पेज लोड हो रहा है…',
      urlOk: 'संदर्भ फ़ील्ड में जोड़ा गया।',
      urlFail: 'यह URL लोड नहीं हो सका।',
      historyPlaceholder: 'इतिहास से चुनें…',
      historyRestored: 'इतिहास से सेटिंग पुनर्स्थापित की गई।',
      sampleApplied: 'उदाहरण भर दिया गया। अब जनरेट कर सकते हैं।',
      charCountCurrent: 'वर्तमान अक्षर: {{n}}',
      charCountTarget: 'लक्ष्य: {{n}}',
      charCountRemain: 'शेष: {{n}}',
      charCountRemainOver: 'अधिक: {{n}}',
      charsOverTargetWarn: 'लक्ष्य से अधिक। छोटा करें या फिर से बनाएँ।',
      funCharLine: 'लंबाई: {{current}} / {{target}} अक्षर',
      charsOverTargetRetrying: 'सीमा पार—छोटा किया जा रहा है…',
      charsAutoAdjusted: 'लक्ष्य लंबाई में फिट करने के लिए अपने-आप समायोजित किया गया।'
    }
  },
  id: {
    pageTitle: 'Repotasu AI — Draf laporan alami',
    metaDesc:
      'Untuk mahasiswa & mahasiswa internasional. AI yang lebih alami, kurang seperti teleprompter. UI: JA / EN / ZH / VI / NE / HI / ID.',
    tagline: 'Draf alami dengan nada AI yang kurang seperti kartu bacaan',
    value1: 'Nada alami',
    value2: 'Selesai di ponsel Anda',
    value3: 'Salin sekali ketuk',
    funProfTitle: 'Radar dosen',
    funGradeTitle: 'Keluwesan',
    scoreProfLow: 'rendah',
    scoreProfMid: 'sedang',
    scoreProfHigh: 'tinggi',
    scoreGradeLow: 'perlu dorongan',
    scoreGradeMid: 'lumayan',
    scoreGradeHigh: 'cukup solid',
    funScoreDisclaimer: 'Bukan nilai dosen sungguhan—hanya perkiraan kasar AI.',
    funScoreLoading: 'Menilai…',
    funMeterAria: 'Indikator referensi untuk draf Anda',
    funMeterCardTitle: 'Tes cepat draf',
    funMeterTag: 'Kesan AI (acuan)',
    funMeterAfterGen: 'Muncul di sini setelah Anda membuat.',
    draftChecklistTitle: 'Cek sebelum dikumpulkan',
    draftChecks: {
      assignment_fit: 'Menjawab tugas',
      evidence: 'Kekuatan bukti / sumber',
      ai_tone: 'Frasa terasa AI',
      citation: 'Kutipan / cek fakta'
    },
    draftCheckStatus: { ok: 'OK', warn: 'Tinjau', check: 'Cek' },
    localeLabel: 'Bahasa',
    badgePlanFree: 'Gratis',
    badgePlanPro: 'Pro',
    login: 'Masuk',
    proShort: 'Pro',
    upgrade: 'Langganan Pro',
    upgradeDone: 'Sudah Pro',
    billing: 'Tagihan',
    logout: 'Keluar',
    planFree: 'Coba gratis',
    reportTitle: 'Buat draf laporan Anda',
    reportLead: 'Tambahkan topik, referensi, gambar, dan panjang—lalu buat. Lainnya ada di “Pengaturan lanjutan”.',
    stepTrailText: 'Input tugas → Pengaturan detail → Hasil',
    stepTab1: '1. Input Tugas',
    stepTab2: '2. Pengaturan Detail',
    stepTab3: '3. Hasil',
    stepTitle1: 'Masukkan tugas',
    stepTitle2: 'Pengaturan detail',
    stepTitle3: 'Hasil generasi',
    stepNext: 'Lanjut',
    stepBack: 'Kembali',
    regenerateBtn: 'Buat ulang',
    advancedSettingsLabel: '▼ Pengaturan lanjutan',
    themeLabel: 'Topik',
    themeHint: 'Tempel teks tugas apa adanya',
    themePh: 'mis. Manfaat dan tantangan budaya minimarket di Jepang',
    sampleStarterTitle: 'Mulai dari contoh',
    sampleStarterHint: 'Mengisi topik, referensi, dan panjang',
    sampleConbini: 'Budaya minimarket',
    sampleCulture: 'Komunikasi lintas budaya',
    sampleSdg: 'SDGs di kampus',
    sampleDrafts: {
      conbini: {
        theme: 'Manfaat dan tantangan budaya minimarket bagi kehidupan mahasiswa di Jepang',
        referenceMaterial:
          'Minimarket mendukung kehidupan sehari-hari melalui layanan 24 jam, pembelian kecil, pembayaran tagihan, ATM, dan mesin fotokopi. Di sisi lain, ada kekhawatiran tentang limbah makanan, kerja larut malam, dan dampak pada toko lokal.',
        targetChars: 900,
        outputLang: 'id',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      culture: {
        theme: 'Tantangan dan cara menghadapi komunikasi lintas budaya bagi mahasiswa internasional di universitas Jepang',
        referenceMaterial:
          'Komunikasi lintas budaya tidak hanya dipengaruhi kemampuan bahasa, tetapi juga cara memahami diam, bahasa hormat, pembagian peran dalam kerja kelompok, dan waktu bertanya.',
        targetChars: 1000,
        outputLang: 'id',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      },
      sdg: {
        theme: 'Cara menerapkan SDGs dalam kehidupan universitas sehari-hari',
        referenceMaterial:
          'Praktik dekat meliputi menghemat listrik, memakai botol minum sendiri, mengurangi limbah makanan, memakai ulang pakaian, dan ikut kegiatan sukarela lokal. Tindakan kecil yang berlanjut dapat memengaruhi budaya kampus.',
        targetChars: 800,
        outputLang: 'id',
        studentMode: 'average',
        tone: 'casual',
        outputPreset: 'default'
      }
    },
    referenceLabel: 'Materi referensi / teks materi kelas',
    referenceHint: 'Tempel materi cetak, artikel, atau catatan Anda',
    urlBetaTitle: 'Impor dari URL (beta)',
    urlBetaNote: 'Beberapa situs mungkin tidak tersedia. Teks ditambahkan ke kolom referensi.',
    urlPlaceholder: 'https://example.com/article',
    urlLoadBtn: 'Muat',
    historyLabel: 'Riwayat draf',
    historyHint: 'Pulihkan pengaturan (tanpa gambar)',
    reportImageLabel: 'Gambar lembar tugas (opsional)',
    reportImageHint:
      'Tangkapan layar instruksi atau foto lembar tugas. Hingga 5 gambar (~2MB masing-masing jika banyak; satu gambar hingga ~4MB).',
    reportImageClear: 'Hapus semua gambar',
    reportImagePick: 'Pilih gambar tugas',
    reportImageGuide: 'Gambar yang menampilkan pertanyaan, syarat, atau rubrik lebih mudah tercermin di draf.',
    outputPresetLabel: 'Format keluaran',
    outputPresetHint: 'Sesuaikan dengan persyaratan mata kuliah',
    outputPresetDefault: 'Standar',
    outputPresetWord: 'Ramah Word (tingkat judul)',
    outputPresetNoBullets: 'Tanpa daftar poin',
    varyBtn: 'Kata lain',
    modeLabel: 'Mode',
    modeHint: 'Seberapa halus rasanya (terpisah dari suara)',
    modeHonors: 'Murid berprestasi (lebih rapi boleh)',
    modeAverage: 'Mahasiswa biasa',
    modeBarely: 'Minimum / cepat',
    charsLabel: 'Panjang target',
    charsHint: '100–4000',
    charsHintFmt: '{{min}}–{{max}} karakter',
    charsHintFmtFree: '{{min}}–{{max}} karakter (gratis maks. 4000)',
    toneLabel: 'Suara (nada)',
    toneFormal: 'Formal',
    toneCasual: 'Natural',
    toneFrank: 'Blak-blakan',
    toneConfident: 'Percaya diri',
    toneFriendly: 'Lebih lembut',
    qualityLabel: 'Kualitas',
    qualityHint: 'Kualitas tinggi: hanya Pro (logika lebih jelas, tanpa “kemilau AI”)',
    qualityNormal: 'Standar',
    qualityHigh: 'Tinggi (Pro)',
    outputLangLabel: 'Bahasa draf',
    outputLangHint: 'Sesuaikan dengan bahasa yang akan Anda kumpulkan.',
    langOutEn: 'Bahasa Inggris',
    langOutVi: 'Bahasa Vietnam',
    langOutNe: 'Bahasa Nepal',
    langOutHi: 'Bahasa Hindi',
    langOutZh: 'Bahasa Tionghoa (Sederhana)',
    langOutJa: 'Bahasa Jepang',
    langOutId: 'Bahasa Indonesia',
    jaSentenceLabel: 'Gaya kalimat (keluaran bahasa Jepang)',
    jaSentenceHint: 'Sopan (desu/masu) vs akademik biasa (da/dearu).',
    jaStyleDesu: 'Sopan (です・ます)',
    jaStyleDearu: 'Biasa (だ・である)',
    genBtn: 'Buat laporan',
    tweakGroupAria: 'Sempurnakan draf yang sudah dibuat',
    tweakMoreNatural: 'Lebih alami',
    tweakShorter: 'Lebih pendek',
    tweakHeading: 'Tambahkan heading',
    tweakWord: 'Rapikan untuk Word',
    previewTitle: 'Draf laporan',
    previewLead: 'Edit teks yang dihasilkan sesuka Anda.',
    lastSettingsTitle: 'Pengaturan terakhir',
    copy: 'Salin',
    clear: 'Hapus',
    outputPh: 'Teks yang dihasilkan muncul di sini',
    imageTitle: 'Buat gambar sampul (beta)',
    imageLead: 'Untuk sampul atau slide. Gratis: 1 per hari di browser ini.',
    imagePh: 'mis. warna tenang, mahasiswa mencatat di perpustakaan',
    imageBtn: 'Buat gambar',
    planLineFree: 'Gratis: 3 teks/hari · 1 gambar/hari',
    planLinePro: 'Pro: tanpa batas · mode kualitas tinggi',
    footLogin: 'Masuk / Daftar',
    footPro: 'Pro (pembayaran)',
    footTerms: 'Ketentuan',
    footPrivacy: 'Privasi',
    footTokusho: 'Hukum',
    footContact: 'Kontak',
    accountPanelTitle: 'Akun',
    accountPanelLead: 'Kelola akun masuk. Hapus akan menghapus riwayat draf.',
    accountDeleteEmailLabel: 'Konfirmasi email',
    accountDeletePwLabel: 'Kata sandi',
    deleteAccount: 'Hapus akun',
    deleteAccountConfirm: 'Hapus akun secara permanen?',
    deleteAccountOk: 'Akun dihapus.',
    billingFail: 'Tidak bisa membuka halaman tagihan.',
    footNote:
      'Alat ini hanya membantu draf. Harap verifikasi fakta, kutipan, dan aturan sekolah sebelum mengumpulkan.',
    usagePro: 'Pro: teks dan gambar tanpa batas.',
    usageFmt: 'Gratis tersisa: {{tRem}} kali teks · {{iRem}} slot gambar (reset tengah malam)',
    usageAnonFmt: 'Coba gratis di browser ini: sisa {{tRem}} teks · {{iRem}} gambar (tanpa login)',
    usageTrial: 'Gratis dicoba. Anda bisa mulai tanpa membuat akun.',
    proCompare: {
      title: 'Free vs Pro',
      lead: 'Untuk minggu tenggat saat perlu banyak revisi',
      colFree: 'Free',
      colPro: 'Pro',
      rowText: 'Draf teks',
      rowTextFree: '3/hari',
      rowTextPro: 'Tanpa batas',
      rowImage: 'Gambar sampul',
      rowImageFree: '1/hari',
      rowImagePro: 'Tanpa batas',
      rowChars: 'Panjang target',
      rowCharsFree: 'hingga 4.000',
      rowCharsPro: 'hingga 10.000',
      rowQuality: 'Kualitas tinggi',
      rowQualityFree: '—',
      rowQualityPro: 'Ya',
      note: 'Terus revisi draf panjang sebelum tenggat tanpa khawatir batas harian.',
      cta: 'Langganan Pro',
      perk1: 'Buat bebas sebelum tenggat',
      perk2: 'Hingga 10.000 karakter untuk tugas panjang',
      perk3: 'Mode kualitas tinggi untuk logika lebih jelas',
      badgeChars: 'Pro: 10.000 karakter',
      badgeQuality: 'Pro'
    },
    msg: {
      themeRequired: 'Harap masukkan topik.',
      generating: 'Membuat… (sekitar 10–20 detik)',
      ok: 'Selesai. Sunting sedikit sebelum mengumpulkan.',
      genFail: 'Pembuatan gagal.',
      aiBusy: 'Layanan AI sedang sibuk. Tunggu sebentar lalu coba lagi.',
      aiRetryCountdown: 'Anda dapat mencoba lagi dalam {{n}} detik',
      logoutOk: 'Anda telah keluar.',
      imgPrompt: 'Harap masukkan deskripsi gambar.',
      imgGen: 'Membuat gambar…',
      imgOk: 'Gambar dibuat.',
      imgFail: 'Pembuatan gambar gagal.',
      copyOk: 'Disalin.',
      copyFail: 'Salin gagal. Pilih dan salin secara manual.',
      paySuccess: 'Terima kasih atas pembayaran Anda. Muat ulang jika belum terlihat.',
      payCancel: 'Pembayaran dibatalkan.',
      checkoutFail: 'Tidak dapat memulai pembayaran.',
      themeOrImageRequired: 'Masukkan topik, tempel materi referensi, atau pilih gambar sumber.',
      stepThemeRequired: 'Silakan masukkan topik terlebih dahulu.',
      imageTooLarge: 'Gunakan gambar di bawah 4MB.',
      imageMaxCount: 'Anda dapat melampirkan hingga 5 gambar sumber.',
      imageTooLargeMulti: 'Jika banyak gambar, pertahankan setiap file di bawah 2MB.',
      imageTotalTooLarge: 'Total ukuran gambar terlalu besar. Kurangi jumlah atau kompres (total sekitar 8MB).',
      sessionLoadFail: 'Tidak dapat memuat status penggunaan. Muat ulang halaman.',
      tweakNeedPreview: 'Buat draf dengan “Buat laporan” terlebih dahulu, lalu gunakan tombol ini.',
      charsOverFreeLimit: 'Gratis maks. 4000 karakter. Gunakan Pro untuk draf lebih panjang.',
      charsOverMaxLimit: 'Panjang target maks. 10000 karakter.',
      charsBelowMin: 'Panjang target minimal 100 karakter.',
      freeLimitText: 'Kuota teks gratis hari ini sudah habis.',
      freeLimitImage: 'Kuota gambar gratis hari ini sudah habis.',
      proUpsellLead: 'Untuk revisi menjelang tenggat, Pro membuka:',
      proLoginNeedAccount:
        'Checkout Pro memerlukan akun. Setelah masuk, Anda akan langsung lanjut ke pembayaran. Lanjutkan?',
      proLoginRedirecting: 'Mengalihkan ke halaman masuk…',
      urlNeedUrl: 'Masukkan URL.',
      urlLoading: 'Memuat halaman…',
      urlOk: 'Ditambahkan ke kolom referensi.',
      urlFail: 'URL tidak dapat dimuat.',
      historyPlaceholder: 'Pilih dari riwayat…',
      historyRestored: 'Pengaturan dipulihkan dari riwayat.',
      sampleApplied: 'Contoh sudah diisi. Anda bisa membuat sekarang.',
      charCountCurrent: 'Saat ini: {{n}} karakter',
      charCountTarget: 'Target: {{n}} karakter',
      charCountRemain: 'Sisa: {{n}} karakter',
      charCountRemainOver: 'Lebih: {{n}} karakter',
      charsOverTargetWarn: 'Melebihi target. Persingkat atau buat ulang.',
      funCharLine: 'Panjang: {{current}} / {{target}} karakter',
      charsOverTargetRetrying: 'Melebihi batas—memperpendek…',
      charsAutoAdjusted: 'Disesuaikan otomatis agar sesuai panjang target.'
    }
  }
};

/** @param {Locale} loc @param {'prof'|'grade'} which @param {'low'|'medium'|'high'|null|undefined} level */
export function funStripLine(loc, which, level) {
  const S = STR[loc] ?? STR.ja;
  const em = '\u2014';
  const title = which === 'prof' ? S.funProfTitle : S.funGradeTitle;
  if (!level) return `${title}：${em}`;
  const lv = level === 'low' || level === 'medium' || level === 'high' ? level : 'medium';
  const label =
    which === 'prof'
      ? lv === 'low'
        ? S.scoreProfLow
        : lv === 'high'
          ? S.scoreProfHigh
          : S.scoreProfMid
      : lv === 'low'
        ? S.scoreGradeLow
        : lv === 'high'
          ? S.scoreGradeHigh
          : S.scoreGradeMid;
  return `${title}：${label}`;
}

/** Prof/grade word label only (for meter badges). */
export function funScoreLevelLabel(loc, which, level) {
  const S = STR[loc] ?? STR.ja;
  const em = '\u2014';
  if (!level) return em;
  const lv = level === 'low' || level === 'medium' || level === 'high' ? level : 'medium';
  if (which === 'prof') {
    return lv === 'low' ? S.scoreProfLow : lv === 'high' ? S.scoreProfHigh : S.scoreProfMid;
  }
  return lv === 'low' ? S.scoreGradeLow : lv === 'high' ? S.scoreGradeHigh : S.scoreGradeMid;
}

/** Compact letter hint for submission “feel” (not a real grade). */
export function funGradeLetterGrade(level) {
  const em = '\u2014';
  if (!level) return em;
  const lv = level === 'low' || level === 'medium' || level === 'high' ? level : 'medium';
  if (lv === 'high') return 'A';
  if (lv === 'low') return 'C+';
  return 'B+';
}

/** @param {Locale} loc */
export function funScoreDisclaimer(loc) {
  return (STR[loc] ?? STR.ja).funScoreDisclaimer;
}

const LOGIN = {
  ja: {
    pageTitle: 'ログイン・新規登録｜レポたすAI',
    metaDesc: 'Pro 課金・アカウント管理のためのログイン',
    promo: '最初はこの画面です。ログイン・新規登録するか、下のボタンでログインなしでメインへ進めます。',
    skipLogin: 'ログインせずに始める',
    tabIn: 'ログイン',
    tabUp: '新規登録',
    modeHeadingIn: 'ログイン',
    modeHeadingUp: '新規登録',
    modeHintIn: 'すでに登録したメールとパスワードで入ります。',
    modeHintUp: 'はじめての方はこちら。メールとパスワード（6文字以上）でアカウントを作成します。',
    proIntentBanner: 'Pro購入の続きです。ログイン後、そのまま決済ページへ進みます。',
    googleLabel: 'Googleでログイン',
    googleLabelUp: 'Googleで登録',
    googleHint: '※Googleログインは未設定です。メール・パスワードをご利用ください。',
    googleHintUp: '※Google登録は未設定です。メール・パスワードをご利用ください。',
    googleHintOn: 'メール・パスワードでも利用できます。',
    googleHintUpOn: 'メール・パスワードでも登録できます。',
    or: 'または',
    forgotQuestion: 'パスワードをお忘れですか？',
    forgotLink: 'パスワードを忘れた方',
    tabHint: '迷ったら「ログイン」＝前に作ったアカウント、「新規登録」＝はじめての方です。',
    submitIn: 'ログインする',
    submitUp: '登録する',
    switchToUp: '新規登録',
    switchToIn: 'ログイン',
    promptNoAccount: 'アカウントをお持ちではありませんか？',
    promptHasAccount: 'すでにアカウントをお持ちですか？',
    emailLabel: 'メールアドレス',
    passwordLabel: 'パスワード',
    ariaAuthTabs: 'ログインか新規登録かを選ぶ',
    localeLabel: '言語',
    msg: {
      valBoth: 'メールとパスワードの両方を入力してください。',
      valPw6: '新規登録ではパスワードを6文字以上にしてください。',
      stIn: 'ログイン処理中…',
      stUp: '登録処理中…',
      authFail: '認証に失敗しました。',
      sessionFail: 'ログインできましたがセッションを確認できませんでした。Cookie を許可して再試行してください。',
      stCheckout: 'ログインできました。決済ページへ移動します…',
      stTop: 'トップへ移動します…',
      alreadyLoggedIn: 'すでにログインしています。上部の「レポたすAI」からメイン画面へ戻れます。',
      forgotMsg: 'パスワード再設定は準備中です。お手数ですが別のパスワードで新規登録してください。',
      gIn: 'Googleログインは未設定です。メールとパスワードをご利用ください。',
      gUp: 'Google登録は未設定です。メールとパスワードをご利用ください。',
      googleAuthFail: 'Googleログインに失敗しました。もう一度お試しください。',
      googleAuthDenied: 'Googleログインがキャンセルされました。',
      googleAuthDisabled: 'Googleログインは未設定です。',
      checkoutFail: '決済ページの作成に失敗しました。トップに戻ってから再度お試しください。',
      toggleShow: '隠す',
      toggleHide: '表示'
    }
  },
  en: {
    pageTitle: 'Sign in · Sign up — Repotasu AI',
    metaDesc: 'Sign in for Pro billing & account management.',
    promo: 'Start here. Sign in or sign up — or open the app without an account.',
    skipLogin: 'Continue without signing in',
    tabIn: 'Sign in',
    tabUp: 'Sign up',
    modeHeadingIn: 'Sign in',
    modeHeadingUp: 'Sign up',
    modeHintIn: 'Use the email and password you registered.',
    modeHintUp: 'New here? Create an account with email and password (6+ characters).',
    proIntentBanner: 'This is for Pro purchase. After sign-in, you will continue to checkout.',
    googleLabel: 'Sign in with Google',
    googleLabelUp: 'Sign up with Google',
    googleHint: 'Google sign-in is not configured. Use email & password.',
    googleHintUp: 'Google sign-up is not configured. Use email & password.',
    googleHintOn: 'You can also use email & password.',
    googleHintUpOn: 'You can also register with email & password.',
    or: 'or',
    forgotQuestion: 'Forgot password? ',
    forgotLink: 'Forgot password?',
    tabHint: 'Sign in = existing account · Sign up = first time',
    submitIn: 'Sign in',
    submitUp: 'Create account',
    switchToUp: 'Sign up',
    switchToIn: 'Sign in',
    promptNoAccount: "Don't have an account?",
    promptHasAccount: 'Already have an account?',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    ariaAuthTabs: 'Choose sign in or sign up',
    localeLabel: 'Language',
    msg: {
      valBoth: 'Enter both email and password.',
      valPw6: 'Password must be at least 6 characters to sign up.',
      stIn: 'Signing in…',
      stUp: 'Signing up…',
      authFail: 'Authentication failed.',
      sessionFail: 'Signed in, but we could not verify your session. Allow cookies and try again.',
      stCheckout: 'Signed in. Redirecting to checkout…',
      stTop: 'Redirecting to home…',
      alreadyLoggedIn: 'You are already signed in. Use the brand link at the top to return to the app.',
      forgotMsg: 'Password reset is not ready yet. Please sign up again with a new password.',
      gIn: 'Google sign-in is not configured. Use email and password.',
      gUp: 'Google sign-up is not configured. Use email and password.',
      googleAuthFail: 'Google sign-in failed. Please try again.',
      googleAuthDenied: 'Google sign-in was cancelled.',
      googleAuthDisabled: 'Google sign-in is not configured.',
      checkoutFail: 'Could not start checkout. Go back to home and try again.',
      toggleShow: 'Hide',
      toggleHide: 'Show'
    }
  },
  zh: {
    pageTitle: '登录·注册｜レポたすAI',
    metaDesc: '用于 Pro 付费与账户管理的登录。',
    promo: '请在此登录或注册；也可直接进入主功能试用。',
    skipLogin: '不登录，开始使用',
    tabIn: '登录',
    tabUp: '注册',
    modeHeadingIn: '登录',
    modeHeadingUp: '注册',
    modeHintIn: '使用已注册的邮箱与密码。',
    modeHintUp: '新用户请用邮箱与密码（至少 6 位）创建账号。',
    proIntentBanner: '这是 Pro 购买流程。登录后会直接继续到付款页面。',
    googleLabel: '使用 Google 登录',
    googleLabelUp: '使用 Google 注册',
    googleHint: 'Google 登录未配置。请使用邮箱与密码。',
    googleHintUp: 'Google 注册未配置。请使用邮箱与密码。',
    googleHintOn: '也可使用邮箱与密码。',
    googleHintUpOn: '也可使用邮箱与密码注册。',
    or: '或',
    forgotQuestion: '忘记密码？',
    forgotLink: '重置（准备中）',
    tabHint: '登录＝已有账号 · 注册＝首次使用',
    submitIn: '登录',
    submitUp: '注册',
    switchToUp: '注册',
    switchToIn: '登录',
    promptNoAccount: '还没有账号？',
    promptHasAccount: '已有账号？',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    ariaAuthTabs: '选择登录或注册',
    localeLabel: '界面语言',
    msg: {
      valBoth: '请输入邮箱和密码。',
      valPw6: '注册时密码至少 6 位。',
      stIn: '登录中…',
      stUp: '注册中…',
      authFail: '认证失败。',
      sessionFail: '已登录，但无法确认会话。请允许 Cookie 后重试。',
      stCheckout: '已登录。正在跳转付款…',
      stTop: '正在返回首页…',
      forgotMsg: '密码重置尚未开放。请用新密码重新注册。',
      gIn: 'Google 登录未配置。请使用邮箱与密码。',
      gUp: 'Google 注册未配置。请使用邮箱与密码。',
      googleAuthFail: 'Google 登录失败。请重试。',
      googleAuthDenied: '已取消 Google 登录。',
      googleAuthDisabled: 'Google 登录未配置。',
      checkoutFail: '无法打开结账页面。请返回首页后再试。',
      toggleShow: '隐藏',
      toggleHide: '显示'
    }
  },
  vi: {
    pageTitle: 'Đăng nhập · Đăng ký — Repotasu AI',
    metaDesc: 'Đăng nhập để thanh toán Pro và quản lý tài khoản.',
    promo: 'Bắt đầu tại đây: đăng nhập/đăng ký hoặc vào app không cần tài khoản.',
    skipLogin: 'Dùng thử không đăng nhập',
    tabIn: 'Đăng nhập',
    tabUp: 'Đăng ký',
    modeHeadingIn: 'Đăng nhập',
    modeHeadingUp: 'Đăng ký',
    modeHintIn: 'Dùng email và mật khẩu đã đăng ký.',
    modeHintUp: 'Lần đầu? Tạo tài khoản bằng email và mật khẩu (ít nhất 6 ký tự).',
    proIntentBanner: 'Đây là bước mua Pro. Sau khi đăng nhập, bạn sẽ tiếp tục đến thanh toán.',
    googleLabel: 'Đăng nhập bằng Google',
    googleLabelUp: 'Đăng ký bằng Google',
    googleHint: 'Đăng nhập Google chưa được cấu hình. Dùng email & mật khẩu.',
    googleHintUp: 'Đăng ký Google chưa được cấu hình. Dùng email & mật khẩu.',
    googleHintOn: 'Bạn cũng có thể dùng email & mật khẩu.',
    googleHintUpOn: 'Bạn cũng có thể đăng ký bằng email & mật khẩu.',
    or: 'hoặc',
    forgotQuestion: 'Quên mật khẩu? ',
    forgotLink: 'Đặt lại (sắp có)',
    tabHint: 'Đăng nhập = đã có tài khoản · Đăng ký = lần đầu',
    submitIn: 'Đăng nhập',
    submitUp: 'Tạo tài khoản',
    switchToUp: 'Đăng ký',
    switchToIn: 'Đăng nhập',
    promptNoAccount: 'Chưa có tài khoản?',
    promptHasAccount: 'Đã có tài khoản?',
    emailLabel: 'Email',
    passwordLabel: 'Mật khẩu',
    ariaAuthTabs: 'Chọn đăng nhập hoặc đăng ký',
    localeLabel: 'Ngôn ngữ',
    msg: {
      valBoth: 'Vui lòng nhập cả email và mật khẩu.',
      valPw6: 'Đăng ký cần mật khẩu ít nhất 6 ký tự.',
      stIn: 'Đang đăng nhập…',
      stUp: 'Đang đăng ký…',
      authFail: 'Xác thực thất bại.',
      sessionFail: 'Đã đăng nhập nhưng không xác nhận được phiên. Hãy cho phép cookie và thử lại.',
      stCheckout: 'Đã đăng nhập. Đang chuyển đến thanh toán…',
      stTop: 'Đang về trang chủ…',
      forgotMsg: 'Đặt lại mật khẩu chưa sẵn sàng. Vui lòng đăng ký lại bằng mật khẩu mới.',
      gIn: 'Đăng nhập Google chưa được cấu hình. Dùng email và mật khẩu.',
      gUp: 'Đăng ký Google chưa được cấu hình. Dùng email và mật khẩu.',
      googleAuthFail: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
      googleAuthDenied: 'Đã hủy đăng nhập Google.',
      googleAuthDisabled: 'Đăng nhập Google chưa được cấu hình.',
      checkoutFail: 'Không mở được thanh toán. Về trang chủ và thử lại.',
      toggleShow: 'Ẩn',
      toggleHide: 'Hiện'
    }
  },
  ne: {
    pageTitle: 'लगइन · दर्ता — Repotasu AI',
    metaDesc: 'Pro भुक्तानी र खाता व्यवस्थापनका लागि लगइन।',
    promo: 'यहाँबाट लगइन वा दर्ता; वा बिना खाता मुख्य स्क्रिनमा जानुहोस्।',
    skipLogin: 'लगइन बिना सुरु गर्नुहोस्',
    tabIn: 'लगइन',
    tabUp: 'दर्ता',
    modeHeadingIn: 'लगइन',
    modeHeadingUp: 'दर्ता',
    modeHintIn: 'दर्ता गरिएको इमेल र पासवर्ड प्रयोग गर्नुहोस्।',
    modeHintUp: 'नयाँ? इमेल र पासवर्ड (कम्तीमा ६ अक्षर) ले खाता बनाउनुहोस्।',
    proIntentBanner: 'यो Pro खरिदको चरण हो। लगइनपछि सिधै भुक्तानी पृष्ठमा जानुहुन्छ।',
    googleLabel: 'Google बाट लगइन',
    googleLabelUp: 'Google बाट दर्ता',
    googleHint: 'Google लगइन सेटअप छैन। इमेल र पासवर्ड प्रयोग गर्नुहोस्।',
    googleHintUp: 'Google दर्ता सेटअप छैन। इमेल र पासवर्ड प्रयोग गर्नुहोस्।',
    googleHintOn: 'इमेल र पासवर्ड पनि प्रयोग गर्न सकिन्छ।',
    googleHintUpOn: 'इमेल र पासवर्डबाट पनि दर्ता गर्न सकिन्छ।',
    or: 'वा',
    forgotQuestion: 'पासवर्ड बिर्सनुभयो? ',
    forgotLink: 'रिसेट (छिट्टै)',
    tabHint: 'लगइन = पुरानो खाता · दर्ता = पहिलो पटक',
    submitIn: 'लगइन',
    submitUp: 'खाता बनाउनुहोस्',
    switchToUp: 'दर्ता',
    switchToIn: 'लगइन',
    promptNoAccount: 'खाता छैन?',
    promptHasAccount: 'पहिले नै खाता छ?',
    emailLabel: 'इमेल',
    passwordLabel: 'पासवर्ड',
    ariaAuthTabs: 'लगइन वा दर्ता छान्नुहोस्',
    localeLabel: 'भाषा',
    msg: {
      valBoth: 'इमेल र पासवर्ड दुवै लेख्नुहोस्।',
      valPw6: 'दर्तामा पासवर्ड कम्तीमा ६ अक्षर।',
      stIn: 'लगइन हुँदैछ…',
      stUp: 'दर्ता हुँदैछ…',
      authFail: 'प्रमाणीकरण असफल।',
      sessionFail: 'लगइन भयो तर सत्र पुष्टि हुन सकेन। कुकी अनुमति दिएर फेरि प्रयास गर्नुहोस्।',
      stCheckout: 'लगइन भयो। भुक्तानी पृष्ठमा जाँदै…',
      stTop: 'गृह पृष्ठमा जाँदै…',
      forgotMsg: 'पासवर्ड रिसेट तयार छैन। नयाँ पासवर्डले फेरि दर्ता गर्नुहोस्।',
      gIn: 'Google लगइन सेटअप छैन। इमेल र पासवर्ड प्रयोग गर्नुहोस्।',
      gUp: 'Google दर्ता सेटअप छैन। इमेल र पासवर्ड प्रयोग गर्नुहोस्।',
      googleAuthFail: 'Google लगइन असफल भयो। फेरि प्रयास गर्नुहोस्।',
      googleAuthDenied: 'Google लगइन रद्द भयो।',
      googleAuthDisabled: 'Google लगइन सेटअप छैन।',
      checkoutFail: 'चेकआउट सुरु गर्न सकिएन। गृहमा फर्केर फेरि प्रयास गर्नुहोस्।',
      toggleShow: 'लुकाउनुहोस्',
      toggleHide: 'देखाउनुहोस्'
    }
  },
  hi: {
    pageTitle: 'लॉग इन · साइन अप — Repotasu AI',
    metaDesc: 'Pro बिलिंग और खाता प्रबंधन के लिए लॉग इन।',
    promo: 'यहाँ लॉग इन / साइन अप करें, या बिना खाते ऐप खोलें।',
    skipLogin: 'लॉग इन किए बिना शुरू करें',
    tabIn: 'लॉग इन',
    tabUp: 'साइन अप',
    modeHeadingIn: 'लॉग इन',
    modeHeadingUp: 'साइन अप',
    modeHintIn: 'पंजीकृत ईमेल और पासवर्ड उपयोग करें।',
    modeHintUp: 'नए हैं? ईमेल और पासवर्ड (6+ अक्षर) से खाता बनाएँ।',
    proIntentBanner: 'यह Pro खरीद का चरण है। लॉग इन के बाद आप सीधे चेकआउट पर जाएँगे।',
    googleLabel: 'Google से लॉग इन',
    googleLabelUp: 'Google से साइन अप',
    googleHint: 'Google लॉग इन सेट नहीं है। ईमेल और पासवर्ड उपयोग करें।',
    googleHintUp: 'Google साइन अप सेट नहीं है। ईमेल और पासवर्ड उपयोग करें।',
    googleHintOn: 'ईमेल और पासवर्ड भी उपयोग कर सकते हैं।',
    googleHintUpOn: 'ईमेल और पासवर्ड से भी साइन अप कर सकते हैं।',
    or: 'या',
    forgotQuestion: 'पासवर्ड भूल गए? ',
    forgotLink: 'रीसेट (जल्द)',
    tabHint: 'लॉग इन = मौजूदा खाता · साइन अप = पहली बार',
    submitIn: 'लॉग इन',
    submitUp: 'खाता बनाएँ',
    switchToUp: 'साइन अप',
    switchToIn: 'लॉग इन',
    promptNoAccount: 'खाता नहीं है?',
    promptHasAccount: 'पहले से खाता है?',
    emailLabel: 'ईमेल',
    passwordLabel: 'पासवर्ड',
    ariaAuthTabs: 'लॉग इन या साइन अप चुनें',
    localeLabel: 'भाषा',
    msg: {
      valBoth: 'ईमेल और पासवर्ड दोनों दर्ज करें।',
      valPw6: 'साइन अप में पासवर्ड कम से कम 6 अक्षर।',
      stIn: 'लॉग इन हो रहा है…',
      stUp: 'साइन अप हो रहा है…',
      authFail: 'प्रमाणीकरण विफल।',
      sessionFail: 'लॉगिन हुआ, लेकिन सत्र की पुष्टि नहीं हो सकी। कुकी अनुमति देकर पुनः प्रयास करें।',
      stCheckout: 'लॉग इन हो गया। चेकआउट पर भेज रहे हैं…',
      stTop: 'होम पर भेज रहे हैं…',
      forgotMsg: 'पासवर्ड रीसेट तैयार नहीं। नए पासवर्ड से फिर साइन अप करें।',
      gIn: 'Google लॉग इन सेट नहीं है। ईमेल और पासवर्ड उपयोग करें।',
      gUp: 'Google साइन अप सेट नहीं है। ईमेल और पासवर्ड उपयोग करें।',
      googleAuthFail: 'Google लॉग इन विफल। फिर कोशिश करें।',
      googleAuthDenied: 'Google लॉग इन रद्द किया गया।',
      googleAuthDisabled: 'Google लॉग इन सेट नहीं है।',
      checkoutFail: 'चेकआउट शुरू नहीं हो सका। होम पर जाकर फिर कोशिश करें।',
      toggleShow: 'छिपाएँ',
      toggleHide: 'दिखाएँ'
    }
  },
  id: {
    pageTitle: 'Masuk · Daftar — Repotasu AI',
    metaDesc: 'Masuk untuk pembayaran Pro & pengelolaan akun.',
    promo: 'Mulai di sini. Masuk atau daftar—atau buka aplikasi tanpa akun.',
    skipLogin: 'Lanjut tanpa masuk',
    tabIn: 'Masuk',
    tabUp: 'Daftar',
    modeHeadingIn: 'Masuk',
    modeHeadingUp: 'Daftar',
    modeHintIn: 'Gunakan email dan kata sandi yang sudah Anda daftarkan.',
    modeHintUp: 'Baru di sini? Buat akun dengan email dan kata sandi (6+ karakter).',
    proIntentBanner: 'Ini langkah pembelian Pro. Setelah masuk, Anda langsung lanjut ke pembayaran.',
    googleLabel: 'Masuk dengan Google',
    googleLabelUp: 'Daftar dengan Google',
    googleHint: 'Masuk Google belum dikonfigurasi. Gunakan email & kata sandi.',
    googleHintUp: 'Daftar Google belum dikonfigurasi. Gunakan email & kata sandi.',
    googleHintOn: 'Anda juga bisa memakai email & kata sandi.',
    googleHintUpOn: 'Anda juga bisa mendaftar dengan email & kata sandi.',
    or: 'atau',
    forgotQuestion: 'Lupa kata sandi? ',
    forgotLink: 'Atur ulang (segera hadir)',
    tabHint: 'Masuk = akun lama · Daftar = pertama kali',
    submitIn: 'Masuk',
    submitUp: 'Buat akun',
    switchToUp: 'Daftar',
    switchToIn: 'Masuk',
    promptNoAccount: 'Belum punya akun?',
    promptHasAccount: 'Sudah punya akun?',
    emailLabel: 'Email',
    passwordLabel: 'Kata sandi',
    ariaAuthTabs: 'Pilih masuk atau daftar',
    localeLabel: 'Bahasa',
    msg: {
      valBoth: 'Masukkan email dan kata sandi.',
      valPw6: 'Kata sandi minimal 6 karakter untuk mendaftar.',
      stIn: 'Sedang masuk…',
      stUp: 'Sedang mendaftar…',
      authFail: 'Autentikasi gagal.',
      sessionFail: 'Berhasil masuk, tetapi sesi tidak dapat diverifikasi. Izinkan cookie lalu coba lagi.',
      stCheckout: 'Sudah masuk. Mengalihkan ke pembayaran…',
      stTop: 'Mengalihkan ke beranda…',
      forgotMsg: 'Atur ulang kata sandi belum tersedia. Silakan daftar lagi dengan kata sandi baru.',
      gIn: 'Masuk Google belum dikonfigurasi. Gunakan email dan kata sandi.',
      gUp: 'Daftar Google belum dikonfigurasi. Gunakan email dan kata sandi.',
      googleAuthFail: 'Masuk Google gagal. Silakan coba lagi.',
      googleAuthDenied: 'Masuk Google dibatalkan.',
      googleAuthDisabled: 'Masuk Google belum dikonfigurasi.',
      checkoutFail: 'Tidak dapat memulai pembayaran. Kembali ke beranda dan coba lagi.',
      toggleShow: 'Sembunyikan',
      toggleHide: 'Tampilkan'
    }
  }
};
