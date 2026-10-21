const photoHistory = (slug, years, label) => years.map((year) => {
  const count = year.count;
  const photos = Array.from({ length: count }, (_, index) => ({
    src: `./public/images/places/${slug}/${year.value}/${String(index + 1).padStart(2, "0")}.png`,
    alt: `${label}, ${year.value} · fotografie ${index + 1}`,
  }));
  return { month: `${year.value}-01`, year: String(year.value), date: String(year.value), photos };
});

const places = [
  { id: "philharmonic", name: "Vltavská filharmonie", subtitle: "Holešovice · Praha 7", category: "Kultura", coordinates: [50.0998, 14.4384], description: "Nová koncertní síň na břehu Vltavy. Prohlédněte si fotografie místa v jednotlivých letech.", history: photoHistory("vltavska", [{ value: 2029, count: 3 }, { value: 2031, count: 3 }, { value: 2033, count: 4 }], "Vltavská filharmonie") },
  { id: "bubny", name: "Nádraží Bubny", subtitle: "Bubny · Praha 7", category: "Doprava", coordinates: [50.1082, 14.4385], description: "Proměna nádraží Bubny zachycená v různých letech.", history: photoHistory("nadrazi-bubny", [{ value: 2024, count: 3 }, { value: 2026, count: 1 }], "Nádraží Bubny") },
  { id: "jiriho-namesti", name: "Náměstí Jiřího z Poděbrad", subtitle: "Vinohrady · Praha 3", category: "Veřejný prostor", coordinates: [50.0773, 14.4505], description: "Fotografický záznam proměn náměstí Jiřího z Poděbrad.", history: photoHistory("namesti-jiriho-z-podebrad", [{ value: 2024, count: 3 }, { value: 2025, count: 3 }, { value: 2027, count: 3 }], "Náměstí Jiřího z Poděbrad") },
  { id: "pankrac-metro", name: "Metro D · Pankrác", subtitle: "Pankrác · Praha 4", category: "Doprava", coordinates: [50.0511, 14.4396], description: "Fotografie vývoje stanice a okolí Pankráce v čase.", history: photoHistory("pankrac-metro-d", [{ value: 2025, count: 3 }, { value: 2027, count: 4 }, { value: 2031, count: 3 }], "Metro D · Pankrác") },
  { id: "smichov", name: "Smíchovské nádraží", subtitle: "Smíchov · Praha 5", category: "Doprava", coordinates: [50.0613, 14.4087], description: "Proměny Smíchovského nádraží podle fotografií z jednotlivých let.", history: photoHistory("smichovske-nadrazi", [{ value: 2024, count: 3 }, { value: 2027, count: 3 }, { value: 2030, count: 3 }], "Smíchovské nádraží") },
  { id: "vaclavske-namesti", name: "Václavské náměstí", subtitle: "Nové Město · Praha 1", category: "Veřejný prostor", coordinates: [50.0814, 14.4275], description: "Fotografický přehled proměn Václavského náměstí.", history: photoHistory("vaslavske-namesti", [{ value: 2024, count: 4 }, { value: 2027, count: 4 }, { value: 2029, count: 4 }], "Václavské náměstí") },
  { id: "rail-bridge", name: "Železniční most", subtitle: "Výtoň · Praha 2", category: "Doprava", coordinates: [50.0677, 14.4141], description: "Fotografie železničního mostu a jeho okolí v různých letech.", history: photoHistory("zeleznicni-most", [{ value: 2029, count: 2 }, { value: 2030, count: 3 }, { value: 2032, count: 4 }], "Železniční most") },
];

const monthStart = new Date(Date.UTC(2020, 0, 1));
const monthEnd = new Date(Date.UTC(2036, 11, 1));
const months = [];
for (let date = new Date(monthStart); date <= monthEnd; date.setUTCMonth(date.getUTCMonth() + 1)) months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);

const state = { month: "2029-01", placeId: null, detailPlaceId: null, map: null, markers: new Map(), query: "" };
const $ = (selector) => document.querySelector(selector);
let monthScrollFrame = null;
let lightboxPhotos = [];
let lightboxPhotoIndex = 0;
let photoLoadQueue = [];
let activePhotoLoads = 0;
const photoLoads = new Map();

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
function prepareImage(image) {
  const src = image.currentSrc || image.src;
  if (!src || image.dataset.preparedSrc === src) return;
  image.dataset.preparedSrc = src;
  image.classList.add("photo-pending");
  preloadPhoto(src).then(() => {
    if (image.isConnected && image.dataset.preparedSrc === src) {
      image.classList.remove("photo-pending"); image.classList.add("photo-ready");
    }
  });
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
function fullMonth(key) { const d = monthDate(key); return new Intl.DateTimeFormat("cs", { month: "long", year: "numeric", timeZone: "UTC" }).format(d); }
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
  if (!animate || Math.abs(distance) < 1) { viewport.scrollLeft = target; monthScrollFrame = null; updateTickScale(); return; }
  const startedAt = performance.now(), duration = 800;
  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration), eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    viewport.scrollLeft = start + distance * eased; updateTickScale();
    if (progress < 1) monthScrollFrame = requestAnimationFrame(frame); else monthScrollFrame = null;
  };
  monthScrollFrame = requestAnimationFrame(frame);
}
function timelineCenterOffset(viewport) {
  const controls = $(".timeline-controls").getBoundingClientRect();
  const ruler = viewport.getBoundingClientRect();
  return ruler.left + ruler.width / 2 - (controls.left + controls.width / 2);
}
function updateTickScale() {
  const viewport = $("#month-viewport");
  if (!viewport) return;
  const box = viewport.getBoundingClientRect(), center = box.left + box.width / 2, radius = Math.max(1, box.width / 2);
  viewport.querySelectorAll(".month-tick").forEach((tick) => {
    const r = tick.getBoundingClientRect(), x = r.left + r.width / 2, distance = Math.abs(x - center) / radius;
    const centerLift = Math.exp(-Math.pow((x - center) / Math.max(75, box.width * .2), 2));
    const edgeFade = Math.max(.38, 1 - Math.pow(distance, 2) * .62);
    tick.style.setProperty("--tick-scale", String((.48 + .82 * centerLift) * edgeFade));
  });
}
function renderMonthTrack(animate = false) {
  const track = $("#month-track");
  track.innerHTML = months.map((month) => {
    const record = recordsForMonth(month), year = month.endsWith("-01");
    const label = record && year ? month.slice(0, 4) : fullMonth(month);
    return `<button class="month-tick ${record ? "has-entry" : ""} ${year ? "year-tick" : ""}" data-month="${month}" aria-label="${label}" aria-pressed="${month === state.month}" ${record ? `title="${label}"` : `disabled aria-disabled="true" title="V tomto datu nejsou fotografie"`}><span class="tick-mark"></span>${record ? '<span class="record-dot"></span>' : ""}</button>`;
  }).join("");
  track.querySelectorAll("[data-month]:not(:disabled)").forEach((button) => button.addEventListener("click", () => setMonth(button.dataset.month)));
  const viewport = $("#month-viewport"), activeTick = track.querySelector(`[data-month="${state.month}"]`);
  // End gutters let even the first and last date scroll all the way to the center.
  const endGutter = `${viewport.clientWidth / 2}px`;
  track.style.paddingLeft = endGutter;
  track.style.paddingRight = endGutter;
  const controls = $(".timeline-controls");
  controls.style.setProperty("--timeline-center-offset", `${timelineCenterOffset(viewport)}px`);
  $("#active-month").textContent = state.month.endsWith("-01") && recordsForMonth(state.month) ? state.month.slice(0, 4) : fullMonth(state.month);
  if (activeTick) {
    const viewportRect = viewport.getBoundingClientRect(), tickRect = activeTick.getBoundingClientRect();
    const target = viewport.scrollLeft + tickRect.left - viewportRect.left - viewport.clientWidth / 2 + tickRect.width / 2;
    scrollTimelineTo(viewport, target, animate);
  }
  else updateTickScale();
}

function filteredPlaces() {
  const query = normalizeText(state.query);
  return places.filter((place) => !query || normalizeText(`${place.name} ${place.subtitle} ${place.category}`).includes(query));
}
function normalizeText(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs"); }
function renderPlaces() {
  const container = $("#places-list"), visible = filteredPlaces();
  container.innerHTML = visible.map((place) => {
    const event = eventsForMonth(place, state.month), displayEvent = event?.photos.length ? event : (latestEventForMonth(place, state.month) || place.history[0]);
    const photos = displayEvent.photos, isSelected = place.id === state.placeId;
    return `<article class="place-card ${isSelected ? "is-selected" : ""}" data-place-card="${place.id}">
      <div class="place-card-main" data-select-place="${place.id}" tabindex="0" aria-label="Zobrazit ${place.name} na mapě">
        <div class="place-image-wrap"><img src="${photos[0].src}" alt="${photos[0].alt}" loading="lazy"/></div>
        <div class="place-card-side"><div class="place-card-title">${place.name}</div>
          <div class="place-thumbnails" aria-label="Vybrat fotografii">${photos.slice(0, 5).map((photo, index) => `<button class="place-thumbnail ${index === 0 ? "is-active" : ""}" type="button" data-photo-index="${index}" aria-label="Zobrazit fotografii ${index + 1}" aria-pressed="${index === 0}"><img src="${photo.src}" alt="${photo.alt}" loading="lazy"/></button>`).join("")}</div>
          <span class="place-card-dot" aria-hidden="true"></span><button class="open-history" data-open-place="${place.id}">Otevřít</button>
        </div>
      </div></article>`;
  }).join("") || '<p class="empty-search">Žádné místo neodpovídá hledání.</p>';
  prepareImages(container);
  container.querySelectorAll("[data-select-place]").forEach((el) => {
    el.addEventListener("click", () => selectPlace(el.dataset.selectPlace, { pan: true }));
    el.addEventListener("keydown", (event) => { if (event.target === el && ["Enter", " "].includes(event.key)) { event.preventDefault(); selectPlace(el.dataset.selectPlace, { pan: true }); } });
  });
  container.querySelectorAll("[data-photo-index]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation(); const card = button.closest(".place-card"), buttons = [...card.querySelectorAll("[data-photo-index]")], image = button.querySelector("img");
    const hero = card.querySelector(".place-image-wrap img"); hero.src = image.src; hero.alt = image.alt; prepareImage(hero);
    buttons.forEach((item) => { const active = item === button; item.classList.toggle("is-active", active); item.setAttribute("aria-pressed", String(active)); });
    card.querySelector(".place-card-dot").style.left = `${13.5 + Number(button.dataset.photoIndex) * 31}px`;
  }));
  container.querySelectorAll("[data-open-place]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); openDetail(button.dataset.openPlace); }));
}

function updateMarkerStyles() {
  for (const place of places) {
    const marker = state.markers.get(place.id); if (!marker) continue;
    const displayEvent = eventsForMonth(place, state.month) || latestEventForMonth(place, state.month) || place.history[0], image = displayEvent?.photos[0]?.src;
    marker.setOpacity(filteredPlaces().some((entry) => entry.id === place.id) ? 1 : 0);
    const src = image || "./public/images/places/vltavska/2033/01.png";
    if (!marker.getElement()?.querySelector(".map-pin")) marker.setIcon(L.divIcon({ className: "", html: `<button class="map-pin ${state.placeId === place.id ? "is-active" : ""}" aria-label="Otevřít ${place.name}" type="button"><img src="${src}" alt=""/><span class="pin-label">${place.name}</span></button>`, iconSize: [68, 68], iconAnchor: [34, 34] }));
    const pin = marker.getElement()?.querySelector(".map-pin"), pinImage = pin?.querySelector("img");
    pin?.classList.toggle("is-active", state.placeId === place.id);
    if (pinImage && marker._pinPhoto !== src) {
      marker._pinPhoto = src;
      preloadPhoto(src).then((ready) => {
        if (!ready || !pinImage.isConnected || marker._pinPhoto !== src) return;
        pinImage.src = src; prepareImage(pinImage);
      });
    } else if (pinImage) prepareImage(pinImage);
  }
}
function selectPlace(placeId, options = {}) {
  state.placeId = state.placeId === placeId && options.toggle ? null : placeId;
  const place = selectedPlace(); renderPlaces(); updateMarkerStyles();
  if (place && options.pan) state.map.flyTo(place.coordinates, Math.max(state.map.getZoom(), 14), { duration: .65 });
  else if (!place && options.pan) state.map.flyTo([50.0875, 14.4213], 12, { duration: .65 });
}
function setMonth(month) {
  if (!months.includes(month) || !hasPhotosForMonth(month)) return;
  state.month = month; renderMonthTrack(true); renderPlaces(); updateMarkerStyles();
  if (detailPlace()) renderArchiveEvent(detailPlace(), true);
}
function nudgeMonth(offset) {
  const step = Math.sign(offset); let index = monthIndex(state.month) + step;
  while (index >= 0 && index < months.length) { if (hasPhotosForMonth(months[index])) { setMonth(months[index]); return; } index += step; }
}

function archiveEventMarkup(event) {
  if (!event) return '<p class="archive-empty">Pro toto datum nejsou fotografie.</p>';
  return `<h2 class="history-date">${event.year}</h2><div class="history-photos" aria-label="Fotografie z roku ${event.year}">${event.photos.map((photo) => `<button class="history-photo" type="button" data-fullscreen-photo aria-label="Zobrazit fotografii přes celou obrazovku: ${photo.alt}"><img src="${photo.src}" alt="${photo.alt}"/></button>`).join("")}</div>`;
}
function archiveLayerMarkup(event, type = "current") {
  return `<div class="archive-content ${type}" aria-label="Fotografie roku ${event?.year || ""}">${archiveEventMarkup(event)}</div>`;
}
function historyMarkup(place) {
  const event = eventsForMonth(place, state.month);
  return `<section class="detail-page" aria-labelledby="detail-title">
    <div class="detail-heading"><h1 id="detail-title">${place.name}</h1><button class="detail-back" type="button" id="detail-back">Zpět na mapu</button></div>
    <div class="archive-stage" id="archive-stage" aria-live="polite">${archiveLayerMarkup(event)}</div>
  </section>`;
}
async function renderArchiveEvent(place, animate = false) {
  const stage = $("#archive-stage"); if (!stage) return;
  const event = eventsForMonth(place, state.month);
  if (!animate) { stage.innerHTML = archiveLayerMarkup(event); prepareImages(stage); return; }
  const token = (state.archiveRenderToken || 0) + 1; state.archiveRenderToken = token;
  await Promise.all(event?.photos.map((photo) => preloadPhoto(photo.src)) || []);
  if (token !== state.archiveRenderToken || !detailPlace() || !stage.isConnected) return;
  stage.querySelectorAll(".archive-content.outgoing").forEach((layer) => layer.remove());
  const outgoing = stage.querySelector(".archive-content.current");
  outgoing?.getAnimations().forEach((animation) => animation.cancel());
  const incoming = document.createElement("div");
  incoming.innerHTML = archiveLayerMarkup(event, "incoming");
  const nextLayer = incoming.firstElementChild;
  stage.append(nextLayer); prepareImages(nextLayer);
  nextLayer.getBoundingClientRect();
  requestAnimationFrame(() => {
    if (token !== state.archiveRenderToken) return;
    nextLayer.classList.remove("incoming"); nextLayer.classList.add("current", "photo-transitioned");
    nextLayer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1500, easing: "ease-in-out", fill: "both" });
    if (outgoing) {
      const outgoingOpacity = Number(getComputedStyle(outgoing).opacity);
      outgoing.classList.add("outgoing");
      outgoing.animate([{ opacity: outgoingOpacity }, { opacity: 0 }], { duration: 1500, easing: "ease-in-out", fill: "both" });
    }
  });
  window.setTimeout(() => {
    if (token !== state.archiveRenderToken) return;
    outgoing?.remove();
  }, 1560);
}
function syncHash() {
  const next = state.detailPlaceId ? `#place/${state.detailPlaceId}` : "#";
  if (location.hash !== next) history.replaceState(null, "", next);
}
function openDetail(placeId, { updateUrl = true } = {}) {
  const place = places.find((item) => item.id === placeId); if (!place) return;
  state.detailPlaceId = placeId; state.placeId = placeId;
  const nearest = [...place.history].sort((a, b) => Math.abs(monthIndex(a.month) - monthIndex(state.month)) - Math.abs(monthIndex(b.month) - monthIndex(state.month)))[0];
  if (nearest) state.month = nearest.month;
  const openToken = (state.detailOpenToken || 0) + 1; state.detailOpenToken = openToken;
  const selectedEvent = eventsForMonth(place, state.month);
  $("#explore-layout").classList.add("is-leaving");
  Promise.all(selectedEvent?.photos.map((photo) => preloadPhoto(photo.src)) || []).then(() => {
    if (openToken !== state.detailOpenToken || state.detailPlaceId !== placeId) return;
    window.setTimeout(() => {
      if (openToken !== state.detailOpenToken || state.detailPlaceId !== placeId) return;
    $("#explore-layout").hidden = true;
    $("#place-detail").innerHTML = historyMarkup(place); $("#place-detail").hidden = false;
    prepareImages($("#place-detail"));
    requestAnimationFrame(() => $("#place-detail").classList.add("is-visible"));
    $("#detail-back").addEventListener("click", closeDetail);
    }, 160);
  });
  renderMonthTrack(true); updateMarkerStyles(); if (updateUrl) syncHash();
  if (state.map) state.map.flyTo(place.coordinates, Math.max(state.map.getZoom(), 14), { duration: .65 });
}
function closeDetail({ updateUrl = true } = {}) {
  state.detailOpenToken = (state.detailOpenToken || 0) + 1;
  state.archiveRenderToken = (state.archiveRenderToken || 0) + 1;
  $("#place-detail").classList.remove("is-visible");
  window.setTimeout(() => { $("#place-detail").hidden = true; $("#explore-layout").hidden = false; $("#explore-layout").classList.remove("is-leaving"); state.map?.invalidateSize(); }, 320);
  state.detailPlaceId = null; state.placeId = null; renderMonthTrack(false); renderPlaces(); updateMarkerStyles(); if (updateUrl) syncHash();
}
function returnToMap() {
  if (state.detailPlaceId) closeDetail();
  state.placeId = null; renderPlaces(); updateMarkerStyles();
  if (state.map) state.map.flyTo([50.0875, 14.4213], 12, { duration: .65 });
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
async function setupMap() {
  state.map = L.map("map", { zoomControl: false, scrollWheelZoom: true, preferCanvas: true }).setView([50.0875, 14.4213], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(state.map);
  L.control.zoom({ position: "bottomright" }).addTo(state.map);
  const initialPins = places.map((place) => (eventsForMonth(place, state.month) || latestEventForMonth(place, state.month) || place.history[0]).photos[0].src);
  await Promise.all([...new Set(initialPins)].map(preloadPhoto));
  for (const place of places) { const marker = L.marker(place.coordinates).addTo(state.map); marker.on("click", () => openDetail(place.id)); state.markers.set(place.id, marker); }
  updateMarkerStyles(); setTimeout(() => state.map.invalidateSize(), 80);
}

$("#month-back").innerHTML = icon("left"); $("#month-forward").innerHTML = icon("right"); $("#map-home").innerHTML = icon("locate");
$(".topbar-brand").addEventListener("click", (event) => { event.preventDefault(); returnToMap(); });
$("#month-back").addEventListener("click", () => nudgeMonth(-1)); $("#month-forward").addEventListener("click", () => nudgeMonth(1));
$("#map-home").addEventListener("click", () => { state.placeId = null; renderPlaces(); updateMarkerStyles(); state.map.flyTo([50.0875, 14.4213], 12, { duration: .65 }); });
$("#month-viewport").addEventListener("scroll", () => requestAnimationFrame(updateTickScale), { passive: true });
window.addEventListener("resize", () => { renderMonthTrack(false); state.map?.invalidateSize(); });
$("#place-detail").addEventListener("click", (event) => { const button = event.target.closest("[data-fullscreen-photo]"); if (button) openPhoto(button); });
$("#photo-lightbox-close").innerHTML = icon("close"); $("#photo-lightbox-close").addEventListener("click", closePhoto);
$("#photo-lightbox-prev").addEventListener("click", () => moveLightboxPhoto(-1));
$("#photo-lightbox-next").addEventListener("click", () => moveLightboxPhoto(1));
$("#photo-lightbox").addEventListener("click", (event) => { if (event.target === $("#photo-lightbox")) closePhoto(); });
document.addEventListener("keydown", (event) => {
  if (!$("#photo-lightbox").hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); moveLightboxPhoto(event.key === "ArrowLeft" ? -1 : 1); return; }
  if (event.key === "Escape" && !$("#photo-lightbox").hidden) closePhoto();
  else if (event.key === "Escape" && state.detailPlaceId) closeDetail();
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) nudgeMonth(event.key === "ArrowLeft" ? -1 : 1);
});
$("#place-search").addEventListener("input", (event) => { state.query = event.target.value; renderPlaces(); updateMarkerStyles(); });
$("#place-search").addEventListener("keydown", (event) => { if (event.key === "Enter") { const place = filteredPlaces()[0]; if (place) selectPlace(place.id, { pan: true }); } });
document.querySelectorAll("[data-info]").forEach((button) => button.addEventListener("click", () => { $("#info-title").textContent = button.dataset.info; $("#info-dialog").hidden = false; requestAnimationFrame(() => $("#info-dialog").classList.add("is-open")); }));
$("#info-close").addEventListener("click", () => { $("#info-dialog").classList.remove("is-open"); setTimeout(() => { $("#info-dialog").hidden = true; }, 180); });
window.addEventListener("hashchange", () => { const id = location.hash.startsWith("#place/") ? location.hash.slice(7) : null; if (id && id !== state.detailPlaceId) openDetail(id, { updateUrl: false }); else if (!id && state.detailPlaceId) closeDetail({ updateUrl: false }); });

renderMonthTrack(); renderPlaces(); setupMap(); preloadAllPhotos();
const initialPlace = location.hash.startsWith("#place/") ? location.hash.slice(7) : null;
if (initialPlace) openDetail(initialPlace, { updateUrl: false });
