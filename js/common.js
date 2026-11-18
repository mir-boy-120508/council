import { getCurrentUser, isStaffRole, logoutUser, ROLE_LABELS } from './auth.js';
import { store } from './store.js';
import { evaluateAccessPolicy } from './access-control.js';

window.TachibanaUI = { escapeHtml, showToast };

const NAV_ITEMS = [
  { href: 'index.html', label: 'ホーム' },
  { href: 'newsroom.html', label: 'お知らせ' },
  { href: 'events.html', label: 'イベント' },
  { href: 'progress.html', label: '活動の進捗' },
  { href: 'petitions.html', label: '提案・署名' },
  { href: 'feedback.html', label: '意見・質問' },
  { href: 'school-rules.html', label: '校内のきまり' }
];

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMultiline(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

export function statusDot(label, tone = 'neutral') {
  const cls = tone === 'active' ? 'is-active'
    : tone === 'pending' ? 'is-pending'
    : tone === 'accent' ? 'is-accent'
    : tone === 'danger' ? 'is-danger'
    : '';
  return `<span class="status-inline"><span class="status-dot ${cls}" aria-hidden="true"></span>${escapeHtml(label)}</span>`;
}

export function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

export function initCommonLayout(activePage) {
  const user = getCurrentUser();

  if (store.isDemoMode() && !document.getElementById('demo-mode-banner')) {
    const banner = document.createElement('div');
    banner.id = 'demo-mode-banner';
    banner.className = 'demo-banner';
    banner.innerHTML = `
      <span><span class="demo-banner-label">動作検証用サンプル表示中</span> — 公開時の初期状態はデータ0件です。</span>
      <button type="button" id="banner-reset-empty">本番初期状態（0件）に戻す</button>
    `;
    document.body.prepend(banner);
    document.getElementById('banner-reset-empty')?.addEventListener('click', () => {
      store.resetToProductionEmpty();
      location.reload();
    });
  }

  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    const navLinksHtml = NAV_ITEMS.map(item => {
      const current = item.href === activePage ? ' aria-current="page"' : '';
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    }).join('');

    const authHtml = user
      ? `
        <span class="nav-user-name desktop-only">${escapeHtml(user.displayName)}（${ROLE_LABELS[user.role] || user.role}）</span>
        ${isStaffRole(user.role) ? `<a href="admin.html" class="nav-link-action desktop-only">管理画面</a>` : ''}
        <button type="button" id="nav-logout-btn" class="nav-link-muted desktop-only">ログアウト</button>
      `
      : `<a href="login.html" class="nav-link-action desktop-only">ログイン</a>`;

    const mobileAuthHtml = user
      ? `
        <div style="font-size:0.875rem;color:var(--text-secondary);">ログイン中：<strong>${escapeHtml(user.displayName)}</strong>（${ROLE_LABELS[user.role] || user.role}）</div>
        ${isStaffRole(user.role) ? `<a href="admin.html" class="btn btn-primary" style="width:100%;">管理画面を開く</a>` : ''}
        <button type="button" id="mobile-logout-btn" class="btn btn-secondary" style="width:100%;">ログアウト</button>
      `
      : `<a href="login.html" class="btn btn-primary" style="width:100%;">ログインする</a>`;

    headerEl.className = 'site-header';
    headerEl.innerHTML = `
      <div class="nav-inner">
        <a href="index.html" class="brand" aria-label="橘中学校 生徒会公式プラットフォーム ホーム">
          <span>橘中学校</span>
          <span class="brand-sub">生徒会</span>
        </a>
        <nav class="primary-nav" aria-label="メインナビゲーション">
          ${navLinksHtml}
        </nav>
        <div class="nav-actions">
          ${authHtml}
          <button type="button" class="mobile-menu-toggle" id="mobile-menu-btn" aria-expanded="false" aria-controls="mobile-drawer" aria-label="メニューを開く">メニュー</button>
        </div>
      </div>
      <div class="mobile-drawer" id="mobile-drawer" aria-label="モバイルナビゲーション">
        <div class="mobile-drawer-links">
          ${NAV_ITEMS.map(item => {
            const current = item.href === activePage ? ' aria-current="page"' : '';
            return `<a href="${item.href}"${current}><span>${item.label}</span><span aria-hidden="true">→</span></a>`;
          }).join('')}
        </div>
        <div class="mobile-drawer-footer">
          ${mobileAuthHtml}
        </div>
      </div>
    `;

    const menuBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    const closeDrawer = () => {
      drawer?.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
      if (menuBtn) menuBtn.textContent = 'メニュー';
    };

    menuBtn?.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.textContent = isOpen ? '閉じる' : 'メニュー';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer?.classList.contains('open')) {
        closeDrawer();
        menuBtn?.focus();
      }
    });

    const handleLogout = () => {
      logoutUser();
      showToast('ログアウトしました。');
      setTimeout(() => { location.href = 'index.html'; }, 350);
    };
    document.getElementById('nav-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);
  }

  const footerEl = document.getElementById('site-footer');
  if (footerEl) {
    const policy = evaluateAccessPolicy(store.getState().accessSchedule, user?.role || 'guest');
    footerEl.className = 'site-footer';
    footerEl.innerHTML = `
      <div class="container">
        <div class="footer-head">
          <div>
            <strong style="color:var(--text-primary);font-size:0.95rem;">橘中学校 生徒会公式プラットフォーム</strong>
            <div style="margin-top:4px;">生徒の声を可視化し、学校生活の改善へつなげる公式窓口</div>
          </div>
          <div>${statusDot(policy.restricted ? '現在は授業時間帯のため閲覧専用' : '意見・署名の受付中', policy.restricted ? 'pending' : 'active')}</div>
        </div>
        <nav class="footer-nav" aria-label="フッターナビゲーション">
          ${NAV_ITEMS.map(i => `<a href="${i.href}">${i.label}</a>`).join('')}
          <a href="privacy.html">プライバシー・個人情報保護方針</a>
          <a href="login.html">ログイン・検証設定</a>
          ${user && isStaffRole(user.role) ? '<a href="admin.html">生徒会・教職員 管理画面</a>' : ''}
        </nav>
        <div class="footer-foot">
          <span>平日 08:15〜16:00（昼休み 12:40〜13:20 を除く）は生徒の投稿・署名を制限しています。</span>
          <span>© 橘中学校 生徒会執行部</span>
        </div>
      </div>
    `;
  }
}

export function setupReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  targets.forEach(el => observer.observe(el));
}
