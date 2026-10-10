/* Homepage interactions: slow-count statistics, reveal timing, signature carousel, mobile navigation. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile navigation is intentionally lightweight; search/cart remain phase-two features.
  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('#primary-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    }));
  }

  // Reveal sections only when they enter the viewport, with a calm stagger.
  const revealSections = [...document.querySelectorAll('.reveal-section')];
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealSections.forEach(section => revealObserver.observe(section));
  } else {
    revealSections.forEach(section => section.classList.add('is-visible'));
  }

  // Count up over 2.8 seconds rather than jumping immediately when scrolled into view.
  const counters = [...document.querySelectorAll('[data-count]')];
  const animateCounter = el => {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    const duration = 2800;
    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(target * easeOut(progress));
      el.textContent = value.toLocaleString() + (progress === 1 ? suffix : '');
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.65 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  // Signature collection: deliberately a two-card horizontal gallery, not a fake store cart.
  const track = document.querySelector('.signature-track');
  const prev = document.querySelector('[data-signature-prev]');
  const next = document.querySelector('[data-signature-next]');
  const current = document.querySelector('[data-signature-current]');
  const cards = track ? [...track.querySelectorAll('.signature-card')] : [];
  const updateCurrent = () => {
    if (!track || !cards.length || !current) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(cardCenter - center);
      if (d < distance) { distance = d; closest = index; }
    });
    current.textContent = String(closest + 1).padStart(2, '0');
  };
  const moveCard = direction => {
    if (!track || !cards.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let index = cards.findIndex(card => card.offsetLeft + card.offsetWidth / 2 >= center);
    if (index < 0) index = cards.length - 1;
    const nextIndex = Math.max(0, Math.min(cards.length - 1, index + direction));
    cards[nextIndex].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  };
  prev?.addEventListener('click', () => moveCard(-1));
  next?.addEventListener('click', () => moveCard(1));
  track?.addEventListener('scroll', () => requestAnimationFrame(updateCurrent), { passive: true });
  window.addEventListener('resize', updateCurrent, { passive: true });
  updateCurrent();

  // Footer year is kept current without changing any other footer content.
  const copyright = document.querySelector('.copyright');
  if (copyright) copyright.textContent = copyright.textContent.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`);
})();
