// Firebase プロジェクト設定ファイル
// 本番環境への切り替え時は、Firebaseコンソールから取得したWebアプリ設定値に置き換えてください。
// ※秘密鍵（Admin SDK用JSON等）は絶対にここに記載しないでください。

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 設定値が未入力の場合は自動的に未接続・準備モード（デモデータ不使用・空状態表示）として安全に動作します
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith("YOUR_")
);
