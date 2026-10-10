/* Nile Calligraphy catalogue interactions: search, filters, saved works, reveals and progress. */
(() => {
  const page = document.querySelector('.catalogue-page');
  if (!page) return;
  const cards = [...document.querySelectorAll('[data-artwork-card]')];
  const search = document.querySelector('#artwork-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const empty = document.querySelector('[data-empty-results]');
  let activeFilter = 'all';
  const categories = {
    'surah-ar-rahman': ['signature','portrait'], '99-names-of-allah': ['signature','portrait'],
    'words-of-faith': ['portrait'], 'elegant-verses': ['portrait'], 'quiet-devotion': ['portrait'], 'timeless-faith': ['portrait'],
    'divine-harmony': ['horizontal'], 'timeless-script': ['horizontal'], 'heritage-grace': ['horizontal'], 'golden-expression': ['horizontal'], 'enduring-beauty': ['horizontal'], 'legacy-in-script': ['horizontal'], 'golden-heritage': ['horizontal'], 'crafted-legacy': ['horizontal']
  };
  function applyFilters() {
    const term = (search?.value || '').trim().toLowerCase(); let visible = 0;
    cards.forEach(card => {
      const slug = card.getAttribute('href')?.slice(1) || '';
      const matchesText = !term || (card.dataset.title || '').includes(term) || card.innerText.toLowerCase().includes(term);
      const matchesFilter = activeFilter === 'all' || (categories[slug] || []).includes(activeFilter);
      const show = matchesText && matchesFilter;
      card.hidden = !show; if (show) visible++;
    });
    if (empty) empty.hidden = visible > 0;
  }
  search?.addEventListener('input', applyFilters);
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filters.forEach(item => { const selected = item === button; item.classList.toggle('is-active', selected); item.setAttribute('aria-pressed', String(selected)); });
    applyFilters();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) { event.preventDefault(); search?.focus(); }
    if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; applyFilters(); search.blur(); }
  });
  const progress = document.querySelector('[data-reading-progress]');
  let scheduled = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
    scheduled = false;
  }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); } }, {passive:true});
  updateProgress();
  const revealItems = [...document.querySelectorAll('.reveal-item')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:0.08, rootMargin:'0px 0px -35px 0px'});
    revealItems.forEach((item, i) => { item.style.transitionDelay = `${Math.min(i % 4, 3) * 55}ms`; observer.observe(item); });
  } else revealItems.forEach(item => item.classList.add('is-visible'));
  // The card's href is the source of truth: opening a work from the homepage or a preview
  // keeps the exact matching detail section in view, including on a direct page load.
  function focusHashTarget() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target?.matches('[data-artwork-detail]')) setTimeout(() => { target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); }, 80);
  }
  window.addEventListener('hashchange', focusHashTarget); window.addEventListener('load', focusHashTarget);
  // Saved works are a lightweight local shortlist. No account or backend is required.
  const storageKey = 'nile-calligraphy-saved-artworks-v1';
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!Array.isArray(saved)) saved = []; } catch (_) { saved = []; }
  function syncSaved() {
    document.querySelectorAll('[data-save-artwork]').forEach(button => {
      const active = saved.includes(button.dataset.saveArtwork); button.setAttribute('aria-pressed', String(active));
      button.innerHTML = active ? '<span aria-hidden="true">♡</span> Saved to your shortlist' : '<span aria-hidden="true">♡</span> Save for later';
    });
  }
  document.querySelectorAll('[data-save-artwork]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.saveArtwork; saved = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) { /* shortlist still updates for this visit */ }
    syncSaved();
  }));
  syncSaved();
  const year = document.querySelector('[data-current-year]'); if (year) year.textContent = new Date().getFullYear();
})();
