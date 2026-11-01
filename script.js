(() => {
  'use strict';
  const artwork = [
    {title:"At the Sculptor’s Studio",file:"sculptors-studio-study.webp",plate:"PLATE 01 · SEPIA SERIES",description:"A multi-panel study plate exploring posture, silhouette and the relationship between a figure and its surrounding space.",tags:["Classical","Duet","Sepia"],category:["classical","pair"]},
    {title:"Quiet Lines, Living Form",file:"vintage-sepia-figure-study.webp",plate:"PLATE 02 · SEPIA SERIES",description:"A collection of pose and portrait sketches, brought together as a study of gesture, balance and expression.",tags:["Figure study","Sepia","Gesture"],category:["female","classical"]},
    {title:"The Study of Two Forms",file:"graphite-couple-study.webp",plate:"PLATE 03 · GRAPHITE SERIES",description:"A paired figure study focused on proportion, stance and the visual rhythm created by two different silhouettes.",tags:["Duet study","Graphite","Proportion"],category:["pair","classical"]},
    {title:"Anatomy in Balance",file:"male-anatomy-study.webp",plate:"PLATE 04 · ANATOMY SERIES",description:"A reference sheet presenting standing poses, body proportions and supporting gesture sketches in a classical drawing style.",tags:["Anatomy","Proportion","Classical"],category:["male","anatomy","classical"]},
    {title:"The Life Drawing Room",file:"classical-life-drawing.webp",plate:"PLATE 05 · LIFE DRAWING",description:"An assortment of life-drawing poses that highlights weight distribution, gesture and the structure of the standing and seated figure.",tags:["Life drawing","Gesture","Classical"],category:["female","male","classical"]},
    {title:"A Renaissance Gesture",file:"renaissance-figure-study.webp",plate:"PLATE 06 · RENAISSANCE SERIES",description:"A Renaissance-inspired arrangement of figure studies, portrait sketches and pose references in a warm sepia palette.",tags:["Renaissance","Sepia","Gesture"],category:["female","male","pair","classical"]},
    {title:"Antique Proportions",file:"antique-sepia-study.webp",plate:"PLATE 07 · ANTIQUE SERIES",description:"A traditional-looking plate combining figure poses and portrait details to explore proportion and shape.",tags:["Antique","Proportion","Sepia"],category:["male","female","classical"]},
    {title:"The Classical Figure Collage",file:"classical-figure-collage.webp",plate:"PLATE 08 · CLASSICAL SERIES",description:"A central figure composition surrounded by smaller studies of pose, profile and movement.",tags:["Classical","Figure study","Sepia"],category:["female","classical"]},
    {title:"Portraits & Gesture",file:"vintage-graphite-study.webp",plate:"PLATE 09 · GRAPHITE SERIES",description:"A graphite-style study sheet bringing together portrait expressions, hands and figure poses.",tags:["Graphite","Portrait","Gesture"],category:["female","male","classical"]},
    {title:"Classical Male Figure Studies",file:"classical-male-study.webp",plate:"PLATE 10 · FIGURE STUDY",description:"A multi-view anatomy and figure sheet focused on proportion, pose and the construction of the human form.",tags:["Anatomy","Figure study","Sepia"],category:["male","anatomy","classical"]},
    {title:"Gesture in Graphite",file:"vintage-graphite-collage.webp",plate:"PLATE 11 · GRAPHITE SERIES",description:"A graphite-inspired archive plate with standing poses, portrait references and smaller gesture studies.",tags:["Graphite","Gesture","Portrait"],category:["female","male","classical"]},
    {title:"A Figure in Contour",file:"sepia-figure-collage.webp",plate:"PLATE 12 · CONTOUR SERIES",description:"A sepia study composition built around contour, silhouette and a collection of expressive figure poses.",tags:["Contour","Gesture","Sepia"],category:["female","classical"]}
  ];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const gate = $('#ageGate');
  const gateEnter = $('#enterGallery');
  const gateLeave = $('#leaveGallery');
  const grid = $('#artGrid');
  const search = $('#searchInput');
  const sort = $('#sortSelect');
  const resultLabel = $('#resultLabel');
  const clearFilters = $('#clearFilters');
  const emptyState = $('#emptyState');
  const viewer = $('#viewer');
  const viewerImage = $('#viewerImage');
  const viewerTitle = $('#viewerTitle');
  const viewerDescription = $('#viewerDescription');
  const viewerPlate = $('#viewerPlate');
  const viewerTags = $('#viewerTags');
  const viewerCounter = $('#viewerCounter');
  const viewerSave = $('#viewerSave');
  const toast = $('#toast');
  let activeFilter = 'all';
  let activeIndex = 0;
  let toastTimer;
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem('nas-saved-artworks') || '[]')); } catch { saved = new Set(); }

  if (sessionStorage.getItem('nas-adult-entry') === 'confirmed') gate.classList.add('is-hidden');
  gateEnter.addEventListener('click', () => {
    sessionStorage.setItem('nas-adult-entry', 'confirmed');
    gate.classList.add('is-hidden');
    $('#archive').setAttribute('tabindex','-1');
    $('#archive').focus({preventScroll:true});
  });
  gateLeave.addEventListener('click', () => {
    gate.innerHTML = '<div class="gate-panel"><h1>Thanks for visiting.</h1><p class="gate-description">You can close this page now.</p></div>';
  });

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }
  function persistSaved() {
    localStorage.setItem('nas-saved-artworks', JSON.stringify([...saved]));
    $('#savedCount').textContent = String(saved.size);
    $$('[data-save]').forEach(button => {
      const id = Number(button.dataset.save);
      const isSaved = saved.has(id);
      button.classList.toggle('is-saved', isSaved);
      button.textContent = isSaved ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(isSaved));
    });
    if (viewer.classList.contains('is-open')) updateViewerSave();
  }
  function toggleSaved(id) {
    if (saved.has(id)) { saved.delete(id); notify('Removed from your saved studies'); }
    else { saved.add(id); notify('Study saved to this device'); }
    persistSaved();
  }
  function updateViewerSave() {
    const isSaved = saved.has(activeIndex);
    viewerSave.textContent = isSaved ? '♥ Saved on this device' : '♡ Save this study';
    viewerSave.setAttribute('aria-pressed', String(isSaved));
  }
  function updateViewer() {
    const item = artwork[activeIndex];
    viewerImage.src = `assets/${item.file}`;
    viewerImage.alt = item.title + ' — fine-art figure study';
    viewerTitle.textContent = item.title;
    viewerDescription.textContent = item.description;
    viewerPlate.textContent = item.plate;
    viewerTags.replaceChildren(...item.tags.map(tag => { const el=document.createElement('span'); el.textContent=tag; return el; }));
    viewerCounter.textContent = `${String(activeIndex+1).padStart(2,'0')} / ${String(artwork.length).padStart(2,'0')}`;
    updateViewerSave();
  }
  function openViewer(index) {
    activeIndex = index;
    updateViewer();
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    $('#viewerClose').focus();
  }
  function closeViewer() {
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    viewerImage.src='';
  }
  function moveViewer(step) {
    activeIndex = (activeIndex + step + artwork.length) % artwork.length;
    updateViewer();
  }
  function sortCards() {
    const cards = $$('.art-card',grid);
    const mode = sort.value;
    cards.sort((a,b) => {
      if (mode==='az') return a.dataset.title.localeCompare(b.dataset.title);
      if (mode==='za') return b.dataset.title.localeCompare(a.dataset.title);
      return Number(a.querySelector('[data-art]').dataset.art)-Number(b.querySelector('[data-art]').dataset.art);
    });
    cards.forEach(card => grid.append(card));
  }
  function applyFilters() {
    const term = search.value.trim().toLowerCase();
    let visible = 0;
    $$('.art-card',grid).forEach(card => {
      const tags = card.dataset.tags.toLowerCase();
      const title = card.dataset.title.toLowerCase();
      const matchesFilter = activeFilter==='all' || activeFilter==='saved' || card.dataset.category.split(' ').includes(activeFilter);
      const matchesSearch = !term || title.includes(term) || tags.includes(term);
      const matchesSaved = activeFilter!=='saved' || saved.has(Number(card.querySelector('[data-art]').dataset.art));
      const show = matchesFilter && matchesSearch && matchesSaved;
      card.classList.toggle('is-hidden',!show);
      if (show) visible++;
    });
    resultLabel.textContent = `Showing ${visible} of ${artwork.length} ${visible===1?'study':'studies'}`;
    emptyState.hidden = visible!==0;
    clearFilters.classList.toggle('is-visible',activeFilter!=='all'||term.length>0);
  }
  function resetArchive() {
    activeFilter='all';
    search.value='';
    sort.value='curated';
    $$('.filter-chip').forEach(button=>button.classList.toggle('is-active',button.dataset.filter==='all'));
    sortCards();applyFilters();
  }

  $$('.art-trigger').forEach(button => button.addEventListener('click',()=>openViewer(Number(button.dataset.art))));
  $$('[data-save]').forEach(button => button.addEventListener('click',()=>toggleSaved(Number(button.dataset.save))));
  $$('.filter-chip').forEach(button => button.addEventListener('click',()=>{
    activeFilter=button.dataset.filter;
    $$('.filter-chip').forEach(item=>item.classList.toggle('is-active',item===button));
    applyFilters();
  }));
  search.addEventListener('input',applyFilters);
  sort.addEventListener('change',()=>{sortCards();applyFilters()});
  clearFilters.addEventListener('click',resetArchive);
  $('#emptyReset').addEventListener('click',resetArchive);
  $('#showSaved').addEventListener('click',()=>{
    activeFilter='saved';
    $$('.filter-chip').forEach(item=>item.classList.remove('is-active'));
    search.value='';applyFilters();$('#archive').scrollIntoView({behavior:'smooth'});
  });
  $('#viewerClose').addEventListener('click',closeViewer);
  $('#viewerPrev').addEventListener('click',()=>moveViewer(-1));
  $('#viewerNext').addEventListener('click',()=>moveViewer(1));
  viewerSave.addEventListener('click',()=>toggleSaved(activeIndex));
  viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer()});
  document.addEventListener('keydown',event=>{
    if (!viewer.classList.contains('is-open')) return;
    if (event.key==='Escape') closeViewer();
    if (event.key==='ArrowLeft') moveViewer(-1);
    if (event.key==='ArrowRight') moveViewer(1);
  });
  $('#menuButton').addEventListener('click',()=>{
    const nav=$('#mainNav');const open=nav.classList.toggle('is-open');
    $('#menuButton').setAttribute('aria-expanded',String(open));
  });
  $$('#mainNav a').forEach(link=>link.addEventListener('click',()=>{
    $('#mainNav').classList.remove('is-open');$('#menuButton').setAttribute('aria-expanded','false');
  }));
  $('#year').textContent=new Date().getFullYear();
  persistSaved();applyFilters();
})();
