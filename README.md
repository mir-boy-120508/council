# 橘中学校 生徒会公式プラットフォーム

「声を、集めるだけで終わらせない。」を基本理念とする、橘中学校生徒会の公式Webプラットフォームです。

## 1. ディレクトリ構成
- `index.html` : トップページ（全体案内・最新情報・公開状況サマリー）
- `newsroom.html` : お知らせ（一覧・記事詳細モーダル・カテゴリー絞込・検索・並び替え）
- `events.html` : イベント（ダークテーマ・開催予定/開催中/終了・アーカイブ表示）
- `progress.html` : 活動の進捗（6段階プロセス表示・対応状況・結果理由の説明）
- `petitions.html` : 提案・署名（新規提案投稿・重複防止オンライン署名・署名者個人情報保護）
- `feedback.html` : 意見・質問（ログイン連携・非公開受付フォーム）
- `school-rules.html` : 校内のきまり（教職員承認済みルールのみ公開）
- `login.html` : ログイン・権限切替・動作検証データ切替
- `admin.html` : 管理者専用画面（生徒会役員・教職員・システム管理者）
- `privacy.html` : プライバシー・利用上の注意
- `css/site.css`, `css/admin.css` : 共通デザインシステムおよび管理画面スタイル
- `js/firebase-config.js`, `js/store.js`, `js/site.js`, `js/pages.js`, `js/admin.js` : フロントエンド制御・検証エンジン
- `firestore.rules`, `firebase.json`, `functions/` : Firebase 本番セキュリティルールおよびサーバー関数
- `docs/ADMIN_MANUAL.md` : 管理者操作マニュアル・次年度引き継ぎ手順書

## 2. ローカル開発環境での起動・動作確認方法
1. フォルダを展開し、`index.html` をブラウザで開くか、ローカルHTTPサーバー（例：`npx serve .` または `python3 -m http.server 8080`）で起動します。
2. 初期状態では「架空の情報を事実として掲載しない」仕様に基づき、各一覧は **0件（正規の空状態）** となっています。
3. 全機能の動作テストを行う場合は、`login.html`（画面右上の「ログイン」）へ移動し、画面下部の **「動作確認用サンプルデータを読み込む」** をクリックしてください。
4. テスト完了後は **「本番初期状態（空データ）に戻す」** で元の状態へリセットできます。

## 3. Firebase 本番接続・デプロイ手順
1. Firebase Console で新規プロジェクトを作成し、Authentication・Cloud Firestore・Hosting・Functions を有効化します。
2. `js/firebase-config.js` の `TACHIBANA_FIREBASE_CONFIG` に Web アプリ設定値を記入します。
3. Firebase CLI でログインし、以下を実行してデプロイします：
   ```bash
   firebase deploy --only firestore:rules,functions,hosting
