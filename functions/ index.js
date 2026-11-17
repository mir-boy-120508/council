const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

exports.checkAccessWindow = onRequest({ region: "asia-northeast1", cors: true }, async (req, res) => {
  try {
    const settingSnap = await admin.firestore().doc("systemSettings/accessControl").get();
    const config = settingSnap.exists ? settingSnap.data() : {};
    if (config.overrideOpen === true) {
      return res.json({ allowed: true, reason: "特別公開設定が有効です。" });
    }

    const nowJst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const day = nowJst.getDay();
    if (day === 0 || day === 6) {
      return res.json({ allowed: true, reason: "休日のため利用可能です。" });
    }

    const minutes = nowJst.getHours() * 60 + nowJst.getMinutes();
    const startSchool = 8 * 60 + 15;
    const lunchStart = config.lunchStartMinutes || (12 * 60 + 45);
    const lunchEnd = config.lunchEndMinutes || (13 * 60 + 25);
    const endSchool = 16 * 60;

    const isLunch = minutes >= lunchStart && minutes <= lunchEnd;
    const isClassTime = minutes >= startSchool && minutes < endSchool && !isLunch;

    if (isClassTime) {
      return res.status(403).json({
        allowed: false,
        reason: "現在は授業時間帯（8:15〜16:00／昼休みを除く）のため利用が制限されています。"
      });
    }

    return res.json({ allowed: true, reason: "利用可能時間帯です。" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ allowed: false, reason: "アクセス判定中にエラーが発生しました。" });
  }
});
