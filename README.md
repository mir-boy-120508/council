# 橘中学校 生徒会公式プラットフォーム

## 1. フォルダ・ファイル構成
- `index.html` : トップページ（サイト案内・最新情報サマリー）
- `newsroom.html` : お知らせ・活動報告・公式発表（カテゴリー絞り込み・検索・並び替え対応）
- `events.html` : イベント案内・アーカイブ（ダークテーマ統一デザイン）
- `progress.html` : 活動の進捗（6段階ステッパー・説明と結果理由の公開）
- `petitions.html` : 提案・署名（ログイン認証・トランザクション重複防止・新規提案投稿）
- `feedback.html` : 意見・質問（非公開目安箱・ログイン本人確認）
- `school-rules.html` : 校内のきまり（教職員承認済みデータのみ公開）
- `login.html` : ログイン・アカウント確認ページ
- `admin.html` : 役員・教職員・システム管理者専用管理画面
- `privacy.html` : プライバシー・利用上の注意
- `error.html` : アクセス制限・エラー案内ページ
- `site.css` / `site.js` : 共通デザインシステム・ナビゲーション制御
- `js/firebase-config.js` : Firebase接続設定（未設定時は空状態モードで安全動作）
- `js/firebase-service.js` : Firebase Authentication / Firestore 連携・監査ログ・トランザクション署名処理
- `firestore.rules` : Firestore Security Rules（権限分離・重複署名防止・非公開保護）
- `functions/index.js` : 時間帯アクセス制限判定用 Cloud Functions

## 2. ローカルでの動作確認方法
ES Modules（`<script type="module">`）を使用しているため、ローカルサーバー経由で開いてください。
```bash
npx serve .
# または Python の場合
python3 -m http.server 8080
```
ブラウザで `http://localhost:8080` にアクセスします。Firebase設定値入力前は、仮実績を表示せず「準備中・空状態」として安全に表示されます。

## 3. Firebase 初期設定・公開手順
1. Firebase Console で新規プロジェクトを作成し、**Authentication（メール/パスワード）** と **Cloud Firestore** を有効化します。
2. プロジェクト設定から Web アプリを追加し、取得した `firebaseConfig` を `js/firebase-config.js` に貼り付けます。
3. 初期の教職員・システム管理者アカウントを Authentication で作成し、Firestore の `users/{uid}` ドキュメントに `{ displayName: "担当者名", role: "teacher", active: true }` を登録します。
4. Firebase CLI でセキュリティルールとホスティングをデプロイします。
```bash
firebase deploy --only firestore:rules,hosting
```

## 4. 役員交代時の引き継ぎ手順
1. 教職員またはシステム管理者が `admin.html`（または Firebase Console の `users` コレクション）から新役員の `role` を `officer` に設定します。
2. 退任する役員の `role` を `student` に戻すか、`active` を `false` に変更します。
3. 過去の記事・進捗・提案データはすべて Firestore に保持されるため、そのまま引き継がれます。
