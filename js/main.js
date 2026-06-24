// ATX Gaming PCs — Shared JS

// Notice banner
function dismissBanner() {
  const banner = document.getElementById('noticeBanner');
  if (!banner) return;
  banner.style.transition = 'opacity 0.3s, transform 0.3s';
  banner.style.opacity = '0';
  banner.style.transform = 'translateY(-100%)';
  setTimeout(() => {
    banner.remove();
    document.body.classList.remove('has-banner');
  }, 300);
  sessionStorage.setItem('noticeDismissed', '1');
}
(function () {
  if (document.getElementById('noticeBanner')) {
    if (sessionStorage.getItem('noticeDismissed')) {
      dismissBanner();
    } else {
      document.body.classList.add('has-banner');
    }
  }
})();

// Theme
const toggleBtn = document.getElementById('themeToggle');
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  if (toggleBtn) toggleBtn.textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('atx-theme', t);
}
const saved = localStorage.getItem('atx-theme');
if (saved) applyTheme(saved);
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
function closeMenu() {
  if (!hamburger || !mobileNav) return;
  hamburger.classList.remove('open');
  mobileNav.classList.remove('open');
  document.body.style.overflow = '';
}
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(a => a.addEventListener('click', closeMenu));
}

// Nav shrink on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  if (window.scrollY > 60) {
    nav.style.height = '56px';
    nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
  } else {
    nav.style.height = 'var(--nav-h)';
    nav.style.boxShadow = 'none';
  }
}, { passive: true });

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) { el.target.classList.add('visible'); revealObserver.unobserve(el.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// Active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});
