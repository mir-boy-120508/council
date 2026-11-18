/**
 * 橘中学校 生徒会公式プラットフォーム — データ管理・権限制御・アクセス制限エンジン
 * 仕様書 第6章・第7章・第8章・第9章・第10章・第13章 準拠
 */

(function () {
  const STORAGE_KEY = "tachibana_sc_platform_v1";
  const SESSION_KEY = "tachibana_sc_session_v1";

  const ROLES = {
    student: { label: "一般生徒", level: 1 },
    officer: { label: "生徒会役員", level: 2 },
    teacher: { label: "教職員", level: 3 },
    admin: { label: "システム管理者", level: 4 }
  };

  const PROGRESS_STAGES = [
    { id: 1, name: "受付", desc: "生徒から提案や意見を受け付けた段階です。" },
    { id: 2, name: "署名・賛同の募集", desc: "オンライン署名を通じて生徒からの賛同を集めています。" },
    { id: 3, name: "生徒会での検討", desc: "生徒会執行部・委員会で課題や実現方法を整理しています。" },
    { id: 4, name: "学校への提出", desc: "生徒会から担当教職員・学校側へ正式に要望書を提出しました。" },
    { id: 5, name: "学校との協議", desc: "安全面や運用ルールについて学校側と協議を行っています。" },
    { id: 6, name: "結果の報告", desc: "協議の結果と今後の対応（または見送りの理由）を公開しています。" }
  ];

  const DEFAULT_USERS = [
    {
      uid: "stu-2026-001",
      displayName: "2年1組 生徒A",
      studentId: "2101",
      role: "student",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    },
    {
      uid: "stu-2026-002",
      displayName: "3年2組 生徒B",
      studentId: "3205",
      role: "student",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    },
    {
      uid: "off-2026-001",
      displayName: "生徒会長（3年）",
      studentId: "3101",
      role: "officer",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    },
    {
      uid: "off-2026-002",
      displayName: "生徒会書記（2年）",
      studentId: "2304",
      role: "officer",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    },
    {
      uid: "tch-2026-001",
      displayName: "生徒会担当 教諭",
      studentId: "T001",
      role: "teacher",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    },
    {
      uid: "adm-2026-001",
      displayName: "情報システム管理者",
      studentId: "ADM01",
      role: "admin",
      active: true,
      createdAt: "2026-04-08T09:00:00+09:00",
      updatedAt: "2026-04-08T09:00:00+09:00"
    }
  ];

  // 本番準拠の初期状態（仕様書 16-8：存在しない情報を事実として掲載しない）
  function createEmptyState() {
    return {
      isDemoMode: false,
      users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
      news: [],
      events: [],
      petitions: [],
      signatures: [],
      feedback: [],
      progress: [],
      schoolRules: [],
      auditLogs: [],
      accessControl: {
        enabled: true,
        mode: "interactive_only",
        morningStart: "08:15",
        lunchStart: "12:35",
        lunchEnd: "13:20",
        afterSchoolStart: "16:00",
        emergencyOverride: false,
        overrideReason: ""
      }
    };
  }

  // 動作確認・テスト用サンプルデータ（明示的に切り替えた場合のみ使用）
  function createSampleData() {
    const now = "2026-11-10T16:15:00+09:00";
    return {
      news: [
        {
          id: "news-sample-1",
          title: "【動作確認サンプル】令和8年度 後期生徒会スローガンと重点活動について",
          category: "公式発表",
          body: "後期生徒会執行部では「声を、集めるだけで終わらせない。」を基本理念に掲げ、全校生徒が学校運営に参加できる仕組みづくりを進めています。\n\n今学期は特に、昼休みの図書室利用ルールの見直しと、体育館ボール貸出方法の改善について、皆さんからの意見をもとに学校側と協議を行います。最新の検討状況は「活動の進捗」ページで随時公開します。",
          publishedAt: "2026-11-05",
          status: "published",
          authorUid: "off-2026-001",
          updatedAt: now
        },
        {
          id: "news-sample-2",
          title: "【動作確認サンプル】第2回 生徒議会・各専門委員会 活動報告",
          category: "活動報告",
          body: "11月2日（月）放課後に第2回生徒議会を開催しました。\n\n1. 生活委員会：朝のあいさつ運動の実施報告と今後の改善点\n2. 保健委員会：冬の換気・加湿チェック表の運用開始について\n3. 図書委員会：リクエスト図書の購入結果報告\n\n各クラスからの要望事項については、生徒会執行部にて分類のうえ順次回答・対応を進めます。",
          publishedAt: "2026-11-03",
          status: "published",
          authorUid: "off-2026-002",
          updatedAt: now
        },
        {
          id: "news-sample-3",
          title: "【動作確認サンプル】オンライン意見・提案フォームの試験運用ガイドライン",
          category: "お知らせ",
          body: "本プラットフォームを通じた提案・署名および意見送信は、授業時間中（8:15〜16:00、昼休みを除く）のアクセスを制限し、昼休みと放課後に利用できるルールで運用します。\n\n誹謗中傷や個人名の書き込みは禁止されています。建設的な学校づくりのために活用しましょう。",
          publishedAt: "2026-10-28",
          status: "published",
          authorUid: "off-2026-001",
          updatedAt: now
        }
      ],
      events: [
        {
          id: "evt-sample-1",
          title: "【動作確認サンプル】後期生徒総会 事前議案説明と資料公開",
          description: "後期生徒総会に向けた主要議案の解説と、全校生徒から寄せられた提案の検討方針を発表します。当日は体育館での対面開催に加え、資料を本ページでも公開します。",
          startAt: "2026-11-25T15:30:00+09:00",
          location: "橘中学校 体育館・公式プラットフォーム資料公開",
          status: "upcoming",
          archiveNote: "",
          createdAt: now,
          updatedAt: now
        },
        {
          id: "evt-sample-2",
          title: "【動作確認サンプル】橘祭（文化発表会）生徒会企画ステージ記録",
          description: "10月に開催された橘祭における生徒会企画「学校の未来アイデア発表」の記録アーカイブです。当日発表された3つの提案は現在「活動の進捗」ページで協議を継続しています。",
          startAt: "2026-10-18T10:00:00+09:00",
          location: "橘中学校 体育館",
          status: "ended",
          archiveNote: "全校生徒の投票により選ばれた3件の提案書を校長先生・教頭先生へ提出しました。",
          createdAt: "2026-10-01T12:00:00+09:00",
          updatedAt: "2026-10-20T16:30:00+09:00"
        }
      ],
      petitions: [
        {
          id: "pet-sample-1",
          title: "【動作確認サンプル】昼休みの図書室における個人学習・読書スペースの拡充",
          category: "学習環境",
          description: "現在、昼休みの図書室は貸出・返却手続きの生徒と読書・自習をする生徒の動線が重なり、静かに読書や調べ学習をするスペースが不足しています。奥の閲覧テーブル4卓を「静粛エリア」として区分けすることを提案します。",
          proposerUid: "stu-2026-001",
          showProposerName: false,
          targetCount: 50,
          signatureCount: 38,
          status: "open",
          councilResponse: "現在38名の賛同が集まっています。図書委員会および図書担当の先生とレイアウト変更の可否を相談しています。",
          createdAt: "2026-10-25",
          updatedAt: now
        },
        {
          id: "pet-sample-2",
          title: "【動作確認サンプル】夏季・気候変動期における体操服登校期間の柔軟な運用",
          category: "校内生活",
          description: "近年の気温上昇に伴い、5月や10月でも日中の気温が高い日が増えています。衣替え移行期間だけでなく、熱中症警戒アラート発令時や気温基準に応じた体操服登校の許可基準を明確にしてほしいです。",
          proposerUid: "stu-2026-002",
          showProposerName: false,
          targetCount: 80,
          signatureCount: 84,
          status: "threshold_reached",
          councilResponse: "目標署名数（80名）を達成しました。生徒会執行部にて要望書を作成し、生活指導部の先生方との協議日程を調整中です。",
          createdAt: "2026-10-12",
          updatedAt: now
        }
      ],
      signatures: [
        { id: "sig-init-1", petitionId: "pet-sample-1", userUid: "stu-2026-002", createdAt: now }
      ],
      feedback: [
        {
          id: "fb-sample-1",
          category: "校内環境についての要望",
          content: "【サンプル意見】西階段の踊り場の照明が夕方少し暗く感じることがあります。安全面のため点検をお願いしたいです。",
          wantsReply: true,
          senderUid: "stu-2026-001",
          status: "reviewing",
          adminNote: "事務室・施設担当の先生へ電球交換を依頼済み。",
          createdAt: "2026-11-08T12:45:00+09:00",
          updatedAt: now
        }
      ],
      progress: [
        {
          id: "prg-sample-1",
          title: "【動作確認サンプル】夏季・気候変動期の体操服登校基準の明確化",
          description: "生徒からの提案（署名84名達成）を受け、気温基準に応じた体操服登校の運用ルール改定を学校側と協議しています。",
          currentStage: 5,
          status: "in_progress",
          explanation: "11月6日に生徒会執行部と生活指導担当教諭で第1回協議を実施しました。気温基準（予想最高気温28度以上など）の具体案を整理しています。",
          resultReason: "",
          updatedAt: "2026-11-07"
        },
        {
          id: "prg-sample-2",
          title: "【動作確認サンプル】昇降口付近への傘立て増設とクラス表示プレートの設置",
          description: "雨天時に傘立てが不足し通行の妨げになっていた課題について、予備傘立ての配置とクラス別プレートの設置を行いました。",
          currentStage: 6,
          status: "completed",
          explanation: "環境委員会と協力し、各学年昇降口に予備傘立て2基ずつとラミネート製クラス表示を設置完了しました。",
          resultReason: "学校側の承認を得て、既存備品の再配置により予算内で実現しました。",
          updatedAt: "2026-10-30"
        },
        {
          id: "prg-sample-3",
          title: "【動作確認サンプル】休み時間中の自動販売機設置に関する検討結果",
          description: "校内への飲料自動販売機設置について、生徒会から学校側へ実現可能性を照会しました。",
          currentStage: 6,
          status: "not_realized",
          explanation: "学校管理職および教育委員会の施設管理基準を確認した結果、今回の設置は見送りとなりました。",
          resultReason: "金銭管理・ゴミ処理体制の維持、および電源容量・災害時安全基準の観点から校内設置は認められませんでした。代替案として水筒持参容量の制限緩和を継続協議しています。",
          updatedAt: "2026-10-19"
        }
      ],
      schoolRules: [
        {
          id: "rule-sample-1",
          category: "登下校・生活時間",
          title: "【動作確認サンプル】登校時刻および下校完了時刻のきまり",
          content: "1. 朝の登校は8時15分までに教室へ入室完了すること。\n2. 放課後の完全下校時刻は季節ごとに定められた時刻（11月〜2月は17時15分）を厳守すること。\n3. やむを得ず遅刻・早退する場合は、保護者からの連絡手続きを行うこと。",
          note: "※これはシステム動作確認用のサンプル項目です。実際の校則は学校承認後に掲載されます。",
          status: "approved",
          approvedBy: "tch-2026-001",
          approvedAt: "2026-04-10",
          updatedAt: "2026-04-10"
        },
        {
          id: "rule-sample-2",
          category: "学習・持ち物",
          title: "【動作確認サンプル】学習用具およびタブレット端末（GIGA端末）の利用ルール",
          content: "1. 学習に不要な物品は持ち込まないこと。\n2. 学校貸与の学習用端末は、授業および生徒会活動など学校が認めた目的のみに使用すること。\n3. 休憩時間中の私的利用やSNS等への不適切な投稿は禁止する。",
          note: "※これはシステム動作確認用のサンプル項目です。",
          status: "approved",
          approvedBy: "tch-2026-001",
          approvedAt: "2026-04-10",
          updatedAt: "2026-04-10"
        }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const init = createEmptyState();
        saveState(init);
        return init;
      }
      const parsed = JSON.parse(raw);
      return Object.assign(createEmptyState(), parsed);
    } catch (e) {
      return createEmptyState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCurrentUser() {
    try {
      const uid = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!uid) return null;
      const state = loadState();
      return state.users.find(u => u.uid === uid && u.active) || null;
    } catch (e) {
      return null;
    }
  }

  function loginAs(uid, persist = false) {
    const state = loadState();
    const user = state.users.find(u => u.uid === uid);
    if (!user) throw new Error("指定されたアカウントが見つかりません。");
    if (!user.active) throw new Error("このアカウントは現在停止されています。管理者にお問い合わせください。");
    sessionStorage.setItem(SESSION_KEY, uid);
    if (persist) localStorage.setItem(SESSION_KEY, uid);
    return user;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function hasRole(minRole) {
    const user = getCurrentUser();
    if (!user || !ROLES[user.role]) return false;
    return ROLES[user.role].level >= ROLES[minRole].level;
  }

  function addAuditLog(state, actorUid, action, targetType, targetId) {
    state.auditLogs.unshift({
      id: "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      actorUid: actorUid || "system",
      action,
      targetType,
      targetId,
      createdAt: new Date().toISOString()
    });
    if (state.auditLogs.length > 200) {
      state.auditLogs = state.auditLogs.slice(0, 200);
    }
  }

  // 時間帯アクセス制限判定（仕様書 第8章）
  function checkAccessSchedule(customDate) {
    const state = loadState();
    const ac = state.accessControl;
    const user = getCurrentUser();

    if (user && (user.role === "teacher" || user.role === "admin")) {
      return { allowed: true, reason: "教職員・管理者権限により制限対象外です。", mode: ac.mode };
    }
    if (!ac.enabled || ac.emergencyOverride) {
      return {
        allowed: true,
        reason: ac.emergencyOverride ? `例外解放中（${ac.overrideReason || "特別行事・緊急対応"}）` : "時間制限は現在無効です。",
        mode: ac.mode
      };
    }

    const now = customDate ? new Date(customDate) : new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) {
      return { allowed: true, reason: "休日のため利用可能です。", mode: ac.mode };
    }

    const toMinutes = (hhmm) => {
      const [h, m] = (hhmm || "00:00").split(":").map(Number);
      return h * 60 + m;
    };

    const currentMin = now.getHours() * 60 + now.getMinutes();
    const morningStart = toMinutes(ac.morningStart);
    const lunchStart = toMinutes(ac.lunchStart);
    const lunchEnd = toMinutes(ac.lunchEnd);
    const afterSchoolStart = toMinutes(ac.afterSchoolStart);

    if (currentMin < morningStart) {
      return { allowed: true, reason: "朝の登校時間前のため利用可能です。", mode: ac.mode };
    }
    if (currentMin >= lunchStart && currentMin < lunchEnd) {
      return { allowed: true, reason: `昼休み時間帯（${ac.lunchStart}〜${ac.lunchEnd}）のため利用可能です。`, mode: ac.mode };
    }
    if (currentMin >= afterSchoolStart) {
      return { allowed: true, reason: `放課後時間帯（${ac.afterSchoolStart}〜）のため利用可能です。`, mode: ac.mode };
    }

    return {
      allowed: false,
      mode: ac.mode,
      reason: `現在は授業時間帯のため、生徒のアクセスを制限しています。昼休み（${ac.lunchStart}〜${ac.lunchEnd}）または放課後（${ac.afterSchoolStart}以降）にご利用ください。`
    };
  }

  window.TachibanaStore = {
    ROLES,
    PROGRESS_STAGES,
    loadState,
    saveState,
    getCurrentUser,
    loginAs,
    logout,
    hasRole,
    checkAccessSchedule,

    enableSampleData() {
      const state = loadState();
      const sample = createSampleData();
      state.isDemoMode = true;
      state.news = sample.news;
      state.events = sample.events;
      state.petitions = sample.petitions;
      state.signatures = sample.signatures;
      state.feedback = sample.feedback;
      state.progress = sample.progress;
      state.schoolRules = sample.schoolRules;
      const actor = getCurrentUser();
      addAuditLog(state, actor ? actor.uid : "system", "動作確認用サンプルデータを読み込み", "system", "demo");
      saveState(state);
    },

    resetToProductionEmpty() {
      const state = createEmptyState();
      const actor = getCurrentUser();
      addAuditLog(state, actor ? actor.uid : "system", "本番初期状態（空データ）へリセット", "system", "reset");
      saveState(state);
    },

    getPublicNews() {
      return loadState().news
        .filter(n => n.status === "published")
        .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    },

    getPublicEvents() {
      return loadState().events
        .filter(e => e.status !== "draft")
        .sort((a, b) => (b.startAt || "").localeCompare(a.startAt || ""));
    },

    getPublicProgress() {
      return loadState().progress
        .slice()
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    },

    getPublicPetitions() {
      const state = loadState();
      const user = getCurrentUser();
      return state.petitions
        .filter(p => p.status !== "hidden")
        .map(p => {
          const proposer = state.users.find(u => u.uid === p.proposerUid);
          const hasSigned = user
            ? state.signatures.some(s => s.petitionId === p.id && s.userUid === user.uid)
            : false;
          return {
            id: p.id,
            title: p.title,
            category: p.category,
            description: p.description,
            proposerLabel: p.showProposerName && proposer ? proposer.displayName : "在校生（氏名非公開）",
            targetCount: p.targetCount,
            signatureCount: p.signatureCount,
            status: p.status,
            councilResponse: p.councilResponse || "",
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            hasSigned
          };
        })
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    },

    signPetition(petitionId) {
      const user = getCurrentUser();
      if (!user) throw new Error("署名するには生徒アカウントでのログインが必要です。");
      const schedule = checkAccessSchedule();
      if (!schedule.allowed) throw new Error(schedule.reason);
      const state = loadState();
      const petition = state.petitions.find(p => p.id === petitionId);
      if (!petition) throw new Error("対象の提案が見つかりません。");
      if (petition.status === "closed") throw new Error("この提案の署名募集はすでに終了しています。");
      const already = state.signatures.some(s => s.petitionId === petitionId && s.userUid === user.uid);
      if (already) throw new Error("この提案にはすでに署名済みです（同一アカウントによる重複署名はできません）。");

      state.signatures.push({
        id: "sig-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        petitionId,
        userUid: user.uid,
        createdAt: new Date().toISOString()
      });
      petition.signatureCount = state.signatures.filter(s => s.petitionId === petitionId).length;
      if (petition.signatureCount >= petition.targetCount && petition.status === "open") {
        petition.status = "threshold_reached";
      }
      petition.updatedAt = new Date().toISOString();
      saveState(state);
      return petition;
    },

    createPetition({ title, category, description, targetCount, showProposerName }) {
      const user = getCurrentUser();
      if (!user) throw new Error("提案を投稿するにはログインが必要です。");
      const schedule = checkAccessSchedule();
      if (!schedule.allowed) throw new Error(schedule.reason);
      if (!title || title.trim().length < 4) throw new Error("提案タイトルは4文字以上で入力してください。");
      if (!description || description.trim().length < 15) throw new Error("提案の背景や具体的な内容は15文字以上で入力してください。");
      const target = Math.max(10, Math.min(500, Math.round((Number(targetCount) || 30) / 10) * 10));
      const state = loadState();
      const today = new Date().toISOString().slice(0, 10);
      const item = {
        id: "pet-" + Date.now(),
        title: title.trim(),
        category: category || "校内生活",
        description: description.trim(),
        proposerUid: user.uid,
        showProposerName: Boolean(showProposerName),
        targetCount: target,
        signatureCount: 1,
        status: "open",
        councilResponse: "",
        createdAt: today,
        updatedAt: new Date().toISOString()
      };
      state.petitions.unshift(item);
      state.signatures.push({
        id: "sig-" + Date.now() + "-owner",
        petitionId: item.id,
        userUid: user.uid,
        createdAt: new Date().toISOString()
      });
      saveState(state);
      return item;
    },

    submitFeedback({ category, content, wantsReply }) {
      const user = getCurrentUser();
      if (!user) throw new Error("意見・質問を送信するにはログインが必要です。");
      const schedule = checkAccessSchedule();
      if (!schedule.allowed) throw new Error(schedule.reason);
      if (!content || content.trim().length < 8) throw new Error("内容は8文字以上で具体的に入力してください。");
      const state = loadState();
      const item = {
        id: "fb-" + Date.now(),
        category: category || "学校生活についての意見",
        content: content.trim(),
        wantsReply: Boolean(wantsReply),
        senderUid: user.uid,
        status: "new",
        adminNote: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.feedback.unshift(item);
      saveState(state);
      return item;
    },

    getApprovedSchoolRules() {
      return loadState().schoolRules
        .filter(r => r.status === "approved")
        .sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    },

    mutateAsRole(minRole, mutatorFn, auditAction, targetType, targetId) {
      if (!hasRole(minRole)) throw new Error("この操作を実行する権限がありません。");
      const user = getCurrentUser();
      const state = loadState();
      const result = mutatorFn(state, user);
      if (auditAction) {
        addAuditLog(state, user.uid, auditAction, targetType || "system", targetId || "-");
      }
      saveState(state);
      return result;
    }
  };
})();

// ES Modules向けの公開API。旧来のwindow.TachibanaStoreとの互換性を保つ。
const legacyStore = window.TachibanaStore;
export const PROGRESS_STAGES = legacyStore.PROGRESS_STAGES.map(stage => ({
  ...stage,
  label: stage.name
}));

export const store = {
  ...legacyStore,
  getState() {
    const state = legacyStore.loadState();
    // 旧画面が参照する名前も読み取り専用の互換プロパティとして提供する。
    return { ...state, accessSchedule: state.accessControl };
  },
  getPublishedNews() {
    return legacyStore.getPublicNews().map(item => ({
      ...item,
      summary: item.summary || item.body || ''
    }));
  },
  getApprovedRules() {
    return legacyStore.getApprovedSchoolRules().map(item => ({
      ...item,
      body: item.content || item.body || '',
      summary: item.summary || item.note || ''
    }));
  },
  isDemoMode() {
    return Boolean(legacyStore.loadState().isDemoMode);
  },
  hasUserSigned(petitionId, userUid) {
    return legacyStore.loadState().signatures.some(signature =>
      signature.petitionId === petitionId && signature.userUid === userUid
    );
  },
  createPetition(data = {}) {
    return legacyStore.createPetition({
      title: data.title,
      category: data.category,
      description: data.description ?? data.summary ?? '',
      targetCount: data.targetCount ?? data.goal ?? 30,
      showProposerName: data.showProposerName ?? data.showName ?? false
    });
  },
  submitFeedback(data = {}) {
    return legacyStore.submitFeedback({
      category: data.category,
      content: data.content ?? data.message ?? '',
      wantsReply: data.wantsReply
    });
  }
};
