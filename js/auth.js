import { store } from './store.js';

export const ROLE_LABELS = {
  student: '一般生徒',
  officer: '生徒会役員',
  teacher: '教職員',
  admin: 'システム管理者'
};

export function getCurrentUser() {
  return store.getCurrentUser();
}

export function isStaffRole(role) {
  return ['officer', 'teacher', 'admin'].includes(role);
}

export function logoutUser() {
  store.logout();
}

// Firebase未設定時の画面確認用。これは本番認証ではありません。
export function loginLocalAccount({ displayName, role = 'student' } = {}) {
  if (!Object.prototype.hasOwnProperty.call(ROLE_LABELS, role)) {
    throw new Error('選択された利用区分が正しくありません。');
  }
  const state = store.loadState();
  const account = state.users.find(user => user.role === role && user.active);
  if (!account) throw new Error('この利用区分の検証用アカウントがありません。');
  if (displayName && displayName.trim()) {
    account.displayName = displayName.trim();
    store.saveState(state);
  }
  return store.loginAs(account.uid, false);
}
