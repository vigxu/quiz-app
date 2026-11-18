// Run everything after the page has loaded
document.addEventListener('DOMContentLoaded', () => {

  // Tell the CSS that JavaScript is running (enables scroll animations)
  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Useful elements (each one is optional)
  const navbar = document.getElementById('navbar');
  const progress = document.getElementById('progress');
  const hero = document.getElementById('home');
  const heroTitle = document.querySelector('.hero-title');
  const statement = document.querySelector('[data-scroll-text]');

  // ---------- 1. Split the About statement into words ----------
  let words = [];
  if (statement) {
    const pieces = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words = pieces.map((piece) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = piece + ' ';
      statement.appendChild(span);
      return span;
    });
    if (reduceMotion) {
      words.forEach((w) => (w.style.opacity = '1'));
    }
  }

  // ---------- 2. Mobile menu ----------
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.getElementById('nav-links');

  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- 3. Highlight the menu link for the section on screen ----------
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  if (navLinks.length > 0 && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ---------- 4. Staggered entrance: children appear one after another ----------
  document.querySelectorAll('.stagger').forEach((group) => {
    [...group.children].forEach((child, index) => {
      child.classList.add('reveal');
      child.style.transitionDelay = `${index * 110}ms`;
    });
  });

  // Fade and slide elements in when they scroll into view
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  // ---------- 5. Count-up numbers ----------
  function countUp(el) {
    const target = Number(el.dataset.target);
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    el.textContent = '0';
    const start = performance.now();
    const duration = 1400;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // slows down at the end
      el.textContent = Math.round(target * eased);
      if (t < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  const counters = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => countObserver.observe(el));
  }

  // ---------- 6. Scroll effects (progress bar, navbar, parallax, word highlight) ----------
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function onScroll() {
    const y = window.scrollY;
    const viewH = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - viewH;

    // Progress bar at the top of the page
    if (progress) {
      progress.style.transform = `scaleX(${maxScroll > 0 ? y / maxScroll : 0})`;
    }

    // Navbar gets a stronger background after scrolling a little
    if (navbar) {
      navbar.classList.toggle('scrolled', y > 10);
    }

    // Hero title drifts up and fades as you scroll away (parallax)
    if (heroTitle && !reduceMotion && y < viewH) {
      heroTitle.style.transform = `translateY(${y * 0.25}px)`;
      heroTitle.style.opacity = String(clamp(1 - y / (viewH * 0.7), 0, 1));
    }

    // About statement: each word lights up as the section moves up the screen
    if (statement && words.length && !reduceMotion) {
      const rect = statement.getBoundingClientRect();
      const p = clamp((viewH * 0.9 - rect.top) / (viewH * 0.6), 0, 1);
      words.forEach((word, i) => {
        const amount = clamp(p * words.length - i, 0, 1);
        word.style.opacity = String(0.2 + 0.8 * amount);
      });
    }
  }

  // Run the scroll code at most once per frame (keeps it smooth)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', onScroll);
  onScroll();

  // ---------- 7. Hero light follows the mouse (desktop only) ----------
  if (hero && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--x', `${event.clientX - rect.left}px`);
      hero.style.setProperty('--y', `${event.clientY - rect.top}px`);
    });
  }

  // ---------- 8. Contact form check (nothing is sent anywhere) ----------
  const form = document.getElementById('contact-form');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const status = document.getElementById('form-status');
      const fields = form.querySelectorAll('input, textarea');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let allValid = true;

      fields.forEach((field) => {
        const value = field.value.trim();
        const isValid = value !== '' && (field.type !== 'email' || emailPattern.test(value));
        field.classList.toggle('invalid', !isValid);
        if (!isValid) {
          allValid = false;
        }
      });

      if (!allValid) {
        status.textContent = 'Please fill every field with a valid email address.';
        return;
      }

      status.textContent = 'Thanks! Your message looks good. (This demo form does not send messages yet.)';
      form.reset();
    });
  }

  // ---------- 9. Footer year ----------
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
