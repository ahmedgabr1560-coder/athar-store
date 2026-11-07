// ATHAR Store — Interactions

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Check saved theme
  const savedTheme = localStorage.getItem('athar-theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  }

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem('athar-theme', next === 'dark' ? 'dark' : 'light');
  });

  // Mobile Menu
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  menuToggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('active');
  });

  // Close mobile menu on link click
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
    });
  });

  // Header scroll effect
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Cart counter demo
  let cartCount = 0;
  const cartCountEl = document.querySelector('.cart-count');
  const addButtons = document.querySelectorAll('.add-to-cart');

  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount++;
      if (cartCountEl) {
        cartCountEl.textContent = cartCount;
        cartCountEl.style.transform = 'scale(1.3)';
        setTimeout(() => {
          cartCountEl.style.transform = 'scale(1)';
        }, 200);
      }
      // Visual feedback
      btn.style.background = '#c9a86c';
      btn.style.color = '#111';
      setTimeout(() => {
        btn.style.background = '';
        btn.style.color = '';
      }, 600);
    });
  });

  // Wishlist toggle
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
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

  // Smooth active nav
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
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
