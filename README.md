# レポたすAI（収益化MVP）

大学生・留学生向けのレポート下書き。無料枠・Stripe課金・高品質モードあり。

## できること

- メールまたは Google でログイン
- 無料: テキスト1日3回・画像1日1回
- Pro: 無制限＋高品質（Stripeの月額）
- 下書き生成・画像・コピー

---

## はじめかた（全体の流れ）

### 1. 一度だけ

```bash
npm i
npm run env:bootstrap
```

`env:bootstrap` は **`.env` が無ければ作る**／**弱い SESSION_SECRET を直す**／**PORT と BASE_URL が空なら埋める** だけです。

### 2. `.env` に「あなたのキー」を書く

メモ帳や Cursor で **プロジェクトの中の `.env`** を開きます。

| 名前 | どこで手に入るか |
|------|------------------|
| `GEMINI_API_KEY` | **（Gemini を使う場合）** [Google AI Studio](https://aistudio.google.com/apikey) の無料キー（`AIza...`）。`OPENAI_API_KEY` とは別の行に書く |
| `AI_PROVIDER` | Gemini だけ使うときは `gemini`。`OPENAI_API_KEY` も残している場合は **必須**（無いと OpenAI が優先される） |
| `OPENAI_API_KEY` | OpenAI のキー（`sk-...`）。画像生成は現状 OpenAI のみ対応 |
| `STRIPE_SECRET_KEY` | Stripeの画面 → 開発者 → APIキー → **シークレットキー**（`sk_test_...`） |
| `STRIPE_PRICE_ID` | Stripeの画面 → 商品カタログ → あなたの商品 → **価格の ID**（`price_...`） |
| `STRIPE_WEBHOOK_SECRET` | 下の「Stripeだけ」の **手順4** で出る `whsec_...` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | （任意）Google Cloud の OAuth クライアント。リダイレクト URI は `{BASE_URL}/api/auth/google/callback` |

`SESSION_SECRET` と `BASE_URL` は **`npm run env:bootstrap` で多くの場合すでに入っています**。消さないでください。

### 3. 足りないか確認

```bash
npm run env:check
```

**全部 ✅ になれば OK** です。❌ があれば、画面に出る「次にやること」に従ってください。

### 4. アプリを起動

```bash
npm run dev
```

ブラウザで **`http://localhost:5173`** を開きます。

---

## Stripeだけ（課金を試すとき）

**イメージ:** Stripeは「外の世界」、あなたのPCは「localhost」。外から localhost には届かないので、**Stripe CLI** が代わりに届けます。

1. **Stripe CLI** を入れる（未なら）  
   [インストール手順](https://stripe.com/docs/stripe-cli)

2. 一度だけログイン  

   ```bash
   stripe login
   ```

3. **ターミナルを2つ**用意する  
   - **ターミナルA:** `npm run dev`（いつも通りアプリ）  
   - **ターミナルB:** 次を実行  

   ```bash
   npm run stripe:listen
   ```

4. **ターミナルB** に出てくる **`Ready!` の近くにある `whsec_...`** をコピーし、`.env` に貼る  

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_（コピーした全文）
   ```

5. **ターミナルA** の `npm run dev` を **一度 Ctrl+C で止めて、もう一度** `npm run dev`

6. ブラウザでログイン → **「Pro にする」** → テスト用カードで支払い → ページを再読み込み  
   - テストカード例: [Stripeのテスト](https://docs.stripe.com/testing)

**本番サイト**に載せるときは、DashboardでWebhookを登録し、**本番用の `whsec_`（CLIのではない）** を `.env` に使います。詳細は [RELEASE.md](./RELEASE.md) を参照。

---

## 一般公開

[RELEASE.md](./RELEASE.md) にチェックリストがあります。法的ページは `/terms.html` `/privacy.html` `/tokusho.html` `/contact.html` です。`.env` の `LEGAL_*` と `SUPPORT_EMAIL` を埋めてください。

---

## メモ

- ユーザー情報は `data/store.json`（開発用）
- APIキーはサーバ（`server.js`）だけが使います
