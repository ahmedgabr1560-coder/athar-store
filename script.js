// ATHAR Store — optimized

const CART_KEY = 'athar_cart';
const PRODUCTS_URL = 'data/products.json';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = total; });
}

function addToCart(product) {
  let cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
  updateCartCount();
  return cart;
}

async function fetchProducts() {
  try {
    const res = await fetch(PRODUCTS_URL + '?t=' + Date.now());
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function renderProductCard(p) {
  const discountBadge = p.discount ? `<span class="discount-badge">خصم ${p.discount}%</span>` : '';
  const oldPrice = p.oldPrice ? `<span class="old">${p.oldPrice} ج.م</span>` : '';
  return `<article class="product-card" data-product-id="${p.id}">
    <div class="product-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async" width="400" height="500" />
      ${discountBadge}
      <button class="wishlist-btn" aria-label="المفضلة">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
    <div class="product-info">
      <h3 class="product-name">${p.name}</h3>
      <div class="product-price">
        <span class="current">${p.price} ج.م</span>
        ${oldPrice}
      </div>
      <button class="add-to-cart">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 6h15l-1.5 9h-12z"></path>
          <circle cx="9" cy="20" r="1"></circle>
          <circle cx="18" cy="20" r="1"></circle>
        </svg>
      </button>
    </div>
  </article>`;
}

async function renderDynamicProducts() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;
  const products = await fetchProducts();
  if (products.length === 0) return;
  grid.innerHTML = products.map(renderProductCard).join('');
  bindProductButtons();
}

function bindProductButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    if (!card.dataset.linkBound) {
      card.dataset.linkBound = '1';
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart') || e.target.closest('.wishlist-btn')) return;
        const name = card.querySelector('.product-name')?.textContent?.trim() || 'منتج';
        const priceText = card.querySelector('.product-price .current')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
      const id = card.dataset.productId || name.replace(/\s+/g, '-') + '-' + price;
      window.location.href = 'product.html?id=' + encodeURIComponent(id);
      });
    }
    const btn = card.querySelector('.add-to-cart');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = card.querySelector('.product-name')?.textContent?.trim() || 'منتج';
      const priceText = card.querySelector('.product-price .current')?.textContent || '0';
      const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
      const image = card.querySelector('.product-img-wrap img')?.src || '';
      const productId = card.dataset.productId || name.replace(/\s+/g, '-') + '-' + price;
      addToCart({ id: productId, productId, name, price, image });
      btn.style.background = '#c9a86c';
      btn.style.color = '#111';
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => { btn.style.background = ''; btn.style.color = ''; btn.style.transform = ''; }, 500);
    });
  });
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const svg = btn.querySelector('svg');
      if (svg.getAttribute('fill') === 'currentColor') {
        svg.setAttribute('fill', 'none');
        btn.style.color = '';
      } else {
        svg.setAttribute('fill', 'currentColor');
        btn.style.color = '#e11';
      }
    });
  });
}

async function applySiteSettings() {
  try {
    const res = await fetch('data/settings.json?t=' + Date.now());
    if (!res.ok) return;
    const s = await res.json();
    if (!s) return;
    document.querySelectorAll('.logo-text').forEach(el => { if (s.storeName) el.textContent = s.storeName; });
    document.querySelectorAll('.logo-sub').forEach(el => { if (s.tagline) el.textContent = s.tagline; });
    document.querySelectorAll('.logo-mark').forEach(el => { if (s.storeName) el.textContent = s.storeName.charAt(0); });
    const badge = document.querySelector('.hero-badge');
    if (badge && s.heroBadge) badge.textContent = s.heroBadge;
    const title = document.querySelector('.hero-title');
    if (title && (s.heroTitle || s.heroTitleGold)) {
      title.innerHTML = (s.heroTitle || '') + '<br /><span class="gold">' + (s.heroTitleGold || '') + '</span>';
    }
    const desc = document.querySelector('.hero-desc');
    if (desc && s.heroDesc) desc.textContent = s.heroDesc;
    const heroImg = document.querySelector('.hero-img');
    if (heroImg && s.heroImage) heroImg.src = s.heroImage;
    const heroBtn = document.querySelector('.hero-content .btn-gold');
    if (heroBtn && s.heroButton) {
      const svg = heroBtn.querySelector('svg');
      heroBtn.innerHTML = s.heroButton + (svg ? svg.outerHTML : '');
    }
    const prodTitle = document.querySelector('#products .section-title');
    if (prodTitle && s.productsTitle) prodTitle.textContent = s.productsTitle;
    const aboutTitle = document.querySelector('#about .section-title, #about h2');
    if (aboutTitle && s.aboutTitle) aboutTitle.textContent = s.aboutTitle;
    const aboutText = document.querySelector('#about p, .about-text');
    if (aboutText && s.aboutText) aboutText.textContent = s.aboutText;
    const footer = document.querySelector('.footer-bottom p, .footer-copy');
    if (footer && s.footerText) footer.textContent = s.footerText;
    if (s.storeName) {
      const ar = s.storeNameAr ? ' | ' + s.storeNameAr : '';
      document.title = s.storeName + ar + ' — ' + (s.tagline || "Men's Fashion");
    }
  } catch (e) {}
}

function trackVisit() {
  try {
    if (sessionStorage.getItem('athar_visited')) return;
    sessionStorage.setItem('athar_visited', '1');
    var opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'visit' }) };
    fetch('/api/update-data', opts).catch(function(){});
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  applySiteSettings();
  if (window.requestIdleCallback) requestIdleCallback(function(){ trackVisit(); }, { timeout: 3000 });
  else setTimeout(trackVisit, 1500);

  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  if (localStorage.getItem('athar-theme') === 'dark') html.setAttribute('data-theme', 'dark');
  themeToggle?.addEventListener('click', () => {
    if (html.getAttribute('data-theme') === 'dark') {
      html.removeAttribute('data-theme');
      localStorage.setItem('athar-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('athar-theme', 'dark');
    }
  });

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  menuToggle?.addEventListener('click', () => mobileMenu?.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  updateCartCount();
  renderDynamicProducts().then(() => bindProductButtons());

  document.querySelectorAll('.cart-btn').forEach(btn => {
    if (btn.tagName === 'BUTTON') {
      btn.addEventListener('click', () => { window.location.href = 'cart.html'; });
    }
  });
});
