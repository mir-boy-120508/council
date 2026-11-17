/**
 * 橘中学校 生徒会公式プラットフォーム — 共通UIコンポーネント・ナビゲーション・演出
 * 仕様書 第2章・第3章・第8章・第11章 準拠
 */

(function () {
  const NAV_ITEMS = [
    { href: "index.html", label: "ホーム" },
    { href: "newsroom.html", label: "お知らせ" },
    { href: "events.html", label: "イベント" },
    { href: "progress.html", label: "活動の進捗" },
    { href: "petitions.html", label: "提案・署名" },
    { href: "feedback.html", label: "意見・質問" },
    { href: "school-rules.html", label: "校内のきまり" }
  ];

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message) {
    let el = document.getElementById("global-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 3600);
  }

  function renderDemoBanner() {
    const state = window.TachibanaStore.loadState();
    const existing = document.getElementById("demo-mode-banner");
    if (existing) existing.remove();
    if (!state.isDemoMode) return;

    const banner = document.createElement("div");
    banner.id = "demo-mode-banner";
    banner.className = "demo-banner";
    banner.innerHTML = `
      <span class="demo-banner-badge">検証モード</span>
      <span>現在は動作確認用サンプルデータを表示しています（実際の学校データではありません）。</span>
      <button type="button" id="banner-reset-demo">本番初期状態（空データ）に戻す</button>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    document.getElementById("banner-reset-demo").addEventListener("click", () => {
      window.TachibanaStore.resetToProductionEmpty();
      location.reload();
    });
  }

  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const currentFile = location.pathname.split("/").pop() || "index.html";
    const user = window.TachibanaStore.getCurrentUser();
    const canAdmin = window.TachibanaStore.hasRole("officer");

    const desktopLinks = NAV_ITEMS.map(item => {
      const currentAttr = item.href === currentFile ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${currentAttr}>${item.label}</a>`;
    }).join("");

    let rightActions = "";
    let mobileFooterActions = "";

    if (user) {
      const roleInfo = window.TachibanaStore.ROLES[user.role];
      rightActions = `
        <span class="user-pill desktop-only" title="ログイン中のアカウント">
          <span>${escapeHtml(user.displayName)}</span>
          <span class="user-role-tag">${escapeHtml(roleInfo.label)}</span>
        </span>
        ${canAdmin ? `<a class="nav-btn nav-btn-primary desktop-only" href="admin.html">管理画面</a>` : ""}
        <button type="button" class="nav-btn desktop-only" id="nav-logout-btn">ログアウト</button>
      `;
      mobileFooterActions = `
        <div class="user-pill" style="justify-content:space-between;">
          <span>${escapeHtml(user.displayName)}</span>
          <span class="user-role-tag">${escapeHtml(roleInfo.label)}</span>
        </div>
        ${canAdmin ? `<a class="btn btn-primary" href="admin.html">管理画面を開く</a>` : ""}
        <button type="button" class="btn btn-secondary" id="mobile-logout-btn">ログアウト</button>
      `;
    } else {
      rightActions = `
        <a class="nav-btn nav-btn-primary desktop-only" href="login.html">ログイン</a>
      `;
      mobileFooterActions = `
        <a class="btn btn-primary" href="login.html">生徒・教職員ログイン</a>
      `;
    }

    header.className = "site-header";
    header.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="index.html" aria-label="橘中学校 生徒会 ホーム">
          <span class="brand-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 3v18M3 12h18"></path>
            </svg>
          </span>
          <span>橘中学校<span class="brand-sub">生徒会</span></span>
        </a>

        <nav class="primary-nav" aria-label="主要メニュー">
          ${desktopLinks}
        </nav>

        <div class="nav-actions">
          ${rightActions}
          <button type="button" class="mobile-menu-toggle" id="mobile-menu-btn" aria-expanded="false" aria-controls="mobile-drawer">メニュー</button>
        </div>
      </div>
    `;

    let drawer = document.getElementById("mobile-drawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "mobile-drawer";
      drawer.className = "mobile-drawer";
      document.body.appendChild(drawer);
    }

    const mobileLinks = NAV_ITEMS.map(item => {
      const currentAttr = item.href === currentFile ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${currentAttr}><span>${item.label}</span><span aria-hidden="true">›</span></a>`;
    }).join("");

    drawer.innerHTML = `
      <nav class="mobile-drawer-links" aria-label="モバイルメニュー">
        ${mobileLinks}
        <a href="privacy.html"><span>プライバシー・利用上の注意</span><span aria-hidden="true">›</span></a>
      </nav>
      <div class="mobile-drawer-footer">
        ${mobileFooterActions}
      </div>
    `;

    const menuBtn = document.getElementById("mobile-menu-btn");
    menuBtn.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.textContent = isOpen ? "閉じる" : "メニュー";
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    const handleLogout = () => {
      window.TachibanaStore.logout();
      showToast("ログアウトしました。");
      setTimeout(() => location.reload(), 400);
    };
    const logoutBtn = document.getElementById("nav-logout-btn");
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);
  }

  function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div>
            <strong style="font-size:1rem;">橘中学校 生徒会公式プラットフォーム</strong>
            <p style="margin:6px 0 0; font-size:0.875rem; color:var(--text-secondary);">声を、集めるだけで終わらせない。生徒と学校をつなぐ公式窓口。</p>
          </div>
          <div style="font-size:0.8125rem; color:var(--text-secondary);">
            運用体制：生徒会執行部・担当教職員 共同管理
          </div>
        </div>
        <nav class="footer-nav" aria-label="フッターナビゲーション">
          ${NAV_ITEMS.map(i => `<a href="${i.href}">${i.label}</a>`).join("")}
          <a href="login.html">ログイン</a>
          <a href="admin.html">管理画面</a>
          <a href="privacy.html">プライバシー・利用上の注意</a>
        </nav>
        <div class="footer-bottom">
          <span>※掲載内容および各機能の本格運用は、学校側の確認・承認を経て実施します。</span>
          <span>© 2026 橘中学校 生徒会</span>
        </div>
      </div>
    `;
  }

  function initRevealObserver() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    targets.forEach(el => obs.observe(el));
  }

  // 全生徒ページ制限モード時のアクセスガード（仕様書 8-3）
  function enforceGlobalStudentGuard() {
    const file = location.pathname.split("/").pop() || "index.html";
    if (file === "login.html" || file === "admin.html" || file === "privacy.html") return;
    const schedule = window.TachibanaStore.checkAccessSchedule();
    if (!schedule.allowed && schedule.mode === "all_student_pages") {
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML = `
          <div class="container section">
            <div class="alert-box alert-warning" style="max-width:640px; margin:40px auto; padding:32px;">
              <h1 style="font-size:1.35rem; margin:0 0 12px;">現在は授業時間帯のためアクセスを制限しています</h1>
              <p style="margin:0 0 20px;">${escapeHtml(schedule.reason)}</p>
              <a class="btn btn-secondary" href="login.html">教職員・管理者ログインはこちら</a>
            </div>
          </div>
        `;
      }
    }
  }

  window.TachibanaUI = {
    escapeHtml,
    showToast,
    renderHeader,
    renderDemoBanner
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderDemoBanner();
    renderHeader();
    renderFooter();
    enforceGlobalStudentGuard();
    initRevealObserver();
  });
})();
