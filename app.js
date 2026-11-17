const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const state = { events: [], filtered: [], category: "Toutes", period: null, limit: 9, view: "overview", map: null, markers: null };

const categories = ["Toutes", ...new Set([])];
const periodFor = year => year < 500 ? "Temps anciens" : year < 1500 ? "Moyen Âge" : year < 1900 ? "Époque moderne" : "Époque contemporaine";
const formatYear = year => {
  if (year <= -1000000) return `${(Math.abs(year)/1000000).toLocaleString("fr-FR",{maximumFractionDigits:1})} M av.`;
  if (year < 0) return `${Math.abs(year).toLocaleString("fr-FR")} av. J.-C.`;
  return String(year);
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const showToast = msg => { const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2400); };

async function init(){
  try {
    const response = await fetch("./data/events.json");
    if(!response.ok) throw new Error("Impossible de charger data/events.json");
    state.events = await response.json();
    state.filtered = [...state.events];
    renderStats(); renderCategoryNav(); renderFilters(); renderEvents();
    bindUI();
    if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  } catch(err) {
    $("#eventList").innerHTML = `<div class="panel-card">Erreur de chargement de la base : ${esc(err.message)}. Ouvre l'application via un serveur local ou GitHub Pages, pas en fichier direct.</div>`;
  }
}
function renderStats(){
  $("#totalEvents").textContent=state.events.length.toLocaleString("fr-FR");
  $("#totalCategories").textContent=new Set(state.events.map(e=>e.category)).size;
  $("#totalRegions").textContent=new Set(state.events.map(e=>e.region)).size;
  $("#totalSources").textContent=state.events.reduce((n,e)=>n+(e.sources?.length||0),0);
}
function renderCategoryNav(){
  const cats=[...new Set(state.events.map(e=>e.category))].sort((a,b)=>a.localeCompare(b,"fr"));
  $("#categoryNav").innerHTML=cats.map(c=>`<button class="cat-link" data-category="${esc(c)}">${esc(c)}</button>`).join("");
  $$(".cat-link").forEach(b=>b.addEventListener("click",()=>setCategory(b.dataset.category)));
}
function renderFilters(){
  const cats=["Toutes",...new Set(state.events.map(e=>e.category))];
  $("#filterChips").innerHTML=cats.map(c=>`<button class="filter-chip ${c===state.category?"active":""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>setCategory(b.dataset.filter)));
}
function setCategory(category){
  state.category=category; state.period=null; $("#searchInput").value="";
  renderFilters(); applyFilters();
}
function applyFilters(){
  const q=$("#searchInput").value.trim().toLocaleLowerCase("fr");
  state.filtered=state.events.filter(e=>{
    const categoryOk=state.category==="Toutes"||e.category===state.category;
    const periodOk=!state.period||(
      state.period==="ancient"&&e.year<500 ||
      state.period==="middle"&&e.year>=500&&e.year<1500 ||
      state.period==="modern"&&e.year>=1500&&e.year<1900 ||
      state.period==="contemporary"&&e.year>=1900
    );
    const text=[e.title,e.date,e.country,e.region,e.category,e.summary,e.impact].join(" ").toLocaleLowerCase("fr");
    return categoryOk&&periodOk&&text.includes(q);
  });
  const sort=$("#sortSelect").value;
  state.filtered.sort((a,b)=>sort==="newest"?b.year-a.year:sort==="title"?a.title.localeCompare(b.title,"fr"):a.year-b.year);
  state.limit=9; renderEvents();
}
function renderEvents(){
  $("#resultCount").textContent=`${state.filtered.length} résultat${state.filtered.length>1?"s":""}`;
  const visible=state.filtered.slice(0,state.limit);
  $("#eventList").innerHTML=visible.length?visible.map(e=>`
    <article class="event-card" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="Voir ${esc(e.title)}">
      <div class="event-year"><strong>${esc(formatYear(e.year))}</strong><small>${esc(periodFor(e.year))}</small></div>
      <div class="event-info"><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p><div class="event-meta"><span class="tag">${esc(e.category)}</span><span class="event-place">⌖ ${esc(e.country)}</span></div></div>
      <div class="event-arrow">›</div>
    </article>`).join(""):`<div class="panel-card">Aucun événement ne correspond à ces critères. Essaie une autre recherche.</div>`;
  $$(".event-card").forEach(card=>{
    const open=()=>openEvent(card.dataset.id);
    card.addEventListener("click",open); card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  });
  $("#loadMore").classList.toggle("hidden",state.limit>=state.filtered.length);
  $("#loadMore").textContent=`Afficher davantage (${Math.max(0,state.filtered.length-state.limit)} restants) ↓`;
}
function openEvent(id){
  const e=state.events.find(x=>x.id===id); if(!e)return;
  $("#modalKicker").textContent=`FICHE HISTORIQUE · ${e.category.toUpperCase()}`;
  $("#modalTitle").textContent=e.title; $("#modalDate").textContent=e.date;
  $("#modalTags").innerHTML=`<span class="tag">${esc(e.category)}</span><span class="tag">${esc(e.region)}</span>`;
  $("#modalSummary").textContent=e.summary; $("#modalImpact").textContent=e.impact;
  $("#modalDeaths").textContent=e.deathsLabel||"Donnée non disponible";
  $("#modalConfidence").textContent=e.confidence||"Niveau de certitude non renseigné.";
  $("#modalLocation").textContent=`${e.country} · ${e.region}`;
  $("#modalSources").innerHTML=(e.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(s.name)}</a>`).join("")||"<span>Aucune source référencée.</span>";
  $("#eventModal").classList.remove("hidden"); document.body.style.overflow="hidden";
}
function closeModal(){ $("#eventModal").classList.add("hidden"); document.body.style.overflow=""; }
function setView(view){
  state.view=view;
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("#crumb").textContent=({overview:"VUE GÉNÉRALE",timeline:"CHRONOLOGIE",map:"CARTE MONDIALE",statistics:"STATISTIQUES"})[view]||"VUE GÉNÉRALE";
  $(".content-grid").classList.toggle("hidden",view==="map"||view==="statistics");
  $(".toolbar").classList.toggle("hidden",view==="map"||view==="statistics");
  $("#mapSection").classList.toggle("hidden",view!=="map");
  $("#statisticsSection").classList.toggle("hidden",view!=="statistics");
  if(view==="timeline"){ $("#listTitle").textContent="Chronologie complète"; $(".content-grid").classList.remove("hidden"); $(".toolbar").classList.remove("hidden"); }
  if(view==="overview") $("#listTitle").textContent="Événements marquants";
  if(view==="map") setTimeout(renderMap,100);
  if(view==="statistics") renderCharts();
  $("#sidebar").classList.remove("open");
}
function renderMap(){
  if(!window.L){ $("#worldMap").innerHTML="<div class='panel-card'>La carte nécessite une connexion Internet pour charger Leaflet et les tuiles cartographiques.</div>";return; }
  if(!state.map){
    state.map=L.map("worldMap",{worldCopyJump:true}).setView([22,8],2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:8}).addTo(state.map);
    state.markers=L.layerGroup().addTo(state.map);
  }
  state.map.invalidateSize(); state.markers.clearLayers();
  state.events.filter(e=>Number.isFinite(e.lat)&&Number.isFinite(e.lng)).forEach(e=>{
    const marker=L.circleMarker([e.lat,e.lng],{radius:6,color:"#f0a0a0",weight:1,fillColor:"#df4e59",fillOpacity:.85}).addTo(state.markers);
    marker.bindPopup(`<b>${esc(e.title)}</b><br>${esc(e.date)}<br><small>${esc(e.country)}</small><br><a href="#" data-open="${esc(e.id)}">Ouvrir la fiche</a>`);
    marker.on("popupopen",()=>{const a=document.querySelector(`[data-open="${CSS.escape(e.id)}"]`);if(a)a.addEventListener("click",ev=>{ev.preventDefault();openEvent(e.id);});});
  });
}
function renderCharts(){
  const draw=(id,counts)=>{
    const max=Math.max(1,...counts.map(x=>x[1]));
    $(id).innerHTML=counts.map(([name,n])=>`<div class="bar-row"><label>${esc(name)}</label><div class="bar-track"><div class="bar-fill" style="width:${n/max*100}%"></div></div><strong>${n}</strong></div>`).join("");
  };
  const cat=Object.entries(state.events.reduce((a,e)=>(a[e.category]=(a[e.category]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
  const periods=["Temps anciens","Moyen Âge","Époque moderne","Époque contemporaine"].map(p=>[p,state.events.filter(e=>periodFor(e.year)===p).length]);
  draw("#categoryChart",cat); draw("#periodChart",periods);
}
function bindUI(){
  $("#searchInput").addEventListener("input",applyFilters);
  $("#sortSelect").addEventListener("change",applyFilters);
  $("#loadMore").addEventListener("click",()=>{state.limit+=9;renderEvents();});
  $("#resetFilters").addEventListener("click",()=>{state.category="Toutes";state.period=null;$("#searchInput").value="";$("#sortSelect").value="oldest";renderFilters();applyFilters();});
  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $$(".period-list button").forEach(b=>b.addEventListener("click",()=>{state.period=b.dataset.period;state.category="Toutes";renderFilters();setView("timeline");applyFilters();}));
  $("#closeModal").addEventListener("click",closeModal); $("#closeModalBottom").addEventListener("click",closeModal);
  $("#eventModal").addEventListener("click",e=>{if(e.target.id==="eventModal")closeModal();});
  $("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#aboutBtn").addEventListener("click",()=>showToast("WORLD TRAGEDIES · Prototype éditorial évolutif — consulte les sources de chaque fiche."));
  $("#featuredBtn").addEventListener("click",()=>{setView("timeline");});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus();}});
}
init();
