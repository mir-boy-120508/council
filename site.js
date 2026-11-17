import { Backend } from "./js/firebase-service.js";

// 共通ナビゲーションのモバイル開閉・現在ページハイライト・ログイン状態反映
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const drawer = document.getElementById("mobileDrawer");

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.textContent = isOpen ? "閉じる" : "メニュー";
    });
  }

  // 現在ページの自動判定
  const currentFile = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a, .mobile-drawer a").forEach((link) => {
    if (link.getAttribute("href") === currentFile) {
      link.setAttribute("aria-current", "page");
    }
  });

  // スクロールに応じた控えめなフェードイン（視差効果を減らす設定を尊重）
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeTargets = document.querySelectorAll(".fade-in");
  if (!prefersReduced && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fadeTargets.forEach((el) => observer.observe(el));
  } else {
    fadeTargets.forEach((el) => el.classList.add("visible"));
  }

  // ログイン状態に応じたナビゲーション右側ボタンの更新
  const authSlot = document.getElementById("navAuthSlot");
  const mobileAuthSlot = document.getElementById("mobileAuthSlot");

  Backend.onAuthChanged((user, profile) => {
    window.__TACHIBANA_USER__ = user;
    window.__TACHIBANA_PROFILE__ = profile;
    document.dispatchEvent(new CustomEvent("tachibana:auth", { detail: { user, profile } }));

    if (!authSlot) return;
    if (user) {
      const role = profile?.role || "student";
      const isStaff = ["officer", "teacher", "admin"].includes(role);
      const adminLink = isStaff
        ? `<a class="nav-action-btn primary" href="admin.html">管理画面</a>`
        : "";
      const html = `
        ${adminLink}
        <a class="nav-action-btn" href="login.html">${escapeHtml(profile?.displayName || "マイページ")}</a>
      `;
      authSlot.innerHTML = html;
      if (mobileAuthSlot) mobileAuthSlot.innerHTML = html;
    } else {
      const html = `<a class="nav-action-btn" href="login.html">ログイン</a>`;
      authSlot.innerHTML = html;
      if (mobileAuthSlot) mobileAuthSlot.innerHTML = html;
    }
  });
});

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
