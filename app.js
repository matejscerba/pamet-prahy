const localArticleLanguage = window.archiveCity?.lang === 'ca' ? 'es' : (window.archiveCity?.lang || 'cs');
const articleLanguageStorageKey = `journal-language-${new URLSearchParams(location.search).get('city') || 'prague'}`;
let articleLanguage = localArticleLanguage;
try { const saved = localStorage.getItem(articleLanguageStorageKey); if (saved === 'en' || saved === localArticleLanguage) articleLanguage = saved; } catch {}
let activeNewsArticleIndex = null;
let newsArticleTrigger = null;
const articleUIKeys = ['journal','archive','search','placeholder','read','close','articles','noResults','example','further','previous','next','back'];
function articleUI(key) {
  const i = articleUIKeys.indexOf(key);
  return (window.articleLocalization[articleLanguage] || window.articleLocalization.en).ui[i];
}
function localizedNewsArticle(article) {
  const copy = window.articleLocalization[articleLanguage]?.articles[article.key];
  const localized = copy ? {...article,category:copy[0],title:copy[1],summary:copy[2],paragraphs:copy.slice(3)} : {...article};
  if (articleLanguage === 'cs' && article.key === 'bridge') localized.sources = article.sources.map((source,index)=>({...source,title:['ČVUT · Debata o budoucnosti mostu, 19. června 2026','Správa železnic · Provizorní zpevnění, září 2026'][index]}));
  return localized;
}
function isJournalHash() { return !location.hash || ['#news','#journal'].includes(location.hash); }

const photoHistory = (slug, years, label) => years.map((year) => {
  const count = year.count;
  const photos = Array.from({ length: count }, (_, index) => ({
    src: `./public/images/places/${slug}/${year.value}/${String(index + 1).padStart(2, "0")}.${year.extension || "png"}`,
    alt: `${label}, ${year.value} · fotografie ${index + 1}`,
  }));
  return { month: `${year.value}-01`, year: String(year.value), date: String(year.value), photos };
});

const archiveCenter = window.archiveCity?.center || [50.0875, 14.4213];
const places = window.archiveCity ? (window.archiveCity.places || []) : [
  { id: "philharmonic", name: "Vltavská filharmonie", subtitle: "Holešovice · Praha 7", category: "Kultura", coordinates: [50.0998, 14.4384], description: "Nová koncertní síň na břehu Vltavy. Prohlédněte si fotografie místa v jednotlivých letech.", history: photoHistory("vltavska", [{ value: 2029, count: 3 }, { value: 2031, count: 3 }, { value: 2033, count: 4 }], "Vltavská filharmonie") },
  { id: "bubny", name: "Nádraží Bubny", subtitle: "Bubny · Praha 7", category: "Doprava", coordinates: [50.1082, 14.4385], description: "Proměna nádraží Bubny zachycená v různých letech.", history: photoHistory("nadrazi-bubny", [{ value: 2024, count: 3 }, { value: 2026, count: 1 }], "Nádraží Bubny") },
  { id: "jiriho-namesti", name: "Náměstí Jiřího z Poděbrad", subtitle: "Vinohrady · Praha 3", category: "Veřejný prostor", coordinates: [50.0773, 14.4505], description: "Fotografický záznam proměn náměstí Jiřího z Poděbrad.", history: photoHistory("namesti-jiriho-z-podebrad", [{ value: 2024, count: 3 }, { value: 2025, count: 3 }, { value: 2027, count: 3 }], "Náměstí Jiřího z Poděbrad") },
  { id: "pankrac-metro", name: "Metro D · Pankrác", subtitle: "Pankrác · Praha 4", category: "Doprava", coordinates: [50.0511, 14.4396], description: "Fotografie vývoje stanice a okolí Pankráce v čase.", history: photoHistory("pankrac-metro-d", [{ value: 2025, count: 3 }, { value: 2027, count: 4 }, { value: 2031, count: 3 }], "Metro D · Pankrác") },
  { id: "smichov", name: "Smíchovské nádraží", subtitle: "Smíchov · Praha 5", category: "Doprava", coordinates: [50.0613, 14.4087], description: "Proměny Smíchovského nádraží podle fotografií z jednotlivých let.", history: photoHistory("smichovske-nadrazi", [{ value: 2024, count: 3 }, { value: 2027, count: 3 }, { value: 2030, count: 3 }], "Smíchovské nádraží") },
  { id: "vaclavske-namesti", name: "Václavské náměstí", subtitle: "Nové Město · Praha 1", category: "Veřejný prostor", coordinates: [50.0814, 14.4275], description: "Fotografický přehled proměn Václavského náměstí.", history: photoHistory("vaslavske-namesti", [{ value: 2024, count: 4 }, { value: 2027, count: 4 }, { value: 2029, count: 4 }], "Václavské náměstí") },
  { id: "rail-bridge", name: "Železniční most", subtitle: "Výtoň · Praha 2", category: "Doprava", coordinates: [50.0677, 14.4141], description: "Fotografie železničního mostu a jeho okolí v různých letech.", history: photoHistory("zeleznicni-most", [{ value: 2026, count: 9, extension: "jpg" }, { value: 2029, count: 2 }, { value: 2030, count: 3 }, { value: 2032, count: 4 }], "Železniční most") },
];

const firstArchiveYear = window.archiveCity && places.length ? Math.min(2020, ...places.flatMap(place => place.history.map(event => Number(event.year)))) : 2020;
const monthStart = new Date(Date.UTC(firstArchiveYear, 0, 1));
const monthEnd = new Date(Date.UTC(2036, 11, 1));
const months = [];
for (let date = new Date(monthStart); date <= monthEnd; date.setUTCMonth(date.getUTCMonth() + 1)) months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);

const state = { month: window.archiveCity?.places?.[0]?.history[0]?.month || "2029-01", placeId: null, detailPlaceId: null, map: null, markers: new Map(), query: "" };
const $ = (selector) => document.querySelector(selector);
let monthScrollFrame = null;
let lightboxPhotos = [];
let lightboxPhotoIndex = 0;
let photoLoadQueue = [];
let activePhotoLoads = 0;
const photoLoads = new Map();
const photoUpdates = new WeakMap();

function preloadPhoto(src) {
  src = new URL(src, document.baseURI).href;
  if (photoLoads.has(src)) return photoLoads.get(src);
  const promise = new Promise((resolve) => {
    photoLoadQueue.push(() => {
      activePhotoLoads++;
      const image = new Image(); image.decoding = "async";
      const finish = (ready) => {
        activePhotoLoads--; resolve(ready); pumpPhotoQueue();
      };
      image.onload = () => image.decode().then(() => finish(true), () => finish(true));
      image.onerror = () => finish(false);
      image.src = src;
    });
    pumpPhotoQueue();
  });
  photoLoads.set(src, promise);
  return promise;
}
function pumpPhotoQueue() {
  while (activePhotoLoads < 4 && photoLoadQueue.length) photoLoadQueue.shift()();
}
function fadeInPhoto(image) {
  if (!image || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
}
function prepareImage(image) {
  const src = image.currentSrc || image.src;
  if (!src || image.dataset.preparedSrc === src) return;
  image.dataset.preparedSrc = src;
  image.classList.add("photo-pending");
  preloadPhoto(src).then(() => {
    if (image.isConnected && image.dataset.preparedSrc === src) {
      image.classList.remove("photo-pending"); image.classList.add("photo-ready"); fadeInPhoto(image);
    }
  });
}
async function updatePhoto(container, src, alt, showLoading = false) {
  const url = new URL(src, document.baseURI).href;
  const previous = photoUpdates.get(container);
  if (!showLoading && previous?.url === url) return;
  previous?.animation?.cancel();
  const loadingDuration = showLoading ? 800 + Math.random() * 600 : 0;
  const update = { url };
  photoUpdates.set(container, update);
  const current = [...container.querySelectorAll('img')].at(-1);
  const unchanged = current?.src === url;
  if (!showLoading && unchanged) {
    container.classList.remove('is-photo-loading');
    container.setAttribute('aria-busy', 'false');
    container.querySelector('.tile-photo-loading')?.remove();
    current.alt = alt;
    prepareImage(current);
    return;
  }
  if (showLoading) {
    let loader = container.querySelector('.tile-photo-loading');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'tile-photo-loading';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-label', 'Sourcing photograph');
      loader.innerHTML = '<span class="tile-loading-label" aria-hidden="true">Sourcing photograph</span><span class="inline-loading-progress" aria-hidden="true"><span class="inline-progress-fill"></span></span>';
      container.append(loader);
    }
    container.classList.add('is-photo-loading');
    container.setAttribute('aria-busy', 'true');
    update.animation = startInlinePhotoLoading(container, loadingDuration);
  }
  const [loaded] = await Promise.all([
    preloadPhoto(url),
    new Promise(resolve => window.setTimeout(resolve, loadingDuration)),
  ]);
  update.animation?.cancel();
  if (photoUpdates.get(container) !== update || !container.isConnected) return;
  if (loaded && !unchanged) {
    const incoming = new Image();
    incoming.src = url;
    incoming.alt = alt;
    incoming.dataset.preparedSrc = url;
    incoming.classList.add('photo-ready');
    try { await incoming.decode(); } catch { /* Keep the loaded image if decoding is unavailable. */ }
    if (photoUpdates.get(container) !== update || !container.isConnected) return;
    const outgoing = [...container.querySelectorAll('img')];
    container.prepend(incoming);
    outgoing.forEach(image => image.remove());
  } else if (current) {
    current.alt = alt;
  }
  container.classList.remove('is-photo-loading');
  container.setAttribute('aria-busy', 'false');
  container.querySelector('.tile-photo-loading')?.remove();
  fadeInPhoto(container.querySelector('img'));
}

function prepareImages(root = document) {
  if (root.matches?.("img")) prepareImage(root);
  root.querySelectorAll?.("img").forEach(prepareImage);
}
function preloadAllPhotos() {
  const sources = [...new Set(places.flatMap((place) => place.history.flatMap((event) => event.photos.map((photo) => photo.src))))];
  sources.forEach(preloadPhoto);
}

function icon(name) {
  const icons = {
    left: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5"/></svg>',
    right: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5.5 5.5-5.5 5.5"/></svg>',
    close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>',
    locate: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3"/></svg>',
  };
  return icons[name];
}
function monthDate(key) { const [year, month] = key.split("-").map(Number); return new Date(Date.UTC(year, month - 1, 1)); }
function fullMonth(key) { const d = monthDate(key); return new Intl.DateTimeFormat(articleLanguage, { month: "long", year: "numeric", timeZone: "UTC" }).format(d); }
function monthIndex(key) { return months.indexOf(key); }
function selectedPlace() { return places.find((place) => place.id === state.placeId) || null; }
function detailPlace() { return places.find((place) => place.id === state.detailPlaceId) || null; }
function eventsForMonth(place, month) { return place.history.find((event) => event.month === month) || null; }
function latestEventForMonth(place, month) { return [...place.history].filter((event) => event.month <= month).at(-1) || null; }
function hasPhotosForMonth(month) {
  const scope = detailPlace() ? [detailPlace()] : places;
  return scope.some((place) => eventsForMonth(place, month)?.photos.length);
}
function recordsForMonth(month) {
  const scope = detailPlace() ? [detailPlace()] : places;
  return scope.some((place) => eventsForMonth(place, month)?.photos.length);
}

function scrollTimelineTo(viewport, target, animate) {
  if (monthScrollFrame !== null) cancelAnimationFrame(monthScrollFrame);
  const start = viewport.scrollLeft, distance = target - start;
  if (!animate || Math.abs(distance) < 1) { viewport.scrollLeft = target; monthScrollFrame = null; return; }
  const startedAt = performance.now(), duration = 800;
  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration), eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    viewport.scrollLeft = start + distance * eased;
    if (progress < 1) monthScrollFrame = requestAnimationFrame(frame); else monthScrollFrame = null;
  };
  monthScrollFrame = requestAnimationFrame(frame);
}
function timelineCenterOffset(viewport) {
  const controls = $(".timeline-controls").getBoundingClientRect();
  const ruler = viewport.getBoundingClientRect();
  return ruler.left + ruler.width / 2 - (controls.left + controls.width / 2);
}
function renderMonthTrack(animate = false) {
  const track = $("#month-track");
  const viewport = $("#month-viewport");
  // Hidden sections have no usable width; size the ruler when Archive is revealed.
  if (!viewport.clientWidth) return;
  const previousScroll = viewport.scrollLeft;
  track.innerHTML = months.map((month) => {
    const record = recordsForMonth(month), year = month.endsWith("-01");
    const label = record && year ? month.slice(0, 4) : fullMonth(month);
    const planned = (detailPlace() ? [detailPlace()] : places).some(place => eventsForMonth(place, month)?.kind === "planned");
    return `<button class="month-tick ${planned ? "is-planned" : ""} ${record ? "has-entry" : ""} ${year ? "year-tick" : ""}" data-month="${month}" aria-label="${label}" aria-pressed="${month === state.month}" ${record ? `title="${label}${planned ? " · Planned documentation" : ""}"` : `disabled aria-disabled="true" title="V tomto datu nejsou fotografie"`}><span class="tick-mark"></span></button>`;
  }).join("");
  track.querySelectorAll("[data-month]:not(:disabled)").forEach((button) => button.addEventListener("click", () => setMonth(button.dataset.month)));
  const activeTick = track.querySelector(`[data-month="${state.month}"]`);
  // Continue the ruler beyond its dates so a centered endpoint still has ticks on both sides.
  const tickWidth = track.firstElementChild.offsetWidth;
  const tickGap = parseFloat(getComputedStyle(track).columnGap);
  const extensionCount = Math.ceil(viewport.clientWidth / (2 * (tickWidth + tickGap)));
  const extension = '<span class="month-tick timeline-extension" aria-hidden="true"><span class="tick-mark"></span></span>'.repeat(extensionCount);
  track.insertAdjacentHTML("afterbegin", extension);
  track.insertAdjacentHTML("beforeend", extension);
  // Rebuilding the track briefly shortens it and can clamp the scroll position.
  viewport.scrollLeft = previousScroll;
 
  const controls = $(".timeline-controls");
  controls.style.setProperty("--timeline-center-offset", `${timelineCenterOffset(viewport)}px`);
  $("#active-month").textContent = state.month.endsWith("-01") && recordsForMonth(state.month) ? state.month.slice(0, 4) : fullMonth(state.month);
  if (activeTick) {
    const viewportRect = viewport.getBoundingClientRect(), tickRect = activeTick.getBoundingClientRect();
    const target = viewport.scrollLeft + tickRect.left - viewportRect.left - viewport.clientWidth / 2 + tickRect.width / 2;
    scrollTimelineTo(viewport, target, animate);
  }
}

function filteredPlaces() {
  const query = normalizeText(state.query);
  return places.filter((place) => !query || normalizeText(`${place.name} ${place.subtitle} ${place.category}`).includes(query));
}
function normalizeText(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs"); }
function placesByMapDistance(visible) {
  if (!state.map) return visible;
  const center = state.map.getCenter();
  return visible
    .map((place) => ({ place, distance: center.distanceTo(place.coordinates) }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ place }) => place);
}

function reorderPlacesForMap() {
  if (state.detailPlaceId || $("#explore-layout").hidden) return;
  const list = $("#places-list");
  const cards = new Map([...list.children].map((card) => [card.dataset.placeCard, card]));
  const ordered = placesByMapDistance(filteredPlaces());
  const nearestChanged = ordered[0]?.id !== list.firstElementChild?.dataset.placeCard;
  ordered.forEach((place, index) => {
    const card = cards.get(place.id);
    if (card && card !== list.children[index]) list.insertBefore(card, list.children[index]);
  });
  if (nearestChanged) list.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function renderPlaces(animatePhotos = false) {
  const container = $("#places-list"), visible = placesByMapDistance(filteredPlaces());
  const previousPhotos = new Map(animatePhotos ? [...container.querySelectorAll("[data-place-card]")]
    .map((card) => [card.dataset.placeCard, card.querySelector(".place-image-wrap")]) : []);
  container.innerHTML = visible.map((place) => {
    const event = eventsForMonth(place, state.month), displayEvent = event?.photos.length ? event : (latestEventForMonth(place, state.month) || place.history[0]);
    const photos = displayEvent.photos, isSelected = place.id === state.placeId;
    return `<article class="place-card ${isSelected ? "is-selected" : ""}" data-place-card="${place.id}">
      <div class="place-card-main" data-select-place="${place.id}" tabindex="0" aria-label="Zobrazit ${place.name} na mapě">
        <div class="place-image-wrap"><img src="${photos[0].src}" alt="${photos[0].alt}" loading="lazy"/></div>
        <div class="place-card-side"><div class="place-card-title">${place.name}</div>${window.archiveCity ? `<p class="archive-record-kind">${displayEvent.kind === "planned" ? `Planned documentation · ${displayEvent.year}` : `Photograph · ${displayEvent.year}`}</p>` : ""}
          <button class="open-history" data-open-place="${place.id}">Open</button>
        </div>
      </div></article>`;
  }).join("") || '<p class="empty-search">No places match your search.</p>';
  for (const card of container.querySelectorAll("[data-place-card]")) {
    const previous = previousPhotos.get(card.dataset.placeCard);
    if (!animatePhotos) continue;
    const next = card.querySelector(".place-image-wrap");
    const photo = next.querySelector("img");
    if (previous) next.replaceWith(previous);
    updatePhoto(previous || next, photo.src, photo.alt, true);
  }
  prepareImages(container);
  container.querySelectorAll("[data-select-place]").forEach((el) => {
    el.addEventListener("click", () => selectPlace(el.dataset.selectPlace, { pan: true }));
    el.addEventListener("keydown", (event) => { if (event.target === el && ["Enter", " "].includes(event.key)) { event.preventDefault(); selectPlace(el.dataset.selectPlace, { pan: true }); } });
  });
  container.querySelectorAll("[data-open-place]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); locateThenOpen(button.dataset.openPlace); }));
}

async function locateThenOpen(placeId) {
  const place = places.find(item => item.id === placeId);
  if (!place) return;
  const token = (state.locateOpenToken || 0) + 1;
  state.locateOpenToken = token;
  state.placeId = placeId;
  renderPlaces();
  updateMarkerStyles();
  const map = state.map;
  if (map) {
    map.stop();
    const targetZoom = Math.max(map.getZoom(), 14);
    const alreadyLocated = map.getCenter().distanceTo(L.latLng(place.coordinates)) < 2 && map.getZoom() === targetZoom;
    if (!alreadyLocated) {
      await new Promise(resolve => {
        let timeout;
        const finish = () => {
          window.clearTimeout(timeout);
          map.off('moveend', finish);
          resolve();
        };
        map.once('moveend', finish);
        timeout = window.setTimeout(finish, 1800);
        map.flyTo(place.coordinates, targetZoom, {
          duration: .9,
          animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
        });
      });
    }
    if (token !== state.locateOpenToken) return;
    // Keep the centered, highlighted building visible before entering its archive.
    await new Promise(resolve => window.setTimeout(resolve, 350));
  }
  if (token !== state.locateOpenToken) return;
  openDetail(placeId);
}

function updateMarkerStyles(animatePhotos = false) {
  for (const place of places) {
    const marker = state.markers.get(place.id); if (!marker) continue;
    const displayEvent = eventsForMonth(place, state.month) || latestEventForMonth(place, state.month) || place.history[0], image = displayEvent?.photos[0]?.src;
    marker.setOpacity(filteredPlaces().some((entry) => entry.id === place.id) ? 1 : 0);
    const src = image || "./public/images/places/vltavska/2033/01.png";
    if (!marker.getElement()?.querySelector(".map-pin")) marker.setIcon(L.divIcon({ className: "", html: `<button class="map-pin ${state.placeId === place.id ? "is-active" : ""}" aria-label="Otevřít ${place.name}" type="button"><img src="${src}" alt=""/><span class="pin-label">${place.name}</span></button>`, iconSize: [68, 68], iconAnchor: [34, 34] }));
    const pin = marker.getElement()?.querySelector(".map-pin");
    pin?.classList.toggle("is-active", state.placeId === place.id);
    if (pin) updatePhoto(pin, src, "", animatePhotos);
  }
}
function selectPlace(placeId, options = {}) {
  state.locateOpenToken = (state.locateOpenToken || 0) + 1;
  state.placeId = state.placeId === placeId && options.toggle ? null : placeId;
  const place = selectedPlace(); renderPlaces(); updateMarkerStyles();
  if (place && options.pan) state.map.flyTo(place.coordinates, Math.max(state.map.getZoom(), 14), { duration: .65 });
  else if (!place && options.pan) state.map.flyTo(archiveCenter, 12, { duration: .65 });
}
function setMonth(month) {
  if (!months.includes(month) || !hasPhotosForMonth(month)) return;
  state.month = month; renderMonthTrack(true); renderPlaces(true); updateMarkerStyles(true);
  updateAerialMap();
  if (detailPlace()) renderArchiveEvent(detailPlace(), true);
}
function nudgeMonth(offset) {
  const step = Math.sign(offset); let index = monthIndex(state.month) + step;
  while (index >= 0 && index < months.length) { if (hasPhotosForMonth(months[index])) { setMonth(months[index]); return; } index += step; }
}

function inlinePhotoLoadingMarkup(hidden = false) {
  return `<div class="photo-inline-loading" ${hidden ? 'hidden' : ''} role="status" aria-live="polite">
    <img src="./city-logo.svg" width="56" height="56" alt=""/>
    <p>sourcing images from analog archive</p>
    <span class="inline-loading-progress" aria-hidden="true"><span class="inline-progress-fill"></span></span>
  </div>`;
}
function startInlinePhotoLoading(root, duration = 900) {
  const fill = root.querySelector('.inline-progress-fill');
  if (!fill || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const first = .12 + Math.random() * .2;
  const second = .5 + Math.random() * .18;
  return fill.animate([
    { offset: 0, transform: 'scaleX(0)' },
    { offset: .18 + Math.random() * .08, transform: `scaleX(${first})` },
    { offset: .36, transform: `scaleX(${first})` },
    { offset: .52 + Math.random() * .1, transform: `scaleX(${second})` },
    { offset: .76, transform: `scaleX(${second})` },
    { offset: 1, transform: 'scaleX(.92)' },
  ], { duration, fill: 'forwards', easing: 'ease-in-out' });
}

function setupPhotoViewer(layer) {
  const viewer = layer.querySelector('.single-photo-viewer');
  const place = detailPlace();
  const event = place && eventsForMonth(place, state.month);
  if (!viewer || !event?.photos.length) return;
  const frame = viewer.querySelector('.single-photo-frame');
  const photoButton = viewer.querySelector('.single-photo');
  const image = photoButton.querySelector('img');
  const next = viewer.querySelector('.load-next-photo');
  const counter = viewer.querySelector('.photo-counter');
  const loading = viewer.querySelector('.photo-inline-loading');
  const status = loading.querySelector('p');
  let index = 0;
  let busy = false;
  next.disabled = event.photos.length < 2;
  next.addEventListener('click', async () => {
    if (busy || event.photos.length < 2) return;
    busy = true;
    next.disabled = true;
    photoButton.disabled = true;
    frame.classList.add('is-loading');
    frame.setAttribute('aria-busy', 'true');
    loading.hidden = false;
    status.textContent = 'sourcing images from analog archive';
    const nextIndex = (index + 1) % event.photos.length;
    const photo = event.photos[nextIndex];
    const progressAnimation = startInlinePhotoLoading(viewer);
    const [loaded] = await Promise.all([
      preloadPhoto(photo.src),
      new Promise(resolve => window.setTimeout(resolve, 1000)),
    ]);
    progressAnimation?.cancel();
    if (!viewer.isConnected || detailPlace()?.id !== place.id || state.month !== event.month) return;
    if (!loaded) {
      status.textContent = 'Unable to load this photograph. Please try again.';
      busy = false;
      next.disabled = false;
      frame.setAttribute('aria-busy', 'false');
      return;
    }
    index = nextIndex;
    image.src = photo.src;
    image.alt = photo.alt;
    image.dataset.preparedSrc = new URL(photo.src, location.href).href;
    image.classList.remove('photo-pending');
    image.classList.add('photo-ready');
    photoButton.setAttribute('aria-label', `Open photograph ${index + 1} of ${event.photos.length}`);
    counter.textContent = `${index + 1}/${event.photos.length}`;
    loading.hidden = true;
    frame.classList.remove('is-loading');
    frame.setAttribute('aria-busy', 'false');
    photoButton.disabled = false;
    busy = false;
    next.disabled = false;
    fadeInPhoto(image);
  });
}

function archiveEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
}
function archiveEventMarkup(event) {
if (!event) return '<p class="archive-empty">Pro toto datum nejsou fotografie.</p>';
if (event.kind === 'planned') return `<div class="planned-record"><span>${event.year}</span><h2>Planned documentation</h2><p>No photograph has been recorded for this year.</p></div>`;

const photo = event.photos[0];
return `<div class="single-photo-viewer">
  <div class="single-photo-frame" aria-busy="false">
    <button class="history-photo single-photo" type="button" data-fullscreen-photo aria-label="Open photograph 1 of ${event.photos.length}"><img src="${archiveEscape(photo.src)}" alt="${archiveEscape(photo.alt)}"/></button>
    ${inlinePhotoLoadingMarkup(true)}
  </div>
  <div class="single-photo-controls"><button class="load-next-photo" type="button" ${event.photos.length < 2 ? 'disabled' : ''}>Load next photograph</button><span class="photo-counter" aria-live="polite">1/${event.photos.length}</span></div>
</div>`;

}
function archiveLayerMarkup(event, type = "current") {
  return `<div class="archive-content ${type}" aria-label="Fotografie roku ${event?.year || ""}">${archiveEventMarkup(event)}</div>`;
}
function historyMarkup(place) {
  const event = eventsForMonth(place, state.month);
  return `<section class="detail-page" aria-labelledby="detail-title">
    <div class="archive-stage" id="archive-stage" aria-live="polite">${archiveLayerMarkup(event)}</div>
  </section>`;
}
async function renderArchiveEvent(place, animate = false) {
  const stage = $('#archive-stage');
  if (!stage) return;
  const event = eventsForMonth(place, state.month);
  const token = (state.archiveRenderToken || 0) + 1;
  state.archiveRenderToken = token;
  if (animate) {
    stage.innerHTML = `<div class="archive-content current"><div class="single-photo-viewer">
      <div class="single-photo-frame is-loading" aria-busy="true">${inlinePhotoLoadingMarkup()}</div>
      <div class="single-photo-controls" style="visibility:hidden" aria-hidden="true"><span>Load next photograph</span><span>1/1</span></div>
    </div></div>`;
    const progress = startInlinePhotoLoading(stage);
    await Promise.all([
      Promise.all(event?.photos.map(photo => preloadPhoto(photo.src)) || []),
      new Promise(resolve => window.setTimeout(resolve, 1000)),
    ]);
    progress?.cancel();
    if (token !== state.archiveRenderToken || detailPlace()?.id !== place.id || !stage.isConnected) return;
  }
  stage.innerHTML = archiveLayerMarkup(event);
  prepareImages(stage);
  setupPhotoViewer(stage);
}
function syncHash() {
  const next = state.detailPlaceId ? `#place/${state.detailPlaceId}` : "#archive";
  if (location.hash !== next) history.replaceState(null, "", next);
}
let archiveLoadingProgress = null;
function showArchiveLoading() {
  let overlay = document.querySelector('.archive-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'archive-loading';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = '<img src="./city-logo.svg" width="112" height="112" alt=""/><p>sourcing images from analog archive</p><span class="city-loading-progress" aria-hidden="true"><span class="archive-progress-fill"></span></span>';
    document.body.append(overlay);
  }
overlay.classList.add('is-loading');
const fill = overlay.querySelector('.archive-progress-fill');
archiveLoadingProgress?.cancel();
fill.style.transform = 'scaleX(0)';
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  fill.style.transform = 'scaleX(.5)';
} else {
  const frames = [{ offset: 0, transform: 'scaleX(0)' }];
  let progress = 0;
  for (let step = 1; step <= 6; step++) {
    const offset = step / 7 + (Math.random() - .5) * .055;
    progress += .065 + Math.random() * .07;
    const transform = `scaleX(${progress})`;
    frames.push({ offset, transform, easing: 'cubic-bezier(.2,.8,.2,1)' });
    frames.push({ offset: offset + .025 + Math.random() * .045, transform });
  }
  // Hold short of completion if image retrieval takes longer than the minimum.
  frames.push({ offset: 1, transform: 'scaleX(.92)' });
  archiveLoadingProgress = fill.animate(frames, { duration: 2800, fill: 'forwards' });
}

  $('.app-shell').inert = true;
  $('.topbar').inert = true;
}
function hideArchiveLoading() {
  archiveLoadingProgress?.cancel();
  archiveLoadingProgress = null;
  document.querySelector('.archive-loading')?.classList.remove('is-loading');
  $('.app-shell').inert = false;
  $('.topbar').inert = false;
}
function openDetail(placeId, { updateUrl = true, showLoading = true } = {}) {
  state.locateOpenToken = (state.locateOpenToken || 0) + 1;

  const place = places.find((item) => item.id === placeId); if (!place) return;
  state.detailPlaceId = placeId; state.placeId = placeId;
  const nearest = [...place.history].sort((a, b) => Math.abs(monthIndex(a.month) - monthIndex(state.month)) - Math.abs(monthIndex(b.month) - monthIndex(state.month)))[0];
  if (nearest) state.month = nearest.month;
  const openToken = (state.detailOpenToken || 0) + 1; state.detailOpenToken = openToken;
const selectedEvent = eventsForMonth(place, state.month);
if (showLoading) showArchiveLoading();
$('#explore-layout').classList.add('is-leaving');
const preload = Promise.all(selectedEvent?.photos.map(photo => preloadPhoto(photo.src)) || []);
const minimumLoading = new Promise(resolve => window.setTimeout(resolve, showLoading ? 3000 : 160));
Promise.all([preload, minimumLoading]).then(() => {
  if (openToken !== state.detailOpenToken || state.detailPlaceId !== placeId) return;
  $('#explore-layout').hidden = true;
  $('#place-detail').innerHTML = historyMarkup(place);
  $('#place-detail').hidden = false;
  prepareImages($('#place-detail'));
  setupPhotoViewer($('#place-detail'));
  $('#detail-title').textContent = place.name;
  $('#detail-title').hidden = false;
  $('#detail-back').hidden = false;
  renderMonthTrack(false);
  requestAnimationFrame(() => {
    if (openToken !== state.detailOpenToken || state.detailPlaceId !== placeId) return;
    $('#place-detail').classList.add('is-visible');
    if (showLoading) hideArchiveLoading();
  });
});
  renderMonthTrack(true); updateMarkerStyles(); if (updateUrl) syncHash();
  if (state.map) state.map.flyTo(place.coordinates, Math.max(state.map.getZoom(), 14), { duration: .65 });
}
function closeDetail({ updateUrl = true } = {}) {
  hideArchiveLoading();
  state.detailOpenToken = (state.detailOpenToken || 0) + 1;
  state.archiveRenderToken = (state.archiveRenderToken || 0) + 1;
  $("#place-detail").classList.remove("is-visible");
  $("#detail-title").hidden = true;
  $("#detail-back").hidden = true;
  window.setTimeout(() => { $("#place-detail").hidden = true; $("#explore-layout").hidden = false; $("#explore-layout").classList.remove("is-leaving"); state.map?.invalidateSize(); updateAerialMap(); renderPlaces(true); updateMarkerStyles(true); }, 320);
  state.detailPlaceId = null; state.placeId = null; renderMonthTrack(false); if (updateUrl) syncHash();
}
function returnToMap() {
  state.locateOpenToken = (state.locateOpenToken || 0) + 1;
  if (state.detailPlaceId) closeDetail();
  else { state.placeId = null; renderPlaces(true); updateMarkerStyles(true); }
  if (state.map) state.map.flyTo(archiveCenter, 12, { duration: .65 });
}
function openPhoto(button) {
  const image = button.querySelector("img"), row = button.closest(".history-row"), lightbox = $("#photo-lightbox");
  if (!image) return;
  lightboxPhotos = [...(row || button.parentElement).querySelectorAll("[data-fullscreen-photo] img")].map((photo) => ({ src: photo.src, alt: photo.alt }));
  if (!lightboxPhotos.length) lightboxPhotos = [{ src: image.src, alt: image.alt }];
  lightboxPhotoIndex = Math.max(0, lightboxPhotos.findIndex((photo) => photo.src === image.src && photo.alt === image.alt));
  renderLightboxPhoto();
  lightbox.hidden = false; requestAnimationFrame(() => lightbox.classList.add("is-open"));
}
function renderLightboxPhoto() {
  const photo = lightboxPhotos[lightboxPhotoIndex];
  if (!photo) return;
  const preview = $("#photo-lightbox-image"); preview.src = photo.src; preview.alt = photo.alt;
  prepareImage(preview);
  const disabled = lightboxPhotos.length < 2;
  $("#photo-lightbox-prev").disabled = disabled;
  $("#photo-lightbox-next").disabled = disabled;
}
function moveLightboxPhoto(direction) {
  if (lightboxPhotos.length < 2) return;
  lightboxPhotoIndex = (lightboxPhotoIndex + direction + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightboxPhoto();
}
function closePhoto() { const box = $("#photo-lightbox"); box.classList.remove("is-open"); window.setTimeout(() => { if (!box.classList.contains("is-open")) box.hidden = true; }, 220); }
const aerialArchive = "https://gs-pub.praha.eu/arcgis/rest/services/ort/ortofotomapa_archiv/MapServer";
// Prefer the regular survey. The leaf-off survey is the available 2026 capture.
const aerialLayers = [[2026, 285], [2025, 281], [2024, 280], [2023, 264], [2022, 240], [2021, 224], [2020, 204]];
let aerialLayer = null;
let pendingAerialLayer = null;

function updateAerialMap() {
  if (!state.map || state.detailPlaceId || window.archiveCity) return;
  const selectedYear = Number(state.month.slice(0, 4));
  const [year, layerId] = aerialLayers.find(([captureYear]) => captureYear <= selectedYear);
  if (pendingAerialLayer?.captureYear === year) return;
  pendingAerialLayer?.remove();
  pendingAerialLayer = null;
  if (aerialLayer?.captureYear === year) return;

  const next = L.tileLayer("", {
    className: "aerial-tiles", opacity: 0, maxZoom: 19, noWrap: true,
    attribution: '<a href="https://geoportalpraha.cz/data-a-sluzby/clanky-a-projekty/ortofoto">© IPR Praha</a>',
  });
  next.captureYear = year;
  next.getTileUrl = ({ x, y, z }) => {
    const crs = L.CRS.EPSG3857;
    const scale = crs.scale(z);
    const size = next.getTileSize();
    const northwest = crs.transformation.untransform(L.point(x * size.x, y * size.y), scale);
    const southeast = crs.transformation.untransform(L.point((x + 1) * size.x, (y + 1) * size.y), scale);
    const bbox = [northwest.x, southeast.y, southeast.x, northwest.y].join(",");
    return `${aerialArchive}/export?bbox=${bbox}&bboxSR=3857&imageSR=3857&size=${size.x},${size.y}&format=png32&transparent=true&layers=show:${layerId}&f=image`;
  };

  let loadedTiles = 0;
  next.on("tileload", () => {
    loadedTiles++;
    if (!aerialLayer && pendingAerialLayer === next) next.setOpacity(1);
  });
  next.once("load", () => {
    if (pendingAerialLayer !== next) return;
    pendingAerialLayer = null;
    if (!loadedTiles) { next.remove(); return; }

    const previous = aerialLayer;
    aerialLayer = next;
    next.setOpacity(1);
    if (!previous || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previous?.remove();
      return;
    }
    const fade = next.getContainer().animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: "ease-in-out" });
    fade.onfinish = () => previous?.remove();
  });
  pendingAerialLayer = next;
  next.addTo(state.map);
  return next;
}

async function setupMap() {
  state.map = L.map("map", { zoomControl: false, scrollWheelZoom: true, preferCanvas: true }).setView(archiveCenter, 12);
  state.map.attributionControl.setPosition("bottomleft").setPrefix(false);
  state.map.on("moveend", reorderPlacesForMap);
  const initialAerialLayer = updateAerialMap();
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, zIndex: 0, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(state.map);
  // Let the visible map load before warming the rest of the photo archive.
  const photoWarmup = window.setTimeout(preloadAllPhotos, 3500);
  initialAerialLayer?.once("load", () => {
    window.clearTimeout(photoWarmup);
    preloadAllPhotos();
  });
  L.control.zoom({ position: "bottomright" }).addTo(state.map);
  for (const place of places) { const marker = L.marker(place.coordinates).addTo(state.map); marker.on("click", () => openDetail(place.id)); state.markers.set(place.id, marker); }
  updateMarkerStyles(!document.documentElement.classList.contains('city-entering')); setTimeout(() => state.map.invalidateSize(), 80);
}

$("#month-back").innerHTML = '<span class="timeline-arrow" aria-hidden="true">←</span>' + '<span class="timeline-arrow-label">Previous year</span>'; $("#month-forward").innerHTML = '<span class="timeline-arrow" aria-hidden="true">→</span>' + '<span class="timeline-arrow-label">Next year</span>'; $("#map-home").innerHTML = icon("locate");
$("#detail-back").addEventListener("click", closeDetail);
$(".topbar-brand").addEventListener("click", (event) => { event.preventDefault(); setCitySection('archive'); returnToMap(); });
$("#month-back").addEventListener("click", () => nudgeMonth(-1)); $("#month-forward").addEventListener("click", () => nudgeMonth(1));
$("#map-home").addEventListener("click", () => { state.placeId = null; renderPlaces(); updateMarkerStyles(); state.map.flyTo(archiveCenter, 12, { duration: .65 }); });
window.addEventListener("resize", () => { renderMonthTrack(false); state.map?.invalidateSize(); });
$("#place-detail").addEventListener("click", (event) => { const button = event.target.closest("[data-fullscreen-photo]"); if (button) openPhoto(button); });
$("#photo-lightbox-close").innerHTML = icon("close"); $("#photo-lightbox-close").addEventListener("click", closePhoto);
$("#photo-lightbox-prev").addEventListener("click", () => moveLightboxPhoto(-1));
$("#photo-lightbox-next").addEventListener("click", () => moveLightboxPhoto(1));
$("#photo-lightbox").addEventListener("click", (event) => { if (event.target === $("#photo-lightbox")) closePhoto(); });
document.addEventListener("keydown", (event) => {
  if (event.key === 'Escape' && $('#news-article-dialog').open) { closeNewsArticle(); return; }
  if (!$("#photo-lightbox").hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); moveLightboxPhoto(event.key === "ArrowLeft" ? -1 : 1); return; }
  if (event.key === "Escape" && !$("#photo-lightbox").hidden) closePhoto();
  else if (event.key === "Escape" && state.detailPlaceId) closeDetail();
  if (!$("#archive-view").hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight") && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) nudgeMonth(event.key === "ArrowLeft" ? -1 : 1);
});
$("#place-search").addEventListener("input", (event) => { state.query = event.target.value; renderPlaces(); updateMarkerStyles(); renderSiteSearch(); });
$("#place-search").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); $("#site-search-results").querySelector("button")?.click(); } else if (event.key === "Escape") setHeaderPanel(""); });
document.querySelectorAll("[data-info]").forEach((button) => button.addEventListener("click", () => { $("#info-title").textContent = button.dataset.info; $("#info-dialog").hidden = false; requestAnimationFrame(() => $("#info-dialog").classList.add("is-open")); }));
$("#info-close").addEventListener("click", () => { $("#info-dialog").classList.remove("is-open"); setTimeout(() => { $("#info-dialog").hidden = true; }, 180); });
window.addEventListener("hashchange", () => { const id = location.hash.startsWith("#place/") ? location.hash.slice(7) : null; if (id && id !== state.detailPlaceId) openDetail(id, { updateUrl: false }); else if (!id && state.detailPlaceId) closeDetail({ updateUrl: false }); });

setupMap(); renderMonthTrack(); renderPlaces(!document.documentElement.classList.contains('city-entering'));
window.addEventListener('archive-map-visible', () => { if (!state.detailPlaceId) { renderPlaces(true); updateMarkerStyles(true); } });
window.addEventListener('pageshow', event => { if (event.persisted && !state.detailPlaceId) { renderPlaces(true); updateMarkerStyles(true); } });
const initialPlace = location.hash.startsWith("#place/") ? location.hash.slice(7) : null;
if (initialPlace) openDetail(initialPlace, { updateUrl: false, showLoading: false });

const header = $(".topbar");
const searchToggle = $(".mobile-search-toggle");
const menuToggle = $(".mobile-menu-toggle");

function setHeaderPanel(panel) {
  header.dataset.panel = panel; if (panel !== "search") $("#site-search-results").hidden = true;
  searchToggle.setAttribute("aria-expanded", String(panel === "search"));
  menuToggle?.setAttribute("aria-expanded", String(panel === "menu"));
}

searchToggle.addEventListener("click", () => {
  const opening = header.dataset.panel !== "search";
  setHeaderPanel(opening ? "search" : "");
  if (opening) { renderSiteSearch(); $("#place-search").focus(); }
});
menuToggle?.addEventListener("click", () => {
  setHeaderPanel(header.dataset.panel === "menu" ? "" : "menu");
});
$("#header-menu").addEventListener("click", (event) => {
  if (event.target.closest("[data-info]")) setHeaderPanel("");
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) setHeaderPanel("");
});
header.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !header.dataset.panel) return;
  const toggle = header.dataset.panel === "search" ? searchToggle : menuToggle;
  setHeaderPanel("");
  toggle?.focus();
});

// A city journal sits alongside the photographic map archive.
const cityNewsArticles = window.journalArticles.filter(article => window.archiveCity ? !article.pragueOnly : !article.otherCitiesOnly);
function renderCityNews() {
  const root = $('#news-view');
  if (root.children.length) return;
  const cityTitle = window.archiveCity?.title || 'Paměť Prahy';
  const localImages = places.flatMap(place => place.history.filter(entry => entry.photos?.length && entry.kind !== 'planned').map(entry => entry.photos[0])).filter(photo => !photo.src.endsWith('.svg'));
  cityNewsArticles.forEach((article, index) => {
    article.image ||= localImages[index === 2 ? Math.min(2, localImages.length - 1) : 0]?.src || './public/images/mission/analog-archive.png';
    article.alt ||= `A photographic record from ${cityTitle}.`;
  });
  root.innerHTML = `<div class="news-grid">${cityNewsArticles.map(localizedNewsArticle).map((article,index) => `<article class="news-card ${index === 0 ? 'news-card-featured' : ''}"><button class="news-story" type="button" data-news-article="${index}" aria-label="${articleUI('read')}: ${archiveEscape(article.title)}"><div class="news-image"><img src="${archiveEscape(article.image)}" alt="${archiveEscape(article.alt)}" loading="lazy" /></div><div class="news-card-copy"><p class="news-eyebrow">${article.category}</p><h2>${article.title}</h2><p class="news-summary">${article.summary}</p><span class="news-read-more">${articleUI('read')} <span aria-hidden="true">→</span></span></div></button></article>`).join('')}</div>`;
  prepareImages(root);
  root.querySelectorAll('[data-news-article]').forEach(button => button.addEventListener('click', () => openNewsArticle(Number(button.dataset.newsArticle))));
}
let citySectionRequest = 0;
async function setCitySection(section, updateUrl = true) {
  if ($('#news-article-dialog').open) $('#news-article-dialog').close();
  const request = ++citySectionRequest;
  const news = section === 'news';
  if (news) {
    document.documentElement.classList.remove('city-entering', 'archive-entering');
    $('.topbar').inert = false;
    $('#news-view').inert = false;
  } else if (!$('#news-view').hidden) {
    document.documentElement.classList.add('city-entering', 'archive-entering');
    $('.topbar').inert = true;
    $('#news-view').inert = true;
    await Promise.all([
      new Promise(resolve => window.setTimeout(resolve, 1000)),
      Promise.all(places.map(place => (eventsForMonth(place,state.month) || latestEventForMonth(place,state.month) || place.history[0])?.photos[0]?.src).filter(Boolean).map(preloadPhoto)),
    ]);
    if (request !== citySectionRequest) return;
    document.documentElement.classList.remove('city-entering', 'archive-entering');
    $('.topbar').inert = false;
    $('#news-view').inert = false;
  }
  if (news && state.detailPlaceId) closeDetail({updateUrl:false});
  $('#archive-view').hidden = news;
  $('#news-view').hidden = !news;
  document.querySelectorAll('[data-city-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cityView === (news ? 'news' : 'archive'))));
  if (news) {
    renderCityNews();
    const journal = $('#news-view');
    journal.classList.remove('is-entering');
    void journal.offsetWidth;
    journal.classList.add('is-entering');
  }
  else { renderMonthTrack(false); state.map?.invalidateSize(); if (!state.detailPlaceId) { renderPlaces(true); updateMarkerStyles(true); } }
  if (updateUrl) history.replaceState(null, '', news ? '#journal' : state.detailPlaceId ? `#place/${state.detailPlaceId}` : '#archive');
}
document.querySelectorAll('[data-city-view]').forEach(button => button.addEventListener('click', () => {
  if ($('#news-article-dialog').open) $('#news-article-dialog').close();
  if (button.getAttribute('aria-pressed') !== 'true') setCitySection(button.dataset.cityView);
}));
$('#news-article-dialog').querySelector('.news-article-close').addEventListener('click',closeNewsArticle);
$('#news-article-dialog').addEventListener('click',event=>{ if(event.target !== event.currentTarget)return; const box=event.currentTarget.getBoundingClientRect(); if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.currentTarget.close(); });
window.addEventListener('hashchange',()=>setCitySection(isJournalHash()?'news':'archive',false));
if (isJournalHash()) setCitySection('news',false);

function openNewsArticle(index) {
  renderCityNews();
  const article = localizedNewsArticle(cityNewsArticles[index]);
  if (!article) return;
  const dialog = $('#news-article-dialog');
  dialog.querySelector('.news-article-body').innerHTML = `<p class="news-eyebrow">${article.category}${article.example === false ? '' : ` · ${articleUI('example')}`}</p><h1 id="news-article-title">${article.title}</h1><p class="news-article-intro">${article.summary}</p><img class="news-article-image" src="${archiveEscape(article.image)}" alt="${archiveEscape(article.alt)}" />${article.paragraphs.map(paragraph=>`<p>${paragraph}</p>`).join('')}`;
if (article.gallery?.length) {
  dialog.querySelector('.news-article-body').insertAdjacentHTML('beforeend', `<div class="news-article-gallery">${article.gallery.map(photo=>`<figure><img src="${archiveEscape(photo.src)}" alt="${archiveEscape(photo.alt)}" loading="lazy" /><figcaption>${photo.caption}</figcaption></figure>`).join('')}</div>`);
}
if (article.sources?.length) {
  dialog.querySelector('.news-article-body').insertAdjacentHTML('beforeend', `<footer class="news-article-sources"><p>${articleUI('further')}</p>${article.sources.map(source=>`<a href="${archiveEscape(source.url)}" target="_blank" rel="noreferrer">${source.title} ↗</a>`).join('')}</footer>`);
}
if (!dialog.open) { newsArticleTrigger = document.activeElement; dialog.show(); }
  activeNewsArticleIndex = index;
  const articleUrl = new URL(location.href);
  articleUrl.searchParams.set('article', article.key);
  articleUrl.hash = 'journal';
  history.replaceState(null, '', articleUrl.pathname + articleUrl.search + articleUrl.hash);
  $('#news-view').inert = true;
  dialog.scrollTop = 0; prepareImages(dialog);
}
function renderSiteSearch() {
  const results = $('#site-search-results');
  const query = normalizeText($('#place-search').value.trim());
  if (!query) { results.hidden = true; results.replaceChildren(); return; }
  const articles = cityNewsArticles.map((article,index)=>({article:localizedNewsArticle(article),index})).filter(({article})=>normalizeText([article.title,article.summary,article.category,...article.paragraphs].join(' ')).includes(query));
  const matches = filteredPlaces();
  results.innerHTML = `${articles.length ? `<section><h3>${articleUI('articles')}</h3>${articles.map(({article,index})=>`<button type="button" data-search-article="${index}"><span>${archiveEscape(article.title)}</span><span aria-hidden="true">→</span></button>`).join('')}</section>` : ''}${matches.length ? `<section><h3>${articleUI('archive')}</h3>${matches.map(place=>`<button type="button" data-search-place="${archiveEscape(place.id)}"><span>${archiveEscape(place.name)}</span><span aria-hidden="true">→</span></button>`).join('')}</section>` : ''}${!articles.length && !matches.length ? `<p class="search-no-results">${articleUI('noResults')}</p>` : ''}`;
  results.hidden = false;
  const finishSearch = () => { state.query = ''; $('#place-search').value = ''; setHeaderPanel(''); };
  results.querySelectorAll('[data-search-article]').forEach(button=>button.addEventListener('click',async()=>{
    const index=Number(button.dataset.searchArticle); finishSearch(); await setCitySection('news'); openNewsArticle(index);
  }));
  results.querySelectorAll('[data-search-place]').forEach(button=>button.addEventListener('click',async()=>{
    const id=button.dataset.searchPlace; finishSearch(); await setCitySection('archive'); selectPlace(id,{pan:true});
  }));
}

$('#news-article-dialog').addEventListener('close',()=>{
  if ($('#news-article-dialog').open) return;
  const articleUrl = new URL(location.href);
  articleUrl.searchParams.delete('article');
  articleUrl.searchParams.delete('from');
  history.replaceState(null, '', articleUrl.pathname + articleUrl.search + articleUrl.hash);
  const index = activeNewsArticleIndex;
  activeNewsArticleIndex = null;
  $('#news-view').inert = false;
  if (newsArticleTrigger?.isConnected) newsArticleTrigger.focus();
  else if (index !== null) $('#news-view').querySelector(`[data-news-article="${index}"]`)?.focus();
});
function applyArticleLanguage() {
  document.documentElement.lang = articleLanguage;
  $('#news-view').lang = articleLanguage;
  $('#news-article-dialog').lang = articleLanguage;
  document.querySelector('[data-city-view="news"]').textContent = 'JOURNAL';
  document.querySelector('[data-city-view="archive"]').textContent = 'ARCHIVE';
  $('.nav-search-toggle').textContent = articleUI('search');
  $('#place-search').placeholder = articleUI('placeholder');
  document.querySelector('label[for="place-search"]').textContent = articleUI('placeholder');
  $('.news-article-close').setAttribute('aria-label',articleUI('close'));
  const labels = {cs:'CZ',de:'DE',hu:'HU',pl:'PL',en:'EN',fr:'FR',nl:'NL',ga:'IE',da:'DK',sv:'SE',nb:'NO',fi:'FI',is:'IS',it:'IT',es:'ES',pt:'PT',el:'GR'};
  const names = {cs:'Čeština',de:'Deutsch',hu:'Magyar',pl:'Polski',en:'English',fr:'Français',nl:'Nederlands',ga:'Gaeilge',da:'Dansk',sv:'Svenska',nb:'Norsk',fi:'Suomi',is:'Íslenska',it:'Italiano',es:'Español',pt:'Português',el:'Ελληνικά'};
  const localButton = document.querySelector('[data-article-language="local"]');
  localButton.textContent = labels[localArticleLanguage];
  localButton.setAttribute('aria-label',names[localArticleLanguage]);
  document.querySelector('[data-article-language="en"]').setAttribute('aria-label','English');
  localButton.hidden = localArticleLanguage === 'en';
  document.querySelector('.article-language-switch > span').hidden = localArticleLanguage === 'en';
  document.querySelectorAll('[data-article-language]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.articleLanguage==='en'?'en':localArticleLanguage)===articleLanguage)));
  $('#month-back').setAttribute('aria-label',articleUI('previous'));
  $('#month-forward').setAttribute('aria-label',articleUI('next'));
  $('#month-back .timeline-arrow-label').textContent = articleUI('previous');
  $('#month-forward .timeline-arrow-label').textContent = articleUI('next');
  const articleIndex = activeNewsArticleIndex;
  if ($('#news-view').children.length) { $('#news-view').replaceChildren(); renderCityNews(); }
  if (articleIndex !== null && $('#news-article-dialog').open) openNewsArticle(articleIndex);
  if (!$('#archive-view').hidden) renderMonthTrack(false);
  if ($('.topbar').dataset.panel === 'search') renderSiteSearch();
}
document.querySelectorAll('[data-article-language]').forEach(button=>button.addEventListener('click',()=>{
  articleLanguage = button.dataset.articleLanguage === 'en' ? 'en' : localArticleLanguage;
  try { localStorage.setItem(articleLanguageStorageKey,articleLanguage); } catch {}
  applyArticleLanguage();
}));
applyArticleLanguage();
document.addEventListener('DOMContentLoaded',applyArticleLanguage,{once:true});

const requestedJournalArticle = new URLSearchParams(location.search).get('article');
if (requestedJournalArticle && isJournalHash()) {
  const articleIndex = cityNewsArticles.findIndex(article => article.key === requestedJournalArticle);
if (articleIndex !== -1) {
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === location.origin && ['/', '/index.html'].includes(referrer.pathname)) {
      const articleUrl = new URL(location.href);
      articleUrl.searchParams.set('from','directory');
      history.replaceState(null,'',articleUrl.pathname+articleUrl.search+articleUrl.hash);
    }
  } catch {}
  openNewsArticle(articleIndex);
}
}

function closeNewsArticle() {
  if (new URLSearchParams(location.search).get('from') === 'directory') {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === location.origin && ['/', '/index.html'].includes(referrer.pathname) && history.length > 1) {
        history.back();
        return;
      }
    } catch {}
    location.assign('./#collections-journal-title');
    return;
  }
  $('#news-article-dialog').close();
}
