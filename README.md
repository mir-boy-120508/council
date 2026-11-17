# 橘中学校 生徒会プラットフォーム（静的フロントエンド）

## ファイル構成
- `index.html` Home
- `newsroom.html` Newsroom
- `events.html` Events
- `progress.html` Progress
- `petitions.html` Petitions
- `feedback.html` Feedback
- `school-rules.html` School Rules
- `site.css` 共通デザイン
- `site.js` ナビゲーション

## Cloudflare Pages
GitHubリポジトリに全ファイルを配置し、Cloudflare Pagesでそのリポジトリを接続します。ビルドコマンドは不要、Build output directoryは `/`（ルート）にします。

## 注意
本プロジェクトは静的なフロントエンドです。ログイン、署名、意見送信、管理画面、アクセス時間制限、イベント配信は未実装です。学校の承認と安全なバックエンド・運用設計が整うまで、実際の個人情報や意見を受け付けないでください。校則の本文や学校の正式発表も、確認済み資料がある場合のみ掲載してください。
