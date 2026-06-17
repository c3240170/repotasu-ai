# AGENTS.md — レポたすAI

GitHub: `c3240170/repotasu-ai`  
大学生・留学生向けレポート下書き SaaS（収益化 MVP）。

## スタック

- **サーバー**: Node.js ESM, `server.js`（Express 単一ファイル）
- **フロント**: Vanilla JS（`public/app.js`）, `public/i18n.js`（7言語）
- **AI**: Gemini 優先 / OpenAI フォールバック。画像は OpenAI のみ
- **課金**: Stripe Checkout / Portal / Webhook
- **データ**: `data/store.json`（本番は `DATA_DIR`）

## 起動

```bash
npm i
npm run env:bootstrap
npm run env:check
npm run dev    # http://localhost:5173
npm run build  # 構文チェック
```

## ルール

- 変更は最小限。依頼と無関係なリファクタ禁止
- `.env` / `data/store.json` をコミットしない
- UI 文言は `i18n.js` の全ロケール（ja/en/zh/vi/ne/hi/id）を揃える
- git commit / push / 本番デプロイはユーザー明示時のみ
- 生成プロンプト変更は `server.js` の `toneHint`, `referenceRulesBlock`, `antiAiRules`

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| `server.js` | API・認証・課金・AI・ルーティング |
| `public/app.js` | クライアント |
| `public/i18n.js` | 多言語 |
| `legal-templates/` | 法務 HTML テンプレ |
| `RELEASE.md` | 公開チェックリスト |
| `.env.example` | 環境変数テンプレ |

## 制限

- 無料: テキスト3回/日、画像1回/日、文字数4000まで
- Pro: 無制限、文字数10000、高品質モード
- 日次リセット: Asia/Tokyo

## 法務 env（公開前必須）

`LEGAL_OPERATOR_NAME`, `LEGAL_ADDRESS`, `SUPPORT_EMAIL`, `LEGAL_PRO_PRICE`, `LEGAL_UPDATED`  
未設定時は `/tokusho.html` 等に【要記入】が表示される。
