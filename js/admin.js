/**
 * 橘中学校 生徒会公式プラットフォーム — 管理画面制御
 * 仕様書 第5章・第6章・第7章・第8章・第10章・第13章 準拠
 */

(function () {
  const { escapeHtml, showToast } = window.TachibanaUI;
  const Store = window.TachibanaStore;

  function initAdminPage() {
    const guardEl = document.getElementById("admin-access-guard");
    const appEl = document.getElementById("admin-app");
    if (!guardEl || !appEl) return;

    const user = Store.getCurrentUser();
    if (!user || !Store.hasRole("officer")) {
      guardEl.innerHTML = `
        <div class="alert-box alert-danger" style="max-width:640px; margin:48px auto; padding:32px;">
          <h1 style="font-size:1.35rem; margin:0 0 12px;">管理画面へのアクセス権限がありません</h1>
          <p style="margin:0 0 20px;">このページは生徒会役員・教職員・システム管理者専用です。一般生徒アカウントおよび未ログイン状態では管理機能を利用できません。</p>
          <a class="btn btn-primary" href="login.html">管理者アカウントでログイン</a>
        </div>
      `;
      appEl.style.display = "none";
      return;
    }

    guardEl.style.display = "none";
    appEl.style.display = "block";

    const roleInfo = Store.ROLES[user.role];
    const headerMeta = document.getElementById("admin-user-meta");
    if (headerMeta) {
      headerMeta.textContent = `ログイン中：${user.displayName}（権限：${roleInfo.label}）`;
    }

    // タブ切り替え
    const tabBtns = document.querySelectorAll(".admin-tab-btn");
    const panels = document.querySelectorAll(".admin-panel");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const target = document.getElementById(btn.getAttribute("data-tab"));
        if (target) target.classList.add("active");
      });
    });

    function refreshAll() {
      const state = Store.loadState();
      updateCounts(state);
      renderNewsAdmin(state);
      renderEventsAdmin(state);
      renderPetitionsAdmin(state);
      renderFeedbackAdmin(state);
      renderProgressAdmin(state);
      renderRulesAdmin(state);
      renderUsersAdmin(state);
      renderScheduleAdmin(state);
      renderLogsAdmin(state);
    }

    function updateCounts(state) {
      const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
      setTxt("cnt-news", state.news.length);
      setTxt("cnt-events", state.events.length);
      setTxt("cnt-petitions", state.petitions.length);
      setTxt("cnt-feedback", state.feedback.filter(f => f.status === "new").length);
      setTxt("cnt-progress", state.progress.length);
      setTxt("cnt-rules", state.schoolRules.length);
    }

    // 1. お知らせ管理
    const newsForm = document.getElementById("admin-news-form");
    if (newsForm) {
      newsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const editId = document.getElementById("admin-news-id").value;
        const title = document.getElementById("admin-news-title").value.trim();
        const category = document.getElementById("admin-news-cat").value;
        const status = document.getElementById("admin-news-status").value;
        const publishedAt = document.getElementById("admin-news-date").value || new Date().toISOString().slice(0, 10);
        const body = document.getElementById("admin-news-body").value.trim();
        if (!title || !body) return alert("タイトルと本文を入力してください。");

        Store.mutateAsRole("officer", (state, actor) => {
          if (editId) {
            const item = state.news.find(n => n.id === editId);
            if (item) {
              Object.assign(item, { title, category, status, publishedAt, body, updatedAt: new Date().toISOString() });
            }
          } else {
            state.news.unshift({
              id: "news-" + Date.now(),
              title,
              category,
              body,
              publishedAt,
              status,
              authorUid: actor.uid,
              updatedAt: new Date().toISOString()
            });
          }
        }, editId ? `お知らせを更新（${title}）` : `お知らせを作成（${title}）`, "news", editId || "new");

        newsForm.reset();
        document.getElementById("admin-news-id").value = "";
        showToast("お知らせを保存しました。");
        refreshAll();
      });
    }

    function renderNewsAdmin(state) {
      const tbody = document.getElementById("admin-news-tbody");
      if (!tbody) return;
      if (state.news.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">登録されたお知らせはありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.news.map(n => `
        <tr>
          <td>${escapeHtml(n.publishedAt)}</td>
          <td><span class="badge">${escapeHtml(n.category)}</span></td>
          <td><strong>${escapeHtml(n.title)}</strong></td>
          <td><span class="badge ${n.status === "published" ? "badge-success" : "badge-warning"}">${n.status === "published" ? "公開中" : "下書き/非公開"}</span></td>
          <td class="admin-actions">
            <button type="button" class="btn-xs" data-edit-news="${escapeHtml(n.id)}">編集</button>
            <button type="button" class="btn-xs" data-toggle-news="${escapeHtml(n.id)}">${n.status === "published" ? "非公開にする" : "公開する"}</button>
            <button type="button" class="btn-xs btn-xs-danger" data-del-news="${escapeHtml(n.id)}">削除</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll("[data-edit-news]").forEach(b => b.addEventListener("click", () => {
        const item = state.news.find(n => n.id === b.getAttribute("data-edit-news"));
        if (!item) return;
        document.getElementById("admin-news-id").value = item.id;
        document.getElementById("admin-news-title").value = item.title;
        document.getElementById("admin-news-cat").value = item.category;
        document.getElementById("admin-news-status").value = item.status;
        document.getElementById("admin-news-date").value = item.publishedAt;
        document.getElementById("admin-news-body").value = item.body;
        newsForm.scrollIntoView({ behavior: "smooth" });
      }));

      tbody.querySelectorAll("[data-toggle-news]").forEach(b => b.addEventListener("click", () => {
        const id = b.getAttribute("data-toggle-news");
        Store.mutateAsRole("officer", (st) => {
          const item = st.news.find(n => n.id === id);
          if (item) {
            item.status = item.status === "published" ? "draft" : "published";
            item.updatedAt = new Date().toISOString();
          }
        }, "お知らせ公開状態を切替", "news", id);
        showToast("公開状態を切り替えました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-del-news]").forEach(b => b.addEventListener("click", () => {
        if (!confirm("このお知らせを削除してもよろしいですか？")) return;
        const id = b.getAttribute("data-del-news");
        Store.mutateAsRole("officer", (st) => {
          st.news = st.news.filter(n => n.id !== id);
        }, "お知らせを削除", "news", id);
        showToast("お知らせを削除しました。");
        refreshAll();
      }));
    }

    // 2. イベント管理
    const eventForm = document.getElementById("admin-event-form");
    if (eventForm) {
      eventForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("admin-evt-title").value.trim();
        const startAt = document.getElementById("admin-evt-start").value;
        const location = document.getElementById("admin-evt-loc").value.trim();
        const status = document.getElementById("admin-evt-status").value;
        const description = document.getElementById("admin-evt-desc").value.trim();
        const archiveNote = document.getElementById("admin-evt-archive").value.trim();
        if (!title || !startAt || !description) return alert("イベント名・開催日時・概要を入力してください。");

        Store.mutateAsRole("officer", (st) => {
          st.events.unshift({
            id: "evt-" + Date.now(),
            title,
            description,
            startAt,
            location,
            status,
            archiveNote,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }, `イベントを登録（${title}）`, "events", title);

        eventForm.reset();
        showToast("イベントを保存しました。");
        refreshAll();
      });
    }

    function renderEventsAdmin(state) {
      const tbody = document.getElementById("admin-events-tbody");
      if (!tbody) return;
      if (state.events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">登録されたイベントはありません。</td></tr>`;
        return;
      }
      const labels = { draft: "下書き", upcoming: "開催予定", ongoing: "開催中", ended: "終了（アーカイブ）" };
      tbody.innerHTML = state.events.map(ev => `
        <tr>
          <td>${escapeHtml(ev.startAt.replace("T", " "))}</td>
          <td><strong>${escapeHtml(ev.title)}</strong></td>
          <td><span class="badge">${labels[ev.status] || ev.status}</span></td>
          <td class="admin-actions">
            <select class="btn-xs" data-evt-status-sel="${escapeHtml(ev.id)}">
              <option value="draft" ${ev.status === "draft" ? "selected" : ""}>下書き</option>
              <option value="upcoming" ${ev.status === "upcoming" ? "selected" : ""}>開催予定</option>
              <option value="ongoing" ${ev.status === "ongoing" ? "selected" : ""}>開催中</option>
              <option value="ended" ${ev.status === "ended" ? "selected" : ""}>終了</option>
            </select>
            <button type="button" class="btn-xs btn-xs-danger" data-del-evt="${escapeHtml(ev.id)}">削除</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll("[data-evt-status-sel]").forEach(sel => sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-evt-status-sel");
        Store.mutateAsRole("officer", (st) => {
          const item = st.events.find(e => e.id === id);
          if (item) { item.status = sel.value; item.updatedAt = new Date().toISOString(); }
        }, "イベント状態を変更", "events", id);
        showToast("イベント状態を更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-del-evt]").forEach(b => b.addEventListener("click", () => {
        if (!confirm("このイベントを削除しますか？")) return;
        const id = b.getAttribute("data-del-evt");
        Store.mutateAsRole("officer", (st) => {
          st.events = st.events.filter(e => e.id !== id);
        }, "イベントを削除", "events", id);
        showToast("イベントを削除しました。");
        refreshAll();
      }));
    }

    // 3. 提案・署名管理（署名者個人情報は管理画面でも一覧公開せず件数と内容のみ扱う）
    function renderPetitionsAdmin(state) {
      const tbody = document.getElementById("admin-petitions-tbody");
      if (!tbody) return;
      if (state.petitions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">投稿された提案はありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.petitions.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.title)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(p.description.slice(0, 60))}…</small></td>
          <td><strong>${p.signatureCount}</strong> / ${p.targetCount}名</td>
          <td>
            <select class="btn-xs" data-pet-status="${escapeHtml(p.id)}">
              <option value="open" ${p.status === "open" ? "selected" : ""}>賛同募集中</option>
              <option value="threshold_reached" ${p.status === "threshold_reached" ? "selected" : ""}>目標達成・検討中</option>
              <option value="closed" ${p.status === "closed" ? "selected" : ""}>募集終了</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn-xs" data-pet-reply="${escapeHtml(p.id)}">説明文を編集</button>
            <button type="button" class="btn-xs btn-xs-primary" data-pet-to-prg="${escapeHtml(p.id)}">進捗へ登録</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll("[data-pet-status]").forEach(sel => sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-pet-status");
        Store.mutateAsRole("officer", (st) => {
          const item = st.petitions.find(p => p.id === id);
          if (item) { item.status = sel.value; item.updatedAt = new Date().toISOString(); }
        }, "提案ステータス変更", "petitions", id);
        showToast("提案ステータスを更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-pet-reply]").forEach(btn => btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-pet-reply");
        const item = state.petitions.find(p => p.id === id);
        const next = prompt("生徒会からの検討コメント・説明文を入力してください：", item ? item.councilResponse : "");
        if (next === null) return;
        Store.mutateAsRole("officer", (st) => {
          const target = st.petitions.find(p => p.id === id);
          if (target) { target.councilResponse = next.trim(); target.updatedAt = new Date().toISOString(); }
        }, "提案への生徒会説明を更新", "petitions", id);
        showToast("生徒会コメントを更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-pet-to-prg]").forEach(btn => btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-pet-to-prg");
        const item = state.petitions.find(p => p.id === id);
        if (!item) return;
        Store.mutateAsRole("officer", (st) => {
          st.progress.unshift({
            id: "prg-" + Date.now(),
            title: item.title,
            description: item.description,
            currentStage: 3,
            status: "in_progress",
            explanation: `提案・署名（賛同${item.signatureCount}名）を受け、生徒会執行部で検討を開始しました。`,
            resultReason: "",
            updatedAt: new Date().toISOString().slice(0, 10)
          });
        }, "提案を進捗管理へ移行", "progress", id);
        showToast("「活動の進捗」ページへ登録しました。");
        refreshAll();
      }));
    }

    // 4. 意見・質問管理（非公開受付）
    function renderFeedbackAdmin(state) {
      const tbody = document.getElementById("admin-feedback-tbody");
      if (!tbody) return;
      if (state.feedback.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">受付した意見・質問はありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.feedback.map(fb => `
        <tr>
          <td><span class="badge">${escapeHtml(fb.category)}</span><br><small style="color:var(--text-secondary);">${escapeHtml(fb.createdAt.slice(0, 10))}</small></td>
          <td style="max-width:420px; white-space:pre-wrap;">${escapeHtml(fb.content)}${fb.wantsReply ? '<br><span class="badge badge-accent" style="margin-top:6px;">回答希望あり</span>' : ""}</td>
          <td>
            <select class="btn-xs" data-fb-status="${escapeHtml(fb.id)}">
              <option value="new" ${fb.status === "new" ? "selected" : ""}>未確認</option>
              <option value="reviewing" ${fb.status === "reviewing" ? "selected" : ""}>検討・整理中</option>
              <option value="resolved" ${fb.status === "resolved" ? "selected" : ""}>対応済み</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn-xs" data-fb-to-pet="${escapeHtml(fb.id)}">提案・署名へ化案</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll("[data-fb-status]").forEach(sel => sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-fb-status");
        Store.mutateAsRole("officer", (st) => {
          const item = st.feedback.find(f => f.id === id);
          if (item) { item.status = sel.value; item.updatedAt = new Date().toISOString(); }
        }, "意見・質問の対応状況を変更", "feedback", id);
        showToast("対応状況を更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-fb-to-pet]").forEach(btn => btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-fb-to-pet");
        const fb = state.feedback.find(f => f.id === id);
        if (!fb) return;
        const title = prompt("提案・署名ページに掲載するタイトルを入力してください：", fb.content.slice(0, 28));
        if (!title) return;
        Store.mutateAsRole("officer", (st, actor) => {
          st.petitions.unshift({
            id: "pet-" + Date.now(),
            title: title.trim(),
            category: "校内生活",
            description: fb.content,
            proposerUid: actor.uid,
            showProposerName: false,
            targetCount: 50,
            signatureCount: 0,
            status: "open",
            councilResponse: "生徒から寄せられた意見をもとに、生徒会が提案として起案しました。",
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString()
          });
        }, "意見から提案・署名を作成", "petitions", id);
        showToast("提案・署名ページへ公開しました。");
        refreshAll();
      }));
    }

    // 5. 進捗管理
    const progressForm = document.getElementById("admin-progress-form");
    if (progressForm) {
      progressForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("admin-prg-title").value.trim();
        const currentStage = Number(document.getElementById("admin-prg-stage").value);
        const status = document.getElementById("admin-prg-status").value;
        const description = document.getElementById("admin-prg-desc").value.trim();
        const explanation = document.getElementById("admin-prg-exp").value.trim();
        const resultReason = document.getElementById("admin-prg-reason").value.trim();
        if (!title || !description) return alert("案件名と概要を入力してください。");

        Store.mutateAsRole("officer", (st) => {
          st.progress.unshift({
            id: "prg-" + Date.now(),
            title,
            description,
            currentStage,
            status,
            explanation,
            resultReason,
            updatedAt: new Date().toISOString().slice(0, 10)
          });
        }, `進捗案件を登録（${title}）`, "progress", title);

        progressForm.reset();
        showToast("進捗項目を登録しました。");
        refreshAll();
      });
    }

    function renderProgressAdmin(state) {
      const tbody = document.getElementById("admin-progress-tbody");
      if (!tbody) return;
      if (state.progress.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">登録された進捗案件はありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.progress.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.title)}</strong></td>
          <td>
            <select class="btn-xs" data-prg-stage-sel="${escapeHtml(p.id)}">
              ${Store.PROGRESS_STAGES.map(s => `<option value="${s.id}" ${Number(p.currentStage) === s.id ? "selected" : ""}>${s.id}. ${s.name}</option>`).join("")}
            </select>
          </td>
          <td>
            <select class="btn-xs" data-prg-status-sel="${escapeHtml(p.id)}">
              <option value="not_started" ${p.status === "not_started" ? "selected" : ""}>未着手</option>
              <option value="in_progress" ${p.status === "in_progress" ? "selected" : ""}>対応中</option>
              <option value="completed" ${p.status === "completed" ? "selected" : ""}>完了</option>
              <option value="not_realized" ${p.status === "not_realized" ? "selected" : ""}>実現しなかった</option>
            </select>
          </td>
          <td class="admin-actions">
            <button type="button" class="btn-xs" data-prg-edit-exp="${escapeHtml(p.id)}">説明・理由を更新</button>
            <button type="button" class="btn-xs btn-xs-danger" data-del-prg="${escapeHtml(p.id)}">削除</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll("[data-prg-stage-sel]").forEach(sel => sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-prg-stage-sel");
        Store.mutateAsRole("officer", (st) => {
          const item = st.progress.find(p => p.id === id);
          if (item) { item.currentStage = Number(sel.value); item.updatedAt = new Date().toISOString().slice(0, 10); }
        }, "進捗段階を更新", "progress", id);
        showToast("進行段階を更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-prg-status-sel]").forEach(sel => sel.addEventListener("change", () => {
        const id = sel.getAttribute("data-prg-status-sel");
        Store.mutateAsRole("officer", (st) => {
          const item = st.progress.find(p => p.id === id);
          if (item) { item.status = sel.value; item.updatedAt = new Date().toISOString().slice(0, 10); }
        }, "進捗対応状況を変更", "progress", id);
        showToast("対応状況を更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-prg-edit-exp]").forEach(btn => btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-prg-edit-exp");
        const item = state.progress.find(p => p.id === id);
        if (!item) return;
        const exp = prompt("生徒会からの現在の説明：", item.explanation || "");
        if (exp === null) return;
        const reason = prompt("結果・理由（実現しなかった場合の理由など）：", item.resultReason || "");
        if (reason === null) return;
        Store.mutateAsRole("officer", (st) => {
          const t = st.progress.find(p => p.id === id);
          if (t) { t.explanation = exp.trim(); t.resultReason = reason.trim(); t.updatedAt = new Date().toISOString().slice(0, 10); }
        }, "進捗説明・理由を更新", "progress", id);
        showToast("説明と理由を更新しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-del-prg]").forEach(btn => btn.addEventListener("click", () => {
        if (!confirm("この進捗項目を削除しますか？")) return;
        const id = btn.getAttribute("data-del-prg");
        Store.mutateAsRole("officer", (st) => { st.progress = st.progress.filter(p => p.id !== id); }, "進捗項目を削除", "progress", id);
        showToast("進捗項目を削除しました。");
        refreshAll();
      }));
    }

    // 6. 校内ルール管理（教職員による承認必須フロー — 仕様書 4-7, 6-1, 7-5）
    const ruleForm = document.getElementById("admin-rule-form");
    if (ruleForm) {
      ruleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const category = document.getElementById("admin-rule-cat").value.trim() || "基本規定";
        const title = document.getElementById("admin-rule-title").value.trim();
        const content = document.getElementById("admin-rule-content").value.trim();
        const note = document.getElementById("admin-rule-note").value.trim();
        if (!title || !content) return alert("ルールの名称と内容を入力してください。");

        // 生徒会役員が作成した場合は必ず「教職員承認待ち（pending_approval）」になり、直接公開は不可
        Store.mutateAsRole("officer", (st) => {
          st.schoolRules.unshift({
            id: "rule-" + Date.now(),
            category,
            title,
            content,
            note,
            status: "pending_approval",
            approvedBy: "",
            approvedAt: "",
            updatedAt: new Date().toISOString().slice(0, 10)
          });
        }, `校内ルール改定案を作成・教職員承認依頼（${title}）`, "schoolRules", title);

        ruleForm.reset();
        showToast("校内ルール案を登録し、教職員の承認待ちにしました。");
        refreshAll();
      });
    }

    function renderRulesAdmin(state) {
      const tbody = document.getElementById("admin-rules-tbody");
      if (!tbody) return;
      const isTeacherOrAdmin = Store.hasRole("teacher");
      if (state.schoolRules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">登録された校内ルールはありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.schoolRules.map(r => {
        const badge = r.status === "approved"
          ? `<span class="badge badge-success">教職員承認済み（公開中）</span>`
          : `<span class="badge badge-warning">教職員の承認待ち（非公開）</span>`;

        const approveBtn = isTeacherOrAdmin && r.status !== "approved"
          ? `<button type="button" class="btn-xs btn-xs-primary" data-approve-rule="${escapeHtml(r.id)}">教職員として承認・公開</button>`
          : !isTeacherOrAdmin && r.status !== "approved"
            ? `<span style="font-size:0.75rem; color:var(--text-tertiary);">※教職員アカウントでのみ承認可能</span>`
            : "";

        return `
          <tr>
            <td><span class="badge">${escapeHtml(r.category)}</span></td>
            <td><strong>${escapeHtml(r.title)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(r.content.slice(0, 60))}…</small></td>
            <td>${badge}</td>
            <td class="admin-actions">
              ${approveBtn}
              ${isTeacherOrAdmin ? `<button type="button" class="btn-xs btn-xs-danger" data-del-rule="${escapeHtml(r.id)}">削除</button>` : ""}
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll("[data-approve-rule]").forEach(btn => btn.addEventListener("click", () => {
        if (!confirm("この校内ルールを正式に承認し、全校生徒へ一般公開しますか？")) return;
        const id = btn.getAttribute("data-approve-rule");
        Store.mutateAsRole("teacher", (st, actor) => {
          const item = st.schoolRules.find(r => r.id === id);
          if (item) {
            item.status = "approved";
            item.approvedBy = actor.uid;
            item.approvedAt = new Date().toISOString().slice(0, 10);
            item.updatedAt = item.approvedAt;
          }
        }, "校内ルールを正式承認・公開", "schoolRules", id);
        showToast("校内ルールを承認し、一般公開しました。");
        refreshAll();
      }));

      tbody.querySelectorAll("[data-del-rule]").forEach(btn => btn.addEventListener("click", () => {
        if (!confirm("この校内ルールを削除しますか？")) return;
        const id = btn.getAttribute("data-del-rule");
        Store.mutateAsRole("teacher", (st) => { st.schoolRules = st.schoolRules.filter(r => r.id !== id); }, "校内ルールを削除", "schoolRules", id);
        showToast("校内ルールを削除しました。");
        refreshAll();
      }));
    }

    // 7. アカウント・権限管理 & 次年度役員交代引き継ぎ（教職員・システム管理者専用）
    function renderUsersAdmin(state) {
      const container = document.getElementById("admin-users-panel-body");
      if (!container) return;
      if (!Store.hasRole("teacher")) {
        container.innerHTML = `<div class="alert-box alert-warning">アカウントおよび権限の管理は、教職員またはシステム管理者のみ利用できます。</div>`;
        return;
      }

      container.innerHTML = `
        <div class="alert-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <strong>年度末・役員交代引き継ぎ処理：</strong>旧年度の生徒会役員権限を一括で「一般生徒」へ戻し、新役員への引き継ぎ準備を行います。
          </div>
          <button type="button" class="btn btn-secondary" id="handover-officers-btn">旧生徒会役員の権限一括解除（役員交代）</button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>表示名</th>
                <th>識別ID</th>
                <th>現在の役割</th>
                <th>状態</th>
                <th>権限・状態操作</th>
              </tr>
            </thead>
            <tbody>
              ${state.users.map(u => `
                <tr>
                  <td><strong>${escapeHtml(u.displayName)}</strong></td>
                  <td>${escapeHtml(u.studentId)}</td>
                  <td>
                    <select class="btn-xs" data-user-role="${escapeHtml(u.uid)}" ${u.uid === user.uid ? "disabled" : ""}>
                      <option value="student" ${u.role === "student" ? "selected" : ""}>一般生徒</option>
                      <option value="officer" ${u.role === "officer" ? "selected" : ""}>生徒会役員</option>
                      <option value="teacher" ${u.role === "teacher" ? "selected" : ""} ${!Store.hasRole("admin") ? "disabled" : ""}>教職員</option>
                      <option value="admin" ${u.role === "admin" ? "selected" : ""} ${!Store.hasRole("admin") ? "disabled" : ""}>システム管理者</option>
                    </select>
                  </td>
                  <td><span class="badge ${u.active ? "badge-success" : "badge-danger"}">${u.active ? "有効" : "停止中"}</span></td>
                  <td>
                    ${u.uid !== user.uid ? `<button type="button" class="btn-xs" data-user-active="${escapeHtml(u.uid)}">${u.active ? "アカウント停止" : "有効化"}</button>` : "<small>現在の操作者</small>"}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById("handover-officers-btn").addEventListener("click", () => {
        if (!confirm("現在「生徒会役員」に設定されているすべてのアカウントを「一般生徒」権限へ変更します。よろしいですか？")) return;
        Store.mutateAsRole("teacher", (st) => {
          st.users.forEach(u => {
            if (u.role === "officer") {
              u.role = "student";
              u.updatedAt = new Date().toISOString();
            }
          });
        }, "役員交代に伴う旧生徒会役員権限の一括解除", "users", "handover");
        showToast("旧役員の権限解除が完了しました。新役員の役割を設定してください。");
        refreshAll();
      });

      container.querySelectorAll("[data-user-role]").forEach(sel => sel.addEventListener("change", () => {
        const uid = sel.getAttribute("data-user-role");
        Store.mutateAsRole("teacher", (st) => {
          const target = st.users.find(u => u.uid === uid);
          if (target) { target.role = sel.value; target.updatedAt = new Date().toISOString(); }
        }, `ユーザー権限を「${sel.value}」に変更`, "users", uid);
        showToast("アカウント権限を更新しました。");
        refreshAll();
      }));

      container.querySelectorAll("[data-user-active]").forEach(btn => btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-user-active");
        Store.mutateAsRole("teacher", (st) => {
          const target = st.users.find(u => u.uid === uid);
          if (target) { target.active = !target.active; target.updatedAt = new Date().toISOString(); }
        }, "アカウント有効/停止状態を切替", "users", uid);
        showToast("アカウント状態を更新しました。");
        refreshAll();
      }));
    }

    // 8. 時間帯アクセス制限設定（第8章）
    function renderScheduleAdmin(state) {
      const container = document.getElementById("admin-schedule-panel-body");
      if (!container) return;
      const ac = state.accessControl;
      const canEdit = Store.hasRole("teacher");

      container.innerHTML = `
        <form id="admin-schedule-form" class="form-panel">
          <p style="margin-top:0; color:var(--text-secondary);">授業中の不要なアクセスを防ぐため、平日の授業時間帯（原則 8:15〜16:00、昼休みを除く）のアクセス制限を設定します。</p>
          <div class="form-group">
            <label class="checkbox-row">
              <input type="checkbox" id="ac-enabled" ${ac.enabled ? "checked" : ""} ${!canEdit ? "disabled" : ""}>
              <span><strong>時間帯アクセス制限を有効にする</strong></span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label" for="ac-mode">制限の適用範囲</label>
            <select class="form-control" id="ac-mode" ${!canEdit ? "disabled" : ""}>
              <option value="interactive_only" ${ac.mode === "interactive_only" ? "selected" : ""}>生徒限定操作（署名・新規提案・意見送信）のみ制限（公開情報の閲覧は可能）</option>
              <option value="all_student_pages" ${ac.mode === "all_student_pages" ? "selected" : ""}>生徒向け全ページの閲覧・操作を制限</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px;">
            <div class="form-group">
              <label class="form-label" for="ac-morning">朝の制限開始（1校時前）</label>
              <input class="form-control" type="time" id="ac-morning" value="${escapeHtml(ac.morningStart)}" ${!canEdit ? "disabled" : ""}>
            </div>
            <div class="form-group">
              <label class="form-label" for="ac-lunch-start">昼休み開始（解放開始）</label>
              <input class="form-control" type="time" id="ac-lunch-start" value="${escapeHtml(ac.lunchStart)}" ${!canEdit ? "disabled" : ""}>
            </div>
            <div class="form-group">
              <label class="form-label" for="ac-lunch-end">昼休み終了（制限再開）</label>
              <input class="form-control" type="time" id="ac-lunch-end" value="${escapeHtml(ac.lunchEnd)}" ${!canEdit ? "disabled" : ""}>
            </div>
            <div class="form-group">
              <label class="form-label" for="ac-after">放課後解放開始</label>
              <input class="form-control" type="time" id="ac-after" value="${escapeHtml(ac.afterSchoolStart)}" ${!canEdit ? "disabled" : ""}>
            </div>
          </div>
          <div class="alert-box alert-warning" style="margin-top:8px;">
            <label class="checkbox-row" style="margin-bottom:10px;">
              <input type="checkbox" id="ac-override" ${ac.emergencyOverride ? "checked" : ""} ${!canEdit ? "disabled" : ""}>
              <span><strong>特別例外：時間帯制限を一時的に解除する（生徒総会・特別行事用）</strong></span>
            </label>
            <input class="form-control" type="text" id="ac-override-reason" placeholder="例外解除の理由（例：後期生徒総会の議案確認のため）" value="${escapeHtml(ac.overrideReason || "")}" ${!canEdit ? "disabled" : ""}>
          </div>
          ${canEdit ? `<button type="submit" class="btn btn-primary">アクセス制限設定を保存</button>` : `<p class="form-hint">※設定の変更は教職員・システム管理者権限が必要です。</p>`}
        </form>
      `;

      const f = document.getElementById("admin-schedule-form");
      if (f && canEdit) {
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          Store.mutateAsRole("teacher", (st) => {
            st.accessControl = {
              enabled: document.getElementById("ac-enabled").checked,
              mode: document.getElementById("ac-mode").value,
              morningStart: document.getElementById("ac-morning").value,
              lunchStart: document.getElementById("ac-lunch-start").value,
              lunchEnd: document.getElementById("ac-lunch-end").value,
              afterSchoolStart: document.getElementById("ac-after").value,
              emergencyOverride: document.getElementById("ac-override").checked,
              overrideReason: document.getElementById("ac-override-reason").value.trim()
            };
          }, "時間帯アクセス制限設定を更新", "accessControl", "schedule");
          showToast("アクセス制限設定を保存しました。");
          refreshAll();
        });
      }
    }

    // 9. 操作履歴（auditLogs）
    function renderLogsAdmin(state) {
      const tbody = document.getElementById("admin-logs-tbody");
      if (!tbody) return;
      if (state.auditLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">操作履歴はまだありません。</td></tr>`;
        return;
      }
      tbody.innerHTML = state.auditLogs.slice(0, 50).map(l => {
        const actor = state.users.find(u => u.uid === l.actorUid);
        return `
          <tr>
            <td>${escapeHtml(l.createdAt.replace("T", " ").slice(0, 19))}</td>
            <td>${escapeHtml(actor ? actor.displayName : l.actorUid)}</td>
            <td>${escapeHtml(l.action)}</td>
            <td><span class="badge">${escapeHtml(l.targetType)}</span></td>
          </tr>
        `;
      }).join("");
    }

    refreshAll();
  }

  document.addEventListener("DOMContentLoaded", initAdminPage);
})();
