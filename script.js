// ATHAR Store — Interactions + Cart + Dynamic Products

const CART_KEY = 'athar_cart';
const PRODUCTS_KEY = 'athar_admin_products';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function getAdminProducts() {
  try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || []; } catch { return []; }
}
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
function renderDynamicProducts() {
  const products = getAdminProducts();
  const grid = document.querySelector('.products-grid');
  if (!grid || products.length === 0) return;
  grid.innerHTML = products.map(p => {
    const discountBadge = p.discount ? `<span class="discount-badge">خصم ${p.discount}%</span>` : '';
    const oldPrice = p.oldPrice ? `<span class="old">${p.oldPrice} ج.م</span>` : '';
    return `<article class="product-card">
      <div class="product-img-wrap"><img src="${p.image}" alt="${p.name}" />${discountBadge}
        <button class="wishlist-btn" aria-label="المفضلة"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
      </div>
      <div class="product-info"><h3 class="product-name">${p.name}</h3>
        <div class="product-price"><span class="current">${p.price} ج.م</span>${oldPrice}</div>
        <button class="add-to-cart"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"></path><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg></button>
      </div></article>`;
  }).join('');
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
        const id = name.replace(/\s+/g, '-') + '-' + price;
        window.location.href = 'product.html?id=' + encodeURIComponent(id);
      });
    }
    const btn = card.querySelector('.add-to-cart');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const name = card.querySelector('.product-name')?.textContent?.trim() || 'منتج';
      const priceText = card.querySelector('.product-price .current')?.textContent || '0';
      const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
      const image = card.querySelector('.product-img-wrap img')?.src || '';
      const id = name.replace(/\s+/g, '-') + '-' + price;
      addToCart({ id, name, price, image });
      btn.style.background = '#c9a86c'; btn.style.color = '#111'; btn.style.transform = 'scale(1.15)';
      setTimeout(() => { btn.style.background = ''; btn.style.color = ''; btn.style.transform = ''; }, 500);
    });
  });
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const svg = btn.querySelector('svg');
      if (svg.getAttribute('fill') === 'currentColor') { svg.setAttribute('fill', 'none'); btn.style.color = ''; }
      else { svg.setAttribute('fill', 'currentColor'); btn.style.color = '#e11'; }
    });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('athar-theme');
  if (savedTheme === 'dark') html.setAttribute('data-theme', 'dark');
  themeToggle?.addEventListener('click', () => {
    if (html.getAttribute('data-theme') === 'dark') { html.removeAttribute('data-theme'); localStorage.setItem('athar-theme', 'light'); }
    else { html.setAttribute('data-theme', 'dark'); localStorage.setItem('athar-theme', 'dark'); }
  });
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  menuToggle?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mobileMenu.classList.remove('open')));
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => { header?.classList.toggle('scrolled', window.scrollY > 40); });
  updateCartCount();
  renderDynamicProducts();
  bindProductButtons();
  document.querySelectorAll('.cart-btn').forEach(btn => {
    if (btn.tagName === 'BUTTON') btn.addEventListener('click', () => { window.location.href = 'cart.html'; });
  });
  if (document.getElementById('home')) {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => { if (scrollY >= section.offsetTop - 120) current = section.getAttribute('id'); });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}` || link.getAttribute('href') === `index.html#${current}`) link.classList.add('active');
      });
    });
  }
});
