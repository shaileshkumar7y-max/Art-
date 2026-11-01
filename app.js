(() => {
'use strict';
const artworks=window.ARTWORKS||[], collections=window.COLLECTIONS||[];
const $=id=>document.getElementById(id);
const storage={get(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const pendingArtworkId=new URLSearchParams(location.search).get('artwork');
let saved=storage.get('nas-v3-saved'), recent=storage.get('nas-v3-recent'), activeCollection='all', activeStyle='all', searchTerm='', sortMode='featured', viewMode='grid', visibleLimit=16, viewerList=[], viewerIndex=0;
const collectionFor=id=>collections.find(c=>c.id===id);
const catsLabel=a=>(a.categories||[]).map(c=>collectionFor(c)?.name).filter(Boolean).slice(0,2).join(' · ');
const isSaved=id=>saved.includes(id);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function filtered(){let list=artworks.filter(a=>{
 const collectionMatch=activeCollection==='all'||a.categories.includes(activeCollection);
 const styleMatch=activeStyle==='all'||a.categories.some(c=>(collectionFor(c)||{}).mood===activeStyle);
 const hay=(a.title+' '+a.description+' '+a.medium+' '+catsLabel(a)).toLowerCase();
 return collectionMatch&&styleMatch&&(!searchTerm||hay.includes(searchTerm));
});
 if(sortMode==='az')list.sort((a,b)=>a.title.localeCompare(b.title));
 if(sortMode==='za')list.sort((a,b)=>b.title.localeCompare(a.title));
 return list;
}
function card(a){return `<article class="art-card" data-id="${a.id}"><div class="art-actions"><button class="icon-btn ${isSaved(a.id)?'saved':''}" data-action="save" data-id="${a.id}" aria-label="${isSaved(a.id)?'Remove from':'Save'} favorites">${isSaved(a.id)?'♥':'♡'}</button></div><button class="art-image" data-action="open" data-id="${a.id}" aria-label="Open ${escapeHtml(a.title)}"><img src="${a.thumb}" alt="${escapeHtml(a.title)}" width="680" height="900" loading="lazy" decoding="async"><span class="art-tag">${escapeHtml((collectionFor(a.categories[0])||{}).name||'Artwork')}</span></button><div class="art-info"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.medium)} · ${escapeHtml(catsLabel(a))}</p></div></article>`;}
function renderCollections(){const el=$('collectionGrid');el.innerHTML=collections.map(c=>{const arts=artworks.filter(a=>a.categories.includes(c.id));const cover=arts[0];return `<button class="collection-card" data-collection="${c.id}">${cover?`<img src="${cover.thumb}" alt="" loading="lazy" width="680" height="900">`:''}<span class="collection-copy"><small>${String(arts.length).padStart(2,'0')} ARTWORKS <span class="collection-count">↗</span></small><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.tagline)}</p></span></button>`}).join('');
 const select=$('collectionFilter');select.innerHTML='<option value="all">All collections</option>'+collections.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}
function renderGallery(){const list=filtered(), grid=$('artGrid');grid.classList.toggle('list-mode',viewMode==='list');grid.innerHTML=list.slice(0,visibleLimit).map(card).join('');$('resultCount').textContent=`Showing ${Math.min(list.length,visibleLimit)} of ${list.length} artworks`;$('emptyState').hidden=list.length!==0;$('loadMore').hidden=list.length<=visibleLimit;$('loadMore').textContent=list.length>visibleLimit?`Load more artworks (${list.length-visibleLimit} left) ↓`:'All artworks loaded';}
function renderSaved(){const list=saved.map(id=>artworks.find(a=>a.id===id)).filter(Boolean);$('savedGrid').innerHTML=list.map(card).join('');$('savedEmpty').hidden=list.length>0;}
function renderRecent(){const list=recent.map(id=>artworks.find(a=>a.id===id)).filter(Boolean);$('recentGrid').innerHTML=list.map(card).join('');$('recentEmpty').hidden=list.length>0;}
function renderStats(){$('artCount').textContent=String(artworks.length).padStart(2,'0');$('collectionCount').textContent=String(collections.length).padStart(2,'0');}
function openViewer(id){viewerList=filtered();viewerIndex=viewerList.findIndex(a=>a.id===id);if(viewerIndex<0){viewerList=artworks;viewerIndex=viewerList.findIndex(a=>a.id===id)}showViewer();}
function showViewer(){const a=viewerList[viewerIndex];if(!a)return;$('viewerImage').src=a.full;$('viewerImage').alt=a.title;$('viewerTitle').textContent=a.title;$('viewerDescription').textContent=a.description;$('viewerMedium').textContent=a.medium;$('viewerCollection').textContent=catsLabel(a).toUpperCase();$('viewerCounter').textContent=`${String(viewerIndex+1).padStart(2,'0')} / ${String(viewerList.length).padStart(2,'0')}`;$('viewerSave').textContent=isSaved(a.id)?'♥ Saved':'♡ Save artwork';$('viewerSave').dataset.id=a.id;$('viewer').classList.add('open');$('viewer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('viewerStage')?.classList.remove('zoomed');recent=[a.id,...recent.filter(x=>x!==a.id)].slice(0,12);storage.set('nas-v3-recent',recent);renderRecent();}
function closeViewer(){$('viewer').classList.remove('open');$('viewer').setAttribute('aria-hidden','true');document.body.style.overflow='';$('viewerStage')?.classList.remove('zoomed');}
function moveViewer(dir){viewerIndex=(viewerIndex+dir+viewerList.length)%viewerList.length;showViewer();}
function toggleSave(id){if(saved.includes(id))saved=saved.filter(x=>x!==id);else saved=[id,...saved];storage.set('nas-v3-saved',saved);renderGallery();renderSaved();const current=viewerList[viewerIndex];if(current&&current.id===id)$('viewerSave').textContent=isSaved(id)?'♥ Saved':'♡ Save artwork';}
function setCollection(id){activeCollection=id;activeStyle='all';searchTerm='';visibleLimit=16;$('searchInput').value='';$('collectionFilter').value=id;document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.style==='all'));$('galleryHeading').innerHTML=id==='all'?'All <em>artworks.</em>':`${escapeHtml(collectionFor(id)?.name||'Collection')}.`;$('galleryIntro').textContent=id==='all'?'Search, filter and discover something new.':(collectionFor(id)?.description||'Explore the collection.');renderGallery();$('all-artworks').scrollIntoView({behavior:'smooth'});}
function resetFilters(){activeCollection='all';activeStyle='all';searchTerm='';sortMode='featured';visibleLimit=16;$('searchInput').value='';$('collectionFilter').value='all';$('sortSelect').value='featured';document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.style==='all'));$('galleryHeading').innerHTML='All <em>artworks.</em>';$('galleryIntro').textContent='Search, filter and discover something new.';renderGallery();}
function randomArtwork(){const list=filtered().length?filtered():artworks;const item=list[Math.floor(Math.random()*list.length)];if(item)openViewer(item.id);}
async function shareArtwork(){const a=viewerList[viewerIndex];if(!a)return;const url=location.origin+location.pathname+'?artwork='+encodeURIComponent(a.id);try{if(navigator.share)await navigator.share({title:a.title,text:a.description,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);$('viewerShare').textContent='✓ Copied';setTimeout(()=>$('viewerShare').textContent='↗ Share',1500)}}catch(e){/* share cancelled */}}
// Age reminder; this is not legal age verification.
if(sessionStorage.getItem('nas-v3-adult')==='yes')$('ageGate').classList.add('hidden');
$('enterSite').addEventListener('click',()=>{sessionStorage.setItem('nas-v3-adult','yes');$('ageGate').classList.add('hidden');if(pendingArtworkId)openViewer(pendingArtworkId)});
$('leaveSite').addEventListener('click',()=>{location.href='https://github.com/'});
renderCollections();renderStats();renderGallery();renderSaved();renderRecent();
if(pendingArtworkId&&sessionStorage.getItem('nas-v3-adult')==='yes')openViewer(pendingArtworkId);
const hero=artworks.find(a=>a.categories.includes('classical'))||artworks[0];if(hero){$('heroImage').src=hero.full;$('heroTitle').textContent=hero.title}
$('collectionGrid').addEventListener('click',e=>{const b=e.target.closest('[data-collection]');if(b)setCollection(b.dataset.collection)});
document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>setCollection(b.dataset.quick)));
$('artGrid').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='save')toggleSave(b.dataset.id);if(b.dataset.action==='open')openViewer(b.dataset.id)});
$('savedGrid').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='save')toggleSave(b.dataset.id);if(b.dataset.action==='open')openViewer(b.dataset.id)});
$('recentGrid').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='save')toggleSave(b.dataset.id);if(b.dataset.action==='open')openViewer(b.dataset.id)});
$('searchInput').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();visibleLimit=16;renderGallery()});
$('collectionFilter').addEventListener('change',e=>setCollection(e.target.value));
$('sortSelect').addEventListener('change',e=>{sortMode=e.target.value;renderGallery()});
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{activeStyle=b.dataset.style;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x===b));visibleLimit=16;renderGallery()}));
$('clearFilters').addEventListener('click',resetFilters);$('loadMore').addEventListener('click',()=>{visibleLimit+=16;renderGallery()});
$('gridView').addEventListener('click',()=>{viewMode='grid';$('gridView').classList.add('active');$('listView').classList.remove('active');renderGallery()});$('listView').addEventListener('click',()=>{viewMode='list';$('listView').classList.add('active');$('gridView').classList.remove('active');renderGallery()});
$('surpriseBtn').addEventListener('click',randomArtwork);$('focusSearch').addEventListener('click',()=>{$('all-artworks').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('searchInput').focus(),400)});
$('viewerClose').addEventListener('click',closeViewer);$('viewerPrev').addEventListener('click',()=>moveViewer(-1));$('viewerNext').addEventListener('click',()=>moveViewer(1));$('viewerSave').addEventListener('click',e=>toggleSave(e.currentTarget.dataset.id));$('viewerShare').addEventListener('click',shareArtwork);
$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))closeViewer()});$('zoomButton').addEventListener('click',()=>{const stage=$('viewerStage');stage.classList.toggle('zoomed');$('zoomButton').textContent=stage.classList.contains('zoomed')?'Zoom −':'Zoom +'});
$('menuToggle').addEventListener('click',()=>{const n=$('mainNav').classList.toggle('show');$('menuToggle').setAttribute('aria-expanded',String(n))});$('mainNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('mainNav').classList.remove('show');$('menuToggle').setAttribute('aria-expanded','false')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();if($('viewer').classList.contains('open')){if(e.key==='ArrowRight')moveViewer(1);if(e.key==='ArrowLeft')moveViewer(-1)}if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('searchInput').focus()}});
let sx=0; $('viewerStage').addEventListener('touchstart',e=>{sx=e.changedTouches[0].screenX},{passive:true});$('viewerStage').addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>65)moveViewer(dx<0?1:-1)},{passive:true});
})();