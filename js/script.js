/* Nile Calligraphy homepage interactions — progressive enhancement */
(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.add('js-motion');

  // Current year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header shadow
  const header = document.querySelector('.top-header');
  const updateHeader = () => header?.classList.toggle('header-shadow', window.scrollY > 40);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Mobile navigation: toggle the real navigation instead of showing a placeholder alert.
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  const closeMenu = () => {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('nav-open');
  };
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('nav-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  // Search panel: routes to the relevant existing page/section, without requiring a backend.
  const searchToggle = document.querySelector('.search-toggle');
  const searchForm = document.getElementById('site-search');
  const searchInput = document.getElementById('site-search-input');
  const searchFeedback = document.querySelector('.search-feedback');
  const searchClose = document.querySelector('.search-close');
  const setSearchOpen = open => {
    if (!searchForm || !searchToggle) return;
    searchForm.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchInput?.focus();
  };
  searchToggle?.addEventListener('click', () => setSearchOpen(searchForm?.hidden ?? true));
  searchClose?.addEventListener('click', () => setSearchOpen(false));
  searchForm?.addEventListener('submit', event => {
    event.preventDefault();
    const query = (searchInput?.value || '').trim().toLowerCase();
    if (!query) { if (searchFeedback) searchFeedback.textContent = 'Enter a topic to search.'; return; }
    const routes = [
      { terms: ['painting', 'artwork', 'collection', 'signature', 'original'], url: 'pages/original-paintings.html' },
      { terms: ['exhibition', 'event', 'showcase'], url: 'pages/exhibitions.html' },
      { terms: ['blog', 'story', 'meaning', 'wabi'], url: 'pages/blogs.html' },
      { terms: ['review', 'client', 'experience'], url: 'pages/reviews.html' },
      { terms: ['about', 'mission', 'afaq', 'community'], url: 'pages/about.html' },
      { terms: ['contact', 'commission', 'custom', 'order', 'price'], url: 'pages/contact.html' },
      { terms: ['faq', 'question', 'delivery'], url: 'pages/FAQ.html' }
    ];
    const match = routes.find(route => route.terms.some(term => query.includes(term)));
    if (match) window.location.href = match.url;
    else if (searchFeedback) searchFeedback.textContent = 'Try “paintings”, “exhibitions”, “about”, “reviews” or “contact”.';
  });

  // Smooth in-page navigation only for real targets.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  // Reveal cards/sections as they enter view. Content remains visible if observers are unsupported.
  const revealTargets = document.querySelectorAll('.section-header, .gallery-card, .signature-card, .about-container, .stats > div, .ordering, .exhibition-preview-inner, .story-card, .contact');
  revealTargets.forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    element.setAttribute('data-reveal-delay', String(index % 4));
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  }

  // Signature collection carousel: arrow controls, drag-to-scroll, keyboard scrolling and progress.
  const signatureRow = document.getElementById('signature-row');
  const showcase = document.querySelector('[data-carousel="signature"]');
  const progress = showcase?.querySelector('.carousel-progress span');
  const updateProgress = () => {
    if (!signatureRow || !progress) return;
    const max = signatureRow.scrollWidth - signatureRow.clientWidth;
    const ratio = max <= 0 ? 1 : signatureRow.scrollLeft / max;
    progress.style.width = `${Math.max(18, Math.min(100, (signatureRow.clientWidth / signatureRow.scrollWidth) * 100))}%`;
    progress.style.transform = `translateX(${ratio * Math.max(0, 100 - (signatureRow.clientWidth / signatureRow.scrollWidth) * 100)}%)`;
  };
  const moveCarousel = direction => {
    if (!signatureRow) return;
    const card = signatureRow.querySelector('.signature-card');
    const step = card ? card.getBoundingClientRect().width + 32 : signatureRow.clientWidth * 0.8;
    signatureRow.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  document.querySelector('[data-carousel-prev="signature"]')?.addEventListener('click', () => moveCarousel(-1));
  document.querySelector('[data-carousel-next="signature"]')?.addEventListener('click', () => moveCarousel(1));
  signatureRow?.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (signatureRow) {
    let pointerDown = false, startX = 0, startScroll = 0, dragged = false;
    signatureRow.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || event.target.closest('a, button')) return;
      pointerDown = true; dragged = false; startX = event.clientX; startScroll = signatureRow.scrollLeft;
      signatureRow.classList.add('is-dragging');
      signatureRow.setPointerCapture?.(event.pointerId);
    });
    signatureRow.addEventListener('pointermove', event => {
      if (!pointerDown) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 5) dragged = true;
      if (dragged) signatureRow.scrollLeft = startScroll - delta;
    });
    const stopDragging = () => { pointerDown = false; signatureRow.classList.remove('is-dragging'); };
    signatureRow.addEventListener('pointerup', stopDragging);
    signatureRow.addEventListener('pointercancel', stopDragging);
    signatureRow.addEventListener('lostpointercapture', stopDragging);
  }

  // Subtle pointer tilt on larger screens only. Never hijack touch interactions.
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt], .signature-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 2.2}deg) rotateX(${-y * 2.2}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Counter animation is handled by homepage-premium.js to prevent duplicate animations.

  window.addEventListener('load', () => body.classList.add('loaded'), { once: true });
})();
