(() => {
  'use strict';

  // Resolve every image from the folder containing app.js. This works on
  // GitHub project Pages URLs (username.github.io/repository/) as well as root Pages.
  const runningScript = document.currentScript;
  const appRoot = new URL('.', runningScript?.src || new URL('./app.js', document.baseURI).href);
  const assetUrl = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return new URL(value.replace(/^\/+/, '').replace(/^\.\//, ''), appRoot).href;
  };

  const artworks = Array.isArray(window.ARTWORKS) ? window.ARTWORKS : [];
  const collections = Array.isArray(window.COLLECTIONS) ? window.COLLECTIONS : [];
  const $ = (id) => document.getElementById(id);
  const safeArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const safeStore = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
  };
  const safeSessionGet = (key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  };
  const safeSessionSet = (key, value) => {
    try { sessionStorage.setItem(key, value); } catch { /* session storage may be blocked */ }
  };
  const pendingArtworkId = new URLSearchParams(location.search).get('artwork');
  let saved = safeArray('nas-v3-saved').filter(id => artworks.some(a => a.id === id));
  let recent = safeArray('nas-v3-recent').filter(id => artworks.some(a => a.id === id));
  let activeCollection = 'all';
  let activeStyle = 'all';
  let searchTerm = '';
  let sortMode = 'featured';
  let viewMode = 'grid';
  let visibleLimit = 16;
  let viewerList = [];
  let viewerIndex = 0;
  let imageRetryCount = 0;

  const collectionFor = (id) => collections.find(c => c.id === id);
  const categoriesOf = (a) => Array.isArray(a?.categories) ? a.categories : [];
  const catsLabel = (a) => categoriesOf(a).map(c => collectionFor(c)?.name).filter(Boolean).slice(0, 2).join(' · ');
  const isSaved = (id) => saved.includes(id);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function filtered() {
    const list = artworks.filter(a => {
      const categories = categoriesOf(a);
      const collectionMatch = activeCollection === 'all' || categories.includes(activeCollection);
      const styleMatch = activeStyle === 'all' || categories.some(c => (collectionFor(c) || {}).mood === activeStyle);
      const haystack = [a.title, a.description, a.medium, catsLabel(a)].join(' ').toLowerCase();
      return collectionMatch && styleMatch && (!searchTerm || haystack.includes(searchTerm));
    });
    if (sortMode === 'az') list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    if (sortMode === 'za') list.sort((a, b) => String(b.title).localeCompare(String(a.title)));
    return list;
  }

  function imageTag(path, fullPath, alt, className = '') {
    const src = assetUrl(path);
    const fallback = assetUrl(fullPath);
    return `<img src="${escapeHtml(src)}" data-fallback-src="${escapeHtml(fallback)}" alt="${escapeHtml(alt)}" class="${className}" loading="lazy" decoding="async">`;
  }

  // If a thumbnail is missing, retry the full-size copy once. If the full-size
  // asset also fails, show an explicit placeholder rather than a blank tile.
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const fallback = img.dataset.fallbackSrc;
    if (fallback && !img.dataset.fallbackTried && img.src !== fallback) {
      img.dataset.fallbackTried = 'yes';
      img.src = fallback;
      return;
    }
    img.classList.add('image-load-failed');
    img.alt = img.alt ? `${img.alt} — image unavailable` : 'Artwork image unavailable';
    const host = img.closest('.art-image, .collection-card, .hero-frame, .viewer-stage');
    if (host) host.classList.add('image-unavailable');
  }, true);

  function card(a) {
    const firstCategory = categoriesOf(a)[0];
    const categoryName = collectionFor(firstCategory)?.name || 'Artwork';
    return `<article class="art-card" data-id="${escapeHtml(a.id)}">
      <div class="art-actions"><button class="icon-btn ${isSaved(a.id) ? 'saved' : ''}" data-action="save" data-id="${escapeHtml(a.id)}" aria-label="${isSaved(a.id) ? 'Remove from' : 'Save'} favorites">${isSaved(a.id) ? '♥' : '♡'}</button></div>
      <button class="art-image" data-action="open" data-id="${escapeHtml(a.id)}" aria-label="Open ${escapeHtml(a.title)}">
        ${imageTag(a.thumb, a.full, a.title)}<span class="art-tag">${escapeHtml(categoryName)}</span>
      </button>
      <div class="art-info"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.medium)} · ${escapeHtml(catsLabel(a))}</p></div>
    </article>`;
  }

  function renderCollections() {
    const element = $('collectionGrid');
    if (!element) return;
    element.innerHTML = collections.map(collection => {
      const matching = artworks.filter(a => categoriesOf(a).includes(collection.id));
      const cover = matching[0];
      return `<button class="collection-card" data-collection="${escapeHtml(collection.id)}" aria-label="Open ${escapeHtml(collection.name)} collection">
        ${cover ? imageTag(cover.thumb, cover.full, '') : ''}
        <span class="collection-copy"><small>${String(matching.length).padStart(2, '0')} ARTWORKS <span class="collection-count">↗</span></small><h3>${escapeHtml(collection.name)}</h3><p>${escapeHtml(collection.tagline)}</p></span>
      </button>`;
    }).join('');
    const select = $('collectionFilter');
    if (select) select.innerHTML = '<option value="all">All collections</option>' + collections.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
  }

  function renderGallery() {
    const grid = $('artGrid');
    if (!grid) return;
    const list = filtered();
    grid.classList.toggle('list-mode', viewMode === 'list');
    grid.innerHTML = list.slice(0, visibleLimit).map(card).join('');
    if ($('resultCount')) $('resultCount').textContent = `Showing ${Math.min(list.length, visibleLimit)} of ${list.length} artworks`;
    if ($('emptyState')) $('emptyState').hidden = list.length !== 0;
    if ($('loadMore')) {
      $('loadMore').hidden = list.length <= visibleLimit;
      $('loadMore').textContent = list.length > visibleLimit ? `Load more artworks (${list.length - visibleLimit} left) ↓` : 'All artworks loaded';
    }
  }

  function renderSaved() {
    const grid = $('savedGrid');
    if (!grid) return;
    const list = saved.map(id => artworks.find(a => a.id === id)).filter(Boolean);
    grid.innerHTML = list.map(card).join('');
    if ($('savedEmpty')) $('savedEmpty').hidden = list.length > 0;
  }

  function renderRecent() {
    const grid = $('recentGrid');
    if (!grid) return;
    const list = recent.map(id => artworks.find(a => a.id === id)).filter(Boolean);
    grid.innerHTML = list.map(card).join('');
    if ($('recentEmpty')) $('recentEmpty').hidden = list.length > 0;
  }

  function renderStats() {
    if ($('artCount')) $('artCount').textContent = String(artworks.length).padStart(2, '0');
    if ($('collectionCount')) $('collectionCount').textContent = String(collections.length).padStart(2, '0');
  }

  function openViewer(id) {
    viewerList = filtered();
    viewerIndex = viewerList.findIndex(a => a.id === id);
    if (viewerIndex < 0) {
      viewerList = artworks;
      viewerIndex = viewerList.findIndex(a => a.id === id);
    }
    if (viewerIndex >= 0) showViewer();
  }

  function showViewer() {
    const artwork = viewerList[viewerIndex];
    if (!artwork) return;
    const viewerImage = $('viewerImage');
    viewerImage.dataset.fallbackSrc = assetUrl(artwork.thumb);
    viewerImage.dataset.fallbackTried = '';
    viewerImage.classList.remove('image-load-failed');
    viewerImage.src = assetUrl(artwork.full);
    viewerImage.alt = artwork.title;
    $('viewerTitle').textContent = artwork.title;
    $('viewerDescription').textContent = artwork.description || '';
    $('viewerMedium').textContent = artwork.medium || '';
    $('viewerCollection').textContent = catsLabel(artwork).toUpperCase();
    $('viewerCounter').textContent = `${String(viewerIndex + 1).padStart(2, '0')} / ${String(viewerList.length).padStart(2, '0')}`;
    $('viewerSave').textContent = isSaved(artwork.id) ? '♥ Saved' : '♡ Save artwork';
    $('viewerSave').dataset.id = artwork.id;
    $('viewer').classList.add('open');
    $('viewer').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('viewerStage').classList.remove('zoomed', 'image-unavailable');
    $('zoomButton').textContent = 'Zoom +';
    recent = [artwork.id, ...recent.filter(id => id !== artwork.id)].slice(0, 12);
    safeStore('nas-v3-recent', recent);
    renderRecent();
  }

  function closeViewer() {
    $('viewer').classList.remove('open');
    $('viewer').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    $('viewerStage').classList.remove('zoomed');
  }

  function moveViewer(direction) {
    if (!viewerList.length) return;
    viewerIndex = (viewerIndex + direction + viewerList.length) % viewerList.length;
    showViewer();
  }

  function toggleSave(id) {
    if (!id) return;
    saved = saved.includes(id) ? saved.filter(value => value !== id) : [id, ...saved];
    safeStore('nas-v3-saved', saved);
    renderGallery();
    renderSaved();
    const current = viewerList[viewerIndex];
    if (current && current.id === id) $('viewerSave').textContent = isSaved(id) ? '♥ Saved' : '♡ Save artwork';
  }

  function setCollection(id) {
    activeCollection = collections.some(c => c.id === id) ? id : 'all';
    activeStyle = 'all'; searchTerm = ''; visibleLimit = 16;
    $('searchInput').value = '';
    $('collectionFilter').value = activeCollection;
    document.querySelectorAll('.chip').forEach(button => button.classList.toggle('active', button.dataset.style === 'all'));
    $('galleryHeading').innerHTML = activeCollection === 'all' ? 'All <em>artworks.</em>' : `${escapeHtml(collectionFor(activeCollection)?.name || 'Collection')}.`;
    $('galleryIntro').textContent = activeCollection === 'all' ? 'Search, filter and discover something new.' : (collectionFor(activeCollection)?.description || 'Explore the collection.');
    renderGallery();
    $('all-artworks').scrollIntoView({ behavior: 'smooth' });
  }

  function resetFilters() {
    activeCollection = 'all'; activeStyle = 'all'; searchTerm = ''; sortMode = 'featured'; visibleLimit = 16;
    $('searchInput').value = ''; $('collectionFilter').value = 'all'; $('sortSelect').value = 'featured';
    document.querySelectorAll('.chip').forEach(button => button.classList.toggle('active', button.dataset.style === 'all'));
    $('galleryHeading').innerHTML = 'All <em>artworks.</em>';
    $('galleryIntro').textContent = 'Search, filter and discover something new.';
    renderGallery();
  }

  function randomArtwork() {
    const list = filtered().length ? filtered() : artworks;
    if (list.length) openViewer(list[Math.floor(Math.random() * list.length)].id);
  }

  async function shareArtwork() {
    const artwork = viewerList[viewerIndex];
    if (!artwork) return;
    const url = `${location.origin}${location.pathname}?artwork=${encodeURIComponent(artwork.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: artwork.title, text: artwork.description || 'View this artwork', url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement('textarea');
        field.value = url; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field); field.select(); document.execCommand('copy'); field.remove();
      }
      $('viewerShare').textContent = '✓ Copied';
      setTimeout(() => { if ($('viewerShare')) $('viewerShare').textContent = '↗ Share'; }, 1500);
    } catch { /* user cancelled share or clipboard permission was denied */ }
  }

  function showLoadProblem() {
    const target = $('artGrid');
    if (!target) return;
    target.innerHTML = '<p class="empty-state">The gallery data did not load. Check that index.html, data.js, collections.js, app.js and the assets folder are all in the repository root.</p>';
    $('resultCount').textContent = 'Gallery unavailable';
  }

  // If data.js or collections.js was not deployed, stop with a visible message.
  if (!artworks.length || !collections.length) {
    showLoadProblem();
    return;
  }

  // Age reminder is intentionally not described as age verification.
  if (safeSessionGet('nas-v3-adult') === 'yes') $('ageGate').classList.add('hidden');
  $('enterSite').addEventListener('click', () => {
    safeSessionSet('nas-v3-adult', 'yes');
    $('ageGate').classList.add('hidden');
    if (pendingArtworkId) openViewer(pendingArtworkId);
  });
  $('leaveSite').addEventListener('click', () => { location.href = 'https://github.com/'; });

  renderCollections(); renderStats(); renderGallery(); renderSaved(); renderRecent();
  const hero = artworks.find(a => categoriesOf(a).includes('classical')) || artworks[0];
  if (hero) {
    const heroImage = $('heroImage');
    heroImage.dataset.fallbackSrc = assetUrl(hero.thumb);
    heroImage.dataset.fallbackTried = '';
    heroImage.src = assetUrl(hero.full);
    heroImage.alt = hero.title;
    heroImage.fetchPriority = 'high';
    $('heroTitle').textContent = hero.title;
  }
  if (pendingArtworkId && safeSessionGet('nas-v3-adult') === 'yes') openViewer(pendingArtworkId);

  $('collectionGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-collection]');
    if (button) setCollection(button.dataset.collection);
  });
  document.querySelectorAll('[data-quick]').forEach(button => button.addEventListener('click', () => setCollection(button.dataset.quick)));
  ['artGrid', 'savedGrid', 'recentGrid'].forEach(id => $(id).addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'save') toggleSave(button.dataset.id);
    if (button.dataset.action === 'open') openViewer(button.dataset.id);
  }));
  $('searchInput').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); visibleLimit = 16; renderGallery(); });
  $('collectionFilter').addEventListener('change', event => setCollection(event.target.value));
  $('sortSelect').addEventListener('change', event => { sortMode = event.target.value; renderGallery(); });
  document.querySelectorAll('.chip').forEach(button => button.addEventListener('click', () => {
    activeStyle = button.dataset.style;
    document.querySelectorAll('.chip').forEach(item => item.classList.toggle('active', item === button));
    visibleLimit = 16; renderGallery();
  }));
  $('clearFilters').addEventListener('click', resetFilters);
  $('loadMore').addEventListener('click', () => { visibleLimit += 16; renderGallery(); });
  $('gridView').addEventListener('click', () => { viewMode = 'grid'; $('gridView').classList.add('active'); $('listView').classList.remove('active'); renderGallery(); });
  $('listView').addEventListener('click', () => { viewMode = 'list'; $('listView').classList.add('active'); $('gridView').classList.remove('active'); renderGallery(); });
  $('surpriseBtn').addEventListener('click', randomArtwork);
  $('focusSearch').addEventListener('click', () => { $('all-artworks').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('searchInput').focus(), 400); });
  $('viewerClose').addEventListener('click', closeViewer);
  $('viewerPrev').addEventListener('click', () => moveViewer(-1));
  $('viewerNext').addEventListener('click', () => moveViewer(1));
  $('viewerSave').addEventListener('click', event => toggleSave(event.currentTarget.dataset.id));
  $('viewerShare').addEventListener('click', shareArtwork);
  $('viewer').addEventListener('click', event => { if (event.target === $('viewer')) closeViewer(); });
  $('zoomButton').addEventListener('click', () => {
    const stage = $('viewerStage'); stage.classList.toggle('zoomed');
    $('zoomButton').textContent = stage.classList.contains('zoomed') ? 'Zoom −' : 'Zoom +';
  });
  $('menuToggle').addEventListener('click', () => {
    const isOpen = $('mainNav').classList.toggle('show');
    $('menuToggle').setAttribute('aria-expanded', String(isOpen));
  });
  $('mainNav').querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    $('mainNav').classList.remove('show'); $('menuToggle').setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeViewer();
    if ($('viewer').classList.contains('open')) {
      if (event.key === 'ArrowRight') moveViewer(1);
      if (event.key === 'ArrowLeft') moveViewer(-1);
    }
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault(); $('searchInput').focus();
    }
  });
  let touchStartX = 0;
  $('viewerStage').addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  $('viewerStage').addEventListener('touchend', event => {
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 65) moveViewer(delta < 0 ? 1 : -1);
  }, { passive: true });
})();
