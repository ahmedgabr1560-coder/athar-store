// ATHAR Store — Interactions + Cart

const CART_KEY = 'athar_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = total;
  });
}

function addToCart(product) {
  let cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
  return cart;
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  const savedTheme = localStorage.getItem('athar-theme');
  if (savedTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    if (current === 'dark') {
      html.removeAttribute('data-theme');
      localStorage.setItem('athar-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('athar-theme', 'dark');
    }
  });

  // Mobile Menu
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  menuToggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
    });
  });

  // Header scroll
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Update cart count on load
  updateCartCount();

  // Add to cart buttons on product cards
  document.querySelectorAll('.product-card').forEach(card => {
    const btn = card.querySelector('.add-to-cart');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const name = card.querySelector('.product-name')?.textContent?.trim() || 'منتج';
      const priceText = card.querySelector('.product-price .current')?.textContent || '0';
      const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
      const image = card.querySelector('.product-img-wrap img')?.src || '';
      const id = name.replace(/\s+/g, '-') + '-' + price;

      addToCart({ id, name, price, image });

      // Visual feedback
      btn.style.background = '#c9a86c';
      btn.style.color = '#111';
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.transform = '';
      }, 500);
    });
  });

  // Wishlist toggle
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
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

  // Make cart icon link to cart page
  document.querySelectorAll('.cart-btn').forEach(btn => {
    if (btn.tagName === 'BUTTON') {
      btn.addEventListener('click', () => {
        window.location.href = 'cart.html';
      });
    }
  });

  // Smooth active nav (only on index)
  if (document.getElementById('home')) {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const top = section.offsetTop - 120;
        if (scrollY >= top) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}` || link.getAttribute('href') === `index.html#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }
});
