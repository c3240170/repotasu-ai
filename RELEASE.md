# 一般公開チェックリスト（レポたすAI）

コード側で実装済みのものと、**あなたが行う作業**を分けて記載しています。

---

## 実装済み（コード）

- [x] ログイン / 匿名利用 / Google OAuth
- [x] Gemini 本文生成・下書きチェック
- [x] Stripe Checkout（Pro 課金）
- [x] Stripe Billing Portal（**請求・解約**ボタン）
- [x] Webhook（課金完了・解約反映）
- [x] 利用規約・プライバシー・特商法・お問い合わせページ（`/terms.html` 等）
- [x] アカウント削除
- [x] 本番向け `Procfile`（`npm start`）
- [x] `robots.txt` / `sitemap.xml`

---

## あなたがやること（順番どおり）

### 1. 法務・連絡先の .env を埋める

`.env`（本番はホスティングの環境変数）に追加：

```env
LEGAL_OPERATOR_NAME=あなたの屋号または氏名
LEGAL_ADDRESS=所在地（特商法用）
SUPPORT_EMAIL=support@あなたのドメイン
LEGAL_PRO_PRICE=月額980円（税込）   # Stripe の実際の価格と一致させる
LEGAL_UPDATED=2026年6月4日
```

→ `/tokusho.html` を開き、【要記入】が消えているか確認。

### 2. ドメインを決める

例: `https://repotasu-ai.com`

### 3. ホスティングにデプロイ

- 起動: `npm start`
- 永続ディスクをマウントし `DATA_DIR=/data` を設定
- 環境変数に本番 `.env` をすべて入れる

```env
NODE_ENV=production
BASE_URL=https://あなたのドメイン
TRUST_PROXY=1
DATA_DIR=/data
SESSION_SECRET=（32文字以上・新規生成）
```

### 4. Stripe 本番化

1. Dashboard を **本番モード** に
2. `STRIPE_SECRET_KEY=sk_live_...`
3. 本番 `STRIPE_PRICE_ID=price_...`
4. Webhook: `https://ドメイン/api/billing/webhook`
   - イベント: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
5. **Customer Portal** を Dashboard で有効化（解約・請求履歴）

### 5. Google OAuth 本番化

1. 同意画面を **本番公開**
2. リダイレクト URI: `https://ドメイン/api/auth/google/callback`
3. プライバシーポリシー URL: `https://ドメイン/privacy.html`

### 6. 本番テスト

- [ ] 匿名で生成
- [ ] 登録・ログイン・Googleログイン
- [ ] Pro 課金
- [ ] 「請求・解約」から Stripe Portal
- [ ] 解約後 Free に戻る
- [ ] アカウント削除
- [ ] スマホ表示
- [ ] フッターの法務リンク

### 7. 運用

- [ ] `store.json`（`DATA_DIR`）のバックアップ
- [ ] `/api/health` の死活監視（UptimeRobot 等）
- [ ] 問い合わせメール `SUPPORT_EMAIL` を実際に受け取れるようにする

### 8. 公開

URL を共有。最初は少人数で様子を見る。

---

## 任意（あとからで可）

- パスワード再設定（メール送信 SMTP が必要）→ 今は `/contact.html` へ誘導
- OpenAI キー（画像生成を使う場合のみ）
- PostgreSQL への DB 移行（ユーザー増加時）

---

## クイック確認

```bash
npm run env:check
npm start
```

ブラウザ: `http://localhost:5173/login.html`
