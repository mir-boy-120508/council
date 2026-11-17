import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const STAGE_LABELS = [
  "1. 受付",
  "2. 署名・賛同の募集",
  "3. 生徒会での検討",
  "4. 学校への提出",
  "5. 学校との協議",
  "6. 結果の報告"
];

export function formatDate(ts) {
  if (!ts) return "日付未設定";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "日付未設定";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatDateTime(ts) {
  if (!ts) return "日時未設定";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "日時未設定";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export const Backend = {
  isReady() {
    return isFirebaseConfigured && Boolean(db);
  },

  // 認証状態の監視（usersコレクションから権限・有効状態を取得）
  onAuthChanged(callback) {
    if (!auth) {
      callback(null, null);
      return () => {};
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null, null);
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const profile = userSnap.exists() ? userSnap.data() : { role: "student", active: true };
        if (profile.active === false) {
          await signOut(auth);
          callback(null, null);
          return;
        }
        callback(user, profile);
      } catch (e) {
        console.error("ユーザー情報の取得に失敗しました:", e);
        callback(user, { role: "student", active: true });
      }
    });
  },

  async login(loginId, password) {
    if (!auth) throw new Error("Firebase認証がまだ設定されていません。学校の承認後に有効化されます。");
    // IDのみ入力された場合は学校ドメインを補完できるようにする（例: s2026001 -> s2026001@tachibana-jhs.ed.jp）
    const email = loginId.includes("@") ? loginId.trim() : `${loginId.trim()}@tachibana-jhs.ed.jp`;
    return signInWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    if (!auth) return;
    return signOut(auth);
  },

  // 公開データ取得（未接続時は空配列を返し、仮実績は一切表示しない）
  async getPublishedNews(maxCount = 50) {
    if (!this.isReady()) return [];
    const q = query(
      collection(db, "news"),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc"),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getPublishedEvents() {
    if (!this.isReady()) return [];
    const q = query(
      collection(db, "events"),
      where("published", "==", true),
      orderBy("startAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getPublicProgress() {
    if (!this.isReady()) return [];
    const q = query(
      collection(db, "progress"),
      where("published", "==", true),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getPublicPetitions() {
    if (!this.isReady()) return [];
    const q = query(
      collection(db, "petitions"),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getApprovedSchoolRules() {
    if (!this.isReady()) return [];
    const q = query(
      collection(db, "schoolRules"),
      where("status", "==", "approved"),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // 署名済み確認
  async hasUserSigned(petitionId, userUid) {
    if (!this.isReady() || !userUid) return false;
    const sigId = `${petitionId}_${userUid}`;
    const snap = await getDoc(doc(db, "signatures", sigId));
    return snap.exists();
  },

  // 重複防止トランザクション付き署名処理
  async signPetition(petitionId, userUid) {
    if (!this.isReady()) throw new Error("現在システム準備中のため署名できません。");
    if (!userUid) throw new Error("署名するには生徒アカウントでのログインが必要です。");

    const petitionRef = doc(db, "petitions", petitionId);
    const sigRef = doc(db, "signatures", `${petitionId}_${userUid}`);

    await runTransaction(db, async (tx) => {
      const sigSnap = await tx.get(sigRef);
      if (sigSnap.exists()) {
        throw new Error("この提案にはすでに署名済みです。");
      }
      const petSnap = await tx.get(petitionRef);
      if (!petSnap.exists()) {
        throw new Error("対象の提案が見つかりません。");
      }
      const currentCount = Number(petSnap.data().signatureCount || 0);
      tx.set(sigRef, {
        petitionId,
        userUid,
        createdAt: serverTimestamp()
      });
      tx.update(petitionRef, {
        signatureCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    });
  },

  // 新規提案の投稿
  async createPetition({ title, category, description, targetCount, showProposerName, proposerName, userUid }) {
    if (!this.isReady()) throw new Error("現在システム準備中のため投稿できません。");
    if (!userUid) throw new Error("提案を投稿するにはログインが必要です。");

    return addDoc(collection(db, "petitions"), {
      title: title.trim(),
      category: category || "学校生活",
      description: description.trim(),
      proposerUid: userUid,
      proposerDisplayName: showProposerName ? (proposerName || "匿名希望") : "非公開",
      targetCount: Math.max(10, Number(targetCount) || 30),
      signatureCount: 0,
      status: "recruiting",
      published: false, // 生徒会・学校側の確認後に公開
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  // 意見・質問の送信（非公開で管理画面に保存）
  async submitFeedback({ category, content, wantsReply, userUid }) {
    if (!this.isReady()) throw new Error("現在システム準備中のため送信できません。");
    if (!userUid) throw new Error("意見・質問を送信するにはログインが必要です。");

    return addDoc(collection(db, "feedback"), {
      category,
      content: content.trim(),
      wantsReply: Boolean(wantsReply),
      senderUid: userUid,
      status: "unreviewed",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  // 管理画面用CRUD・監査ログ記録
  async writeAuditLog(actorUid, action, targetType, targetId) {
    if (!this.isReady() || !actorUid) return;
    await addDoc(collection(db, "auditLogs"), {
      actorUid,
      action,
      targetType,
      targetId,
      createdAt: serverTimestamp()
    });
  },

  async adminGetAll(collectionName, orderField = "updatedAt") {
    if (!this.isReady()) return [];
    const q = query(collection(db, collectionName), orderBy(orderField, "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async adminSaveDoc(collectionName, docId, data, actorUid) {
    if (!this.isReady()) throw new Error("Firebaseが未接続です。");
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (docId) {
      await updateDoc(doc(db, collectionName, docId), payload);
      await this.writeAuditLog(actorUid, "update", collectionName, docId);
      return docId;
    } else {
      payload.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, collectionName), payload);
      await this.writeAuditLog(actorUid, "create", collectionName, ref.id);
      return ref.id;
    }
  },

  async adminDeleteDoc(collectionName, docId, actorUid) {
    if (!this.isReady()) throw new Error("Firebaseが未接続です。");
    await deleteDoc(doc(db, collectionName, docId));
    await this.writeAuditLog(actorUid, "delete", collectionName, docId);
  }
};
