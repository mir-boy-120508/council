const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 授業時間帯アクセス制限チェック（日本時間 Asia/Tokyo）
 */
async function assertAccessAllowed(uid, role) {
  if (role === "teacher" || role === "admin") return;

  const settingsSnap = await db.doc("settings/accessControl").get();
  if (!settingsSnap.exists) return;
  const ac = settingsSnap.data();
  if (!ac.enabled || ac.emergencyOverride) return;

  const nowJst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const day = nowJst.getDay();
  if (day === 0 || day === 6) return;

  const toMin = (str) => {
    const [h, m] = (str || "00:00").split(":").map(Number);
    return h * 60 + m;
  };
  const cur = nowJst.getHours() * 60 + nowJst.getMinutes();
  const morningStart = toMin(ac.morningStart || "08:15");
  const lunchStart = toMin(ac.lunchStart || "12:35");
  const lunchEnd = toMin(ac.lunchEnd || "13:20");
  const afterSchoolStart = toMin(ac.afterSchoolStart || "16:00");

  if (cur < morningStart || (cur >= lunchStart && cur < lunchEnd) || cur >= afterSchoolStart) {
    return;
  }

  throw new HttpsError(
    "failed-precondition",
    `現在は授業時間帯のため操作が制限されています。昼休み（${ac.lunchStart}〜${ac.lunchEnd}）または放課後（${ac.afterSchoolStart}以降）にご利用ください。`
  );
}

/**
 * 重複防止付きオンライン署名トランザクション（仕様書 7-3）
 */
exports.submitPetitionSignature = onCall({ region: "asia-northeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "ログインが必要です。");
  }
  const uid = request.auth.uid;
  const petitionId = String(request.data.petitionId || "");
  if (!petitionId) {
    throw new HttpsError("invalid-argument", "提案IDが指定されていません。");
  }

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists || !userSnap.data().active) {
    throw new HttpsError("permission-denied", "有効な生徒アカウントが確認できません。");
  }
  const role = userSnap.data().role;
  await assertAccessAllowed(uid, role);

  const petitionRef = db.doc(`petitions/${petitionId}`);
  const sigRef = petitionRef.collection("signatures").doc(uid);

  await db.runTransaction(async (tx) => {
    const [petSnap, sigSnap] = await Promise.all([tx.get(petitionRef), tx.get(sigRef)]);
    if (!petSnap.exists) {
      throw new HttpsError("not-found", "対象の提案が見つかりません。");
    }
    if (petSnap.data().status === "closed") {
      throw new HttpsError("failed-precondition", "この提案の署名募集は終了しています。");
    }
    if (sigSnap.exists) {
      throw new HttpsError("already-exists", "この提案にはすでに署名済みです。");
    }

    const nextCount = (petSnap.data().signatureCount || 0) + 1;
    const nextStatus =
      nextCount >= (petSnap.data().targetCount || 50) && petSnap.data().status === "open"
        ? "threshold_reached"
        : petSnap.data().status;

    tx.set(sigRef, {
      userUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.update(petitionRef, {
      signatureCount: nextCount,
      status: nextStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});

/**
 * 権限変更・Custom Claims付与（教職員・システム管理者専用 — 仕様書 7-4）
 */
exports.setUserRole = onCall({ region: "asia-northeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "ログインが必要です。");
  }
  const callerSnap = await db.doc(`users/${request.auth.uid}`).get();
  const callerRole = callerSnap.exists ? callerSnap.data().role : "";
  if (callerRole !== "teacher" && callerRole !== "admin") {
    throw new HttpsError("permission-denied", "権限変更は教職員またはシステム管理者のみ実行できます。");
  }

  const targetUid = String(request.data.targetUid || "");
  const newRole = String(request.data.role || "");
  const allowedRoles = callerRole === "admin"
    ? ["student", "officer", "teacher", "admin"]
    : ["student", "officer"];

  if (!targetUid || !allowedRoles.includes(newRole)) {
    throw new HttpsError("invalid-argument", "不正なユーザーIDまたは権限指定です。");
  }

  await admin.auth().setCustomUserClaims(targetUid, { role: newRole });
  await db.doc(`users/${targetUid}`).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await db.collection("auditLogs").add({
    actorUid: request.auth.uid,
    action: `権限を ${newRole} に変更`,
    targetType: "users",
    targetId: targetUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});
