const fallbackProjects = [
  {
    title: 'Great Key Educational Consult',
    category: 'Education platform',
    description: 'A clearer digital front door for home tuition, vacation classes, and homeschooling services.',
    image: 'greatkey_screenshot.png',
    demoUrl: 'https://www.greatkeyeducationalconsult.org/'
  },
  {
    title: 'Alpha & Omega Publications',
    category: 'Publishing & print',
    description: 'A sharper service-led website for a Ghanaian printing and publishing company.',
    image: 'media/alpha-omega-screenshot.png',
    demoUrl: 'https://www.alphaandomegapublications.com/'
  },
  {
    title: 'Joseph Ekow Mensah Memorial',
    category: 'Digital memorial',
    description: 'A quiet, dignified digital space for memories, ceremony details, and family tributes.',
    image: 'media/joseph-ekow-mensah-screenshot.png',
    demoUrl: 'https://josephekowmensah.com/'
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  initPageEntry();
  initNavigation();
  initReveal();
  initContactForm();
  initCookieForm();
  updateFooterYear();
  await displayProjects();
  initGsapAnimations();
  initMotionEffects();
  refreshIcons();
  verifyReturnedPayment();
});

function initPageEntry() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    document.body.classList.add('is-loaded');
    return;
  }

  window.setTimeout(() => document.body.classList.add('is-loaded'), 80);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({ 'stroke-width': 1.8 });
  }
}

function initNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navPanel = document.querySelector('.nav-panel');
  const navLinks = [...document.querySelectorAll('.nav-panel a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];

  const setMenu = isOpen => {
    if (!menuToggle || !navPanel) return;
    navPanel.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    document.querySelector('.site-nav')?.classList.remove('is-hidden');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  });

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, { rootMargin: '-38% 0px -52% 0px', threshold: [0.05, 0.2, 0.5] });

  sections.forEach(section => observer.observe(section));
}

function initReveal() {
  const items = [...document.querySelectorAll('.reveal')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  if (window.gsap && window.ScrollTrigger) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
}

function initGsapAnimations() {
  const { gsap, ScrollTrigger } = window;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!gsap || !ScrollTrigger || reduceMotion) return false;

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('gsap-ready');
  window.__gsapEnhanced = true;

  const heroElements = [
    document.querySelector('.hero h1'),
    document.querySelector('.hero-bottom'),
    document.querySelector('.hero-portrait')
  ].filter(Boolean);

  gsap.set(heroElements, {
    autoAlpha: 0,
    y: 72,
    scale: 0.97,
    filter: 'blur(12px)',
    clipPath: 'inset(0 0 12% 0)'
  });

  const heroTimeline = gsap.timeline({
    delay: 0.42,
    defaults: { ease: 'power4.out' }
  });

  heroTimeline
    .from('.nav-brand, .nav-panel', {
      y: -28,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.08,
      clearProps: 'transform,opacity,visibility'
    }, 0)
    .to('.hero h1', {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.15
    }, 0.1)
    .to('.hero-bottom', {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      clipPath: 'inset(0 0 0% 0)',
      duration: 1,
      clearProps: 'opacity,visibility,transform,filter,clipPath'
    }, 0.3)
    .to('.hero-portrait', {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.2,
      clearProps: 'opacity,visibility,transform,filter,clipPath'
    }, 0.22)
    .set('.hero h1', { clearProps: 'opacity,visibility,transform,filter,clipPath' });

  const standardReveals = gsap.utils.toArray('.reveal').filter(element => (
    !heroElements.includes(element) &&
    !element.classList.contains('project-card') &&
    !element.classList.contains('service-row')
  ));

  standardReveals.forEach(element => {
    gsap.fromTo(element, {
      autoAlpha: 0,
      y: 64,
      scale: 0.985,
      filter: 'blur(10px)',
      clipPath: 'inset(0 0 10% 0)'
    }, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.05,
      ease: 'power4.out',
      clearProps: 'opacity,visibility,transform,filter,clipPath',
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true
      }
    });
  });

  const projectCards = gsap.utils.toArray('.project-card');
  gsap.set(projectCards, { autoAlpha: 0, y: 78, scale: 0.965, filter: 'blur(9px)' });
  ScrollTrigger.batch(projectCards, {
    start: 'top 90%',
    once: true,
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.05,
      stagger: 0.14,
      ease: 'power4.out',
      clearProps: 'opacity,visibility,transform,filter'
    })
  });

  const serviceRows = gsap.utils.toArray('.service-row');
  gsap.set(serviceRows, { autoAlpha: 0, x: -48 });
  ScrollTrigger.batch(serviceRows, {
    start: 'top 88%',
    once: true,
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1,
      x: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'opacity,visibility,transform'
    })
  });

  gsap.utils.toArray('[data-parallax]').forEach(image => {
    const trigger = image.closest('.project-media, .portrait-frame, .about-image-wrap') || image;
    gsap.fromTo(image, {
      '--parallax-y': '-20px'
    }, {
      '--parallax-y': '20px',
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  });

  gsap.to('.hero h1 em', {
    yPercent: 16,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) {
    document.fonts.ready.then(refresh);
  } else {
    window.setTimeout(refresh, 300);
  }

  return true;
}

function initMotionEffects() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const nav = document.querySelector('.site-nav');
  const progress = document.querySelector('.scroll-progress span');
  const parallaxItems = window.__gsapEnhanced ? [] : [...document.querySelectorAll('[data-parallax]')];
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  if (reduceMotion) return;

  function updateScrollEffects() {
    const scrollY = Math.max(window.scrollY, 0);
    const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    progress?.style.setProperty('transform', `scaleX(${Math.min(scrollY / scrollRange, 1)})`);

    if (nav) {
      nav.classList.toggle('is-scrolled', scrollY > 60);
      const scrollingDown = scrollY > lastScrollY + 5;
      const scrollingUp = scrollY < lastScrollY - 5;

      if (window.innerWidth > 820 && scrollingDown && scrollY > 180 && !document.body.classList.contains('menu-open')) {
        nav.classList.add('is-hidden');
      } else if (scrollingUp || scrollY < 180) {
        nav.classList.remove('is-hidden');
      }
    }

    parallaxItems.forEach(item => {
      const speed = Number(item.dataset.parallax || 0.03);
      const frame = item.parentElement?.getBoundingClientRect();
      if (!frame || frame.bottom < -100 || frame.top > window.innerHeight + 100) return;
      const distanceFromCenter = frame.top + frame.height / 2 - window.innerHeight / 2;
      const offset = Math.max(-34, Math.min(34, distanceFromCenter * speed));
      item.style.setProperty('--parallax-y', `${offset}px`);
    });

    lastScrollY = scrollY;
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScrollEffects();

  if (!finePointer) return;

  initCursorOrb();
  initMagneticControls();
  initProjectTilt();
}

function initCursorOrb() {
  const cursor = document.querySelector('.cursor-orb');
  if (!cursor) return;

  let targetX = -40;
  let targetY = -40;
  let currentX = -40;
  let currentY = -40;

  const animateCursor = () => {
    currentX += (targetX - currentX) * 0.2;
    currentY += (targetY - currentY) * 0.2;
    cursor.style.transform = `translate3d(${currentX - cursor.offsetWidth / 2}px, ${currentY - cursor.offsetHeight / 2}px, 0)`;
    window.requestAnimationFrame(animateCursor);
  };

  document.addEventListener('pointermove', event => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add('is-visible');
  }, { passive: true });

  document.addEventListener('pointerover', event => {
    if (event.target.closest('a, button, input, textarea, select, .project-media')) {
      cursor.classList.add('is-active');
    }
  });

  document.addEventListener('pointerout', event => {
    if (event.target.closest('a, button, input, textarea, select, .project-media')) {
      cursor.classList.remove('is-active');
    }
  });

  document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  animateCursor();
}

function initMagneticControls() {
  const controls = document.querySelectorAll('.button, .nav-cookie, .project-link, .back-to-top');

  controls.forEach(control => {
    control.addEventListener('pointermove', event => {
      const rect = control.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
      control.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    control.addEventListener('pointerleave', () => {
      control.style.transform = '';
    });
  });
}

function initProjectTilt() {
  document.querySelectorAll('.project-card').forEach(card => {
    const media = card.querySelector('.project-media');
    if (!media) return;

    card.addEventListener('pointermove', event => {
      const rect = media.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const relativeY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      media.style.setProperty('--tilt-y', `${(relativeX - 0.5) * 4}deg`);
      media.style.setProperty('--tilt-x', `${(0.5 - relativeY) * 4}deg`);
    });

    card.addEventListener('pointerleave', () => {
      media.style.setProperty('--tilt-x', '0deg');
      media.style.setProperty('--tilt-y', '0deg');
    });
  });
}

async function loadProjects() {
  try {
    const response = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Project API unavailable');
    const projects = await response.json();
    return Array.isArray(projects) && projects.length ? projects : fallbackProjects;
  } catch (error) {
    return fallbackProjects;
  }
}

async function displayProjects() {
  const projectGrid = document.querySelector('.project-grid');
  if (!projectGrid) return;

  const projects = await loadProjects();
  projectGrid.replaceChildren();

  projects.slice(0, 5).map(normalizeProject).forEach((project, index) => {
    projectGrid.appendChild(createProjectCard(project, index));
  });

  initProjectReveal(projectGrid);
  refreshIcons();
}

function normalizeProject(project) {
  return {
    title: String(project.title || 'Untitled project'),
    category: String(project.category || 'Digital experience'),
    description: String(project.description || ''),
    image: String(project.image || ''),
    demoUrl: String(project.demoUrl || ''),
    codeUrl: String(project.codeUrl || '')
  };
}

function createProjectCard(project, index) {
  const article = document.createElement('article');
  article.className = 'project-card reveal';

  const media = document.createElement('div');
  media.className = 'project-media';

  if (project.image) {
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = `${project.title} project preview`;
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.dataset.parallax = '0.025';
    media.appendChild(image);
  }



  const content = document.createElement('div');
  content.className = 'project-content';

  const title = document.createElement('h3');
  title.textContent = project.title;

  const description = document.createElement('p');
  description.textContent = project.description;

  const links = document.createElement('div');
  links.className = 'project-links';

  const primaryUrl = safeHref(project.demoUrl) || safeHref(project.codeUrl);
  if (primaryUrl) {
    links.appendChild(createProjectLink(
      primaryUrl,
      project.demoUrl ? 'View project' : 'View source',
      project.demoUrl ? 'arrow-up-right' : 'code-2'
    ));
  }

  content.append(title, description, links);
  article.append(media, content);
  return article;
}

function createProjectLink(href, label, iconName) {
  const link = document.createElement('a');
  link.href = href;
  link.className = 'project-link';
  link.setAttribute('aria-label', label);
  link.append(createIcon(iconName));

  const hiddenLabel = document.createElement('span');
  hiddenLabel.textContent = label;
  link.appendChild(hiddenLabel);

  if (!href.startsWith('#')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }

  return link;
}

function createIcon(name) {
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', name);
  return icon;
}

function safeHref(value) {
  if (!value) return '';
  if (value.startsWith('#')) return value;

  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

function initProjectReveal(container) {
  const cards = [...container.querySelectorAll('.project-card')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    cards.forEach(card => card.classList.add('is-visible'));
    return;
  }

  if (window.gsap && window.ScrollTrigger) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });

  cards.forEach(card => observer.observe(card));
}

function initCookieForm() {
  const form = document.getElementById('cookieForm');
  if (!form) return;

  const customAmount = document.getElementById('customAmount');
  const radioAmounts = [...form.querySelectorAll('input[name="cookieAmount"]')];
  const submitButton = form.querySelector('button[type="submit"]');

  customAmount?.addEventListener('input', () => {
    if (customAmount.value) radioAmounts.forEach(input => { input.checked = false; });
  });

  radioAmounts.forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked && customAmount) customAmount.value = '';
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const checkedAmount = form.querySelector('input[name="cookieAmount"]:checked');
    const amount = Number(customAmount?.value || checkedAmount?.value || 0);
    const emailInput = document.getElementById('donorEmail');
    const nameInput = document.getElementById('donorName');
    const email = String(emailInput?.value || '').trim();
    const name = String(nameInput?.value || '').trim();

    if (!Number.isFinite(amount) || amount < 5) {
      setCookieStatus('Choose an amount of at least GH₵5.', true);
      customAmount?.focus();
      return;
    }

    if (!emailInput?.validity.valid) {
      setCookieStatus('Enter a valid email for your Paystack receipt.', true);
      emailInput?.focus();
      return;
    }

    setCookieStatus('Preparing your secure Paystack checkout…');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, email, name })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || 'Checkout could not be started.');
      }

      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setCookieStatus(error.message || 'Checkout could not be started. Please try again.', true);
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function verifyReturnedPayment() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');
  const returningFromPayment = params.get('cookie') === 'verify' || Boolean(reference);
  if (!returningFromPayment || !reference) return;

  document.getElementById('cookie')?.scrollIntoView({ block: 'start' });
  setCookieStatus('Confirming your cookie with Paystack…');

  try {
    const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, {
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.paid) {
      throw new Error(data.error || 'Payment has not been confirmed yet.');
    }

    const formattedAmount = new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: data.currency || 'GHS'
    }).format(Number(data.amount || 0));

    setCookieStatus(`Cookie received — ${formattedAmount}. Thank you, genuinely.`);
    window.history.replaceState({}, document.title, `${window.location.pathname}#cookie`);
  } catch (error) {
    setCookieStatus(error.message || 'I could not confirm that payment yet. Please check your receipt.', true);
  }
}

function setCookieStatus(message, isError = false) {
  const status = document.querySelector('.cookie-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');

  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      projectType: String(formData.get('projectType') || '').trim(),
      timeline: String(formData.get('timeline') || '').trim(),
      message: String(formData.get('message') || '').trim()
    };

    if (payload.name.length < 2) {
      setStatus('Please add your name.', true);
      form.elements.name.focus();
      return;
    }

    if (!form.elements.email.validity.valid) {
      setStatus('Please add a valid email.', true);
      form.elements.email.focus();
      return;
    }

    if (payload.message.length < 20) {
      setStatus('Give me a little more context—at least 20 characters.', true);
      form.elements.message.focus();
      return;
    }

    setStatus('Sending your inquiry…');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Your inquiry could not be sent.');

      form.reset();
      setStatus(data.message || 'Received. I will be in touch soon.');
    } catch (error) {
      setStatus(error.message || 'Something went wrong. Email me directly instead.', true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function updateFooterYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}
