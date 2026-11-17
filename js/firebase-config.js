/**
 * 橘中学校 生徒会公式プラットフォーム — Firebase設定ファイル
 *
 * 【重要】
 * 1. 本番運用を開始する際は、Firebase Console から取得した Web アプリ設定値を
 *    下記の TACHIBANA_FIREBASE_CONFIG に設定してください。
 * 2. サービスアカウント秘密鍵はフロントエンドに絶対に配置しないでください。
 * 3. 未設定（初期状態）の場合、システムは自動的に「ローカル検証モード」で動作し、
 *    学校承認前の動作テストを安全に行えます。
 */

window.TACHIBANA_FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "tachibana-student-council.firebaseapp.com",
  projectId: "tachibana-student-council",
  storageBucket: "tachibana-student-council.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

window.isFirebaseConfigured = function () {
  const cfg = window.TACHIBANA_FIREBASE_CONFIG;
  return Boolean(
    cfg &&
    cfg.apiKey &&
    cfg.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    cfg.projectId &&
    cfg.projectId !== "tachibana-student-council"
  );
};
