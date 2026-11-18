const ROLE_LABELS = { teacher: '教職員', admin: '管理者' };

export function evaluateAccessPolicy(schedule = {}, role = 'guest', date = new Date()) {
  const config = schedule || {};
  if (role === 'teacher' || role === 'admin') {
    return { allowed: true, restricted: false, reason: `${ROLE_LABELS[role]}権限により制限対象外です。`, mode: config.mode || 'interactive_only' };
  }
  if (config.enabled === false || config.emergencyOverride === true) {
    return { allowed: true, restricted: false, reason: '現在、時間帯制限は適用されていません。', mode: config.mode || 'interactive_only' };
  }
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return { allowed: true, restricted: false, reason: '休日のため利用可能です。', mode: config.mode || 'interactive_only' };
  }
  const minutes = date.getHours() * 60 + date.getMinutes();
  const toMinutes = (value, fallback) => {
    const [h, m] = String(value || fallback).split(':').map(Number);
    return h * 60 + m;
  };
  const morning = toMinutes(config.morningStart, '08:15');
  const lunchStart = toMinutes(config.lunchStart, '12:35');
  const lunchEnd = toMinutes(config.lunchEnd, '13:20');
  const after = toMinutes(config.afterSchoolStart, '16:00');
  const allowed = minutes < morning || (minutes >= lunchStart && minutes < lunchEnd) || minutes >= after;
  const reason = allowed
    ? '現在は利用可能な時間帯です。'
    : `現在は授業時間帯のため、生徒の投稿・署名を制限しています。昼休み（${config.lunchStart || '12:35'}〜${config.lunchEnd || '13:20'}）または放課後（${config.afterSchoolStart || '16:00'}以降）にご利用ください。`;
  return { allowed, restricted: !allowed, reason, mode: config.mode || 'interactive_only' };
}
