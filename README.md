# 橘中学校 生徒会公式プラットフォーム

「声を、集めるだけで終わらせない。」を基本理念とする、生徒会公式Webプラットフォームです。

## ページ構成
- `index.html`：トップページ
- `newsroom.html`：お知らせ
- `events.html`：イベント
- `progress.html`：活動の進捗
- `petitions.html`：提案・署名
- `feedback.html`：意見・質問
- `school-rules.html`：校内のきまり
- `login.html`：ログイン・ローカル検証データ切替
- `admin.html`：管理画面
- `privacy.html`：プライバシー・個人情報保護方針
- `error.html`：アクセス制限・エラー案内

## ローカルでの確認
ES Modulesを使用しているため、`index.html`を直接開くのではなく、プロジェクトのルートでHTTPサーバーを起動してください。

```bash
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開きます。

初期状態は公開データ0件です。ログインページで検証用ロールを選択すると、ローカル検証用アカウントで画面を確認できます。「検証用サンプルデータを読み込む」で各ページの表示を確認し、終了後は「本番初期状態（0件）へ初期化」で戻せます。

## 現在の認証・データ保存について
このZIPの画面は、ブラウザのLocal Storageを使うローカル検証モードを中心に動作します。ログイン画面のロール選択は動作確認専用であり、本番用の本人確認・認証ではありません。複数端末間のデータ共有や本番運用を行うには、Firebase Authentication・Firestoreとの画面側の接続実装と、実環境でのセキュリティ検証が別途必要です。

`js/firebase-config.js`にはプレースホルダー値が入っています。実際のFirebase設定値を入れるまではFirebase接続されません。秘密鍵やサービスアカウント情報をフロントエンドへ配置しないでください。

## Firebase Functions
`functions/index.js`にはCallable Functionsを配置しています。デプロイ前にFirebaseプロジェクト、Node.jsランタイム、依存パッケージ、Firestoreスキーマ、セキュリティルールを実環境で確認してください。
