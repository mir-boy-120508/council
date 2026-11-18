/**
 * Firebase Webアプリ設定。
 * 公開前にFirebase Consoleの実際のWebアプリ設定へ置き換えてください。
 * サービスアカウント秘密鍵は絶対に配置しないでください。
 */
export const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'tachibana-student-council.firebaseapp.com',
  projectId: 'tachibana-student-council',
  storageBucket: 'tachibana-student-council.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000'
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.appId !== '1:000000000000:web:0000000000000000'
  );
}
