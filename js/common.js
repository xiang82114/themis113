// === splash（維持原行為） ===
window.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    const splash = document.getElementById("splash");
    if (splash) splash.classList.add("hide");
  }, 600);
});

// === AOS（維持原行為） ===
AOS.init({
  once: true
});

// === Navbar 顏色切換（維持原行為） ===
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.classList.remove("navbar-transparent");
    navbar.classList.add("navbar-colored");
  } else {
    navbar.classList.add("navbar-transparent");
    navbar.classList.remove("navbar-colored");
  }
});

// === Lenis 平滑捲動 ===
// 尊重「偏好減少動態」使用者
const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis = null;
if (!prefersReduce && window.Lenis) {
  lenis = new window.Lenis({
    // 建議 1.2 ~ 1.5：越大越慢、越平穩
    duration: 1.5,
    // 自然一點的 easing（可改成你喜歡的）
    easing: (t) => 1 - Math.pow(1 - t, 3),
    // 預設 smooth 設定即可
    smoothWheel: true,
    smoothTouch: false
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// === 讓 #anchor 連結用 Lenis 平滑捲動，並考量固定導覽列高度 ===
document.addEventListener("click", function (e) {
  const a = e.target.closest('a[href*="#"]');
  if (!a) return;

  const url = new URL(a.href, location.href);
  const isSamePath = (url.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, ''));
  const hash = url.hash;

  if (!hash || !isSamePath) return; // 不同頁交給瀏覽器處理

  const target = document.querySelector(hash);
  if (!target) return;

  e.preventDefault();

  const header = document.querySelector(".navbar");
  const offset = header ? -header.offsetHeight : 0;

  if (lenis) {
    lenis.scrollTo(target, {
      offset,
      // 與 lenis 初始化要一致（較溫柔）：
      duration: 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
  } else {
    // 安全網：若使用者啟用「減少動態」或 Lenis 不可用，使用原生
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // 再校正一下導覽列高度
    setTimeout(() => {
      const y = window.scrollY - (header ? header.offsetHeight : 0);
      window.scrollTo(0, y);
    }, 0);
  }

  // 更新網址 hash 並做無障礙 focus（避免自動滾動）
  if (history && history.pushState) history.pushState(null, "", hash);
  const prevTabIndex = target.getAttribute("tabindex");
  if (!prevTabIndex) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  if (!prevTabIndex) target.removeAttribute("tabindex");
}, { passive: false });

// === 在需要阻止平滑滾動的容器（例如彈窗/側欄）加入 data-lenis-prevent ===
// 文件內若有：<div class="modal" data-lenis-prevent>...</div>
// 當滑鼠在這個容器內滾動，Lenis 會交回原生滾動，以避免捲動穿透
