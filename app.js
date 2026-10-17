(() => {
  "use strict";

  /* ---------- Pomocné ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mq = matchMedia("(max-width: 819px)");
  const isMobile = () => mq.matches;
  const canHover = matchMedia("(hover: hover)").matches;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const MONTHS_GEN = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
  const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "máj", "jún", "júl", "aug", "sep", "okt", "nov", "dec"];
  const parseDate = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const fmtDate = (s) => { const d = parseDate(s); return `${d.getDate()}. ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`; };
  const dayWord = (n) => (n === 1 ? "deň" : n >= 2 && n <= 4 ? "dni" : "dní");

  /* ---------- Ikony (jednotný štýl) ---------- */
  const P = {
    heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h2a4 4 0 0 0 3.3-1.7l5.4-7.6A4 4 0 0 1 16 7h6"/><path d="M2 6h2a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6a4 4 0 0 1-3.3-1.8l-.4-.5"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    list: '<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    edit: '<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    star: '<path d="M11.5 2.3a.5.5 0 0 1 1 0l2.3 4.7a2.1 2.1 0 0 0 1.6 1.2l5.2.7a.5.5 0 0 1 .3.9l-3.8 3.7a2.1 2.1 0 0 0-.6 1.9l.9 5.1a.5.5 0 0 1-.8.6l-4.6-2.4a2.1 2.1 0 0 0-2 0l-4.6 2.4a.5.5 0 0 1-.8-.6l.9-5.1a2.1 2.1 0 0 0-.6-1.9L2.2 9.8a.5.5 0 0 1 .3-.9l5.2-.7a2.1 2.1 0 0 0 1.6-1.2z"/>',
  };
  const ic = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const HEART_FILL = `<svg viewBox="0 0 24 24">${P.heart}</svg>`;

  /* ---------- Stav ---------- */
  // dáta prichádzajú z databázy (db.js), editor do nich zapisuje priamo
  const D = { settings: {}, memories: [], places: [] };
  const useData = (d) => { D.settings = d.settings || {}; D.memories = d.memories || []; D.places = d.places || []; };

  const App = (window.App = {
    data: D,
    srcMap: new Map(), // dočasné náhľady z editora (cesta -> blob URL)
    pickHandler: null, // editor si sem dá funkciu pri výbere bodu na mape
    editHooks: null,
    activeId: null,
  });

  const src = (p) => { const s = typeof p === "string" ? p : p && p.src; return App.srcMap.get(s) || s || ""; };
  const thumb = (p) => { if (!p) return ""; const t = typeof p === "string" ? p : p.thumb || p.src; return App.srcMap.get(t) || t; };
  const mems = () => [...D.memories].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  App.mems = mems;
  App.ic = ic;
  App.P = P;
  App.esc = esc;

  /* ---------- Mapa ----------
     Podklad: VersaTiles (zadarmo, bez registrácie). Štýl v našich farbách je uložený v map-style.json.
     Knižnica MapLibre (~1 MB) sa načíta až po tom, ako sa ukáže stránka. Dovtedy svieti
     pastelové pozadie so značkami a mapa potom plynulo nabehne. Bez WebGL sa použije OpenStreetMap. */
  const MAPLIBRE = ["vendor/maplibre-gl-5.24.0.js", "vendor/leaflet-maplibre-gl-0.1.3.js"];
  const loadScript = (url) => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  function hasWebGL() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  const mapReady = () => document.body.classList.add("map-ready");
  function addRaster() {
    document.body.classList.add("raster");
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).on("load", mapReady).addTo(map);
    setTimeout(mapReady, 1500);
  }
  /* Dvojkrokové načítanie: pri prvej návšteve sa najprv ukáže hrubá mapa (pár malých dlaždíc),
     na pozadí sa stiahne detailná a plynulo cez ňu prejde. Pri ďalších návštevách sú dlaždice
     už uložené (sw.js), takže sa rovno načíta detailná. */
  const LOW_MAXZOOM = 6;
  function glLayer(style) {
    const gl = L.maplibreGL({ style, interactive: false }).addTo(map);
    const el = gl.getContainer();
    el.style.opacity = "0";
    el.style.transition = "opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)";
    return gl;
  }
  const showGl = (gl, stage) => { gl.getContainer().style.opacity = "1"; document.body.dataset.map = stage; mapReady(); };

  async function addBaseMap() {
    if (!hasWebGL()) return addRaster();
    let style;
    try {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "vendor/maplibre-gl-5.24.0.css";
      document.head.appendChild(css);
      [style] = await Promise.all([fetch("map-style.json").then((r) => r.json()), loadScript(MAPLIBRE[0])]);
      await loadScript(MAPLIBRE[1]);
    } catch (e) { return addRaster(); }

    let lo = null, hdStarted = false;
    const startHd = () => {
      if (hdStarted) return;
      hdStarted = true;
      const hd = glLayer(style);
      const ml = hd.getMaplibreMap();
      let done = false;
      const early = lo ? 0 : setTimeout(() => showGl(hd, "hd-partial"), 1200); // bez náhľadu ukázať aj neúplnú
      ml.once("load", () => {
        done = true;
        clearTimeout(early);
        showGl(hd, "hd");
        if (lo) setTimeout(() => { map.removeLayer(lo); lo = null; }, 900);
      });
      ml.on("error", (e) => {
        console.warn(e && e.error);
        if (!done && !lo && !ml.isStyleLoaded()) { done = true; clearTimeout(early); map.removeLayer(hd); addRaster(); }
      });
    };

    const returning = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    if (returning) return startHd();
    const low = JSON.parse(JSON.stringify(style));
    for (const k in low.sources) low.sources[k].maxzoom = Math.min(low.sources[k].maxzoom || 14, LOW_MAXZOOM);
    lo = glLayer(low);
    const lml = lo.getMaplibreMap();
    lml.once("load", () => { if (!hdStarted || document.body.dataset.map !== "hd") showGl(lo, "low"); startHd(); });
    lml.on("error", (e) => console.warn(e && e.error));
    setTimeout(startHd, 5000); // keby náhľad trval priveľmi dlho
  }

  const map = L.map("map", { zoomControl: false, worldCopyJump: true, zoomSnap: 0.25, minZoom: 2, maxZoom: 19 }).setView([48.7, 19.5], 7);
  App.map = map;
  const zoomCtl = L.control.zoom({ position: "bottomright" });
  const syncZoomCtl = () => (isMobile() ? zoomCtl.remove() : zoomCtl.addTo(map));
  syncZoomCtl();
  mq.addEventListener("change", syncZoomCtl);

  /* Zhlukovanie: blízke spomienky sa spoja do jednej dlaždice s koláží 2–4 fotiek
     (pri viac ako 4 je na poslednom políčku „+N“). Pri priblížení sa rozídu na samostatné fotky. */
  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 62,
    spiderfyOnMaxZoom: true,
    spiderfyDistanceMultiplier: 2.4,
    spiderLegPolylineOptions: { weight: 2, color: "#ff8fab", opacity: 0.8 },
    iconCreateFunction: clusterIcon,
  });
  map.addLayer(cluster);
  const placeLayer = L.layerGroup().addTo(map);
  const memMarkers = new Map();
  const placeMarkers = new Map();

  const photoCell = (m) => {
    const t = thumb(m && m.photos && m.photos[0]);
    return t ? `<i style="background-image:url('${esc(t)}')"></i>` : `<i class="empty">${HEART_FILL}</i>`;
  };
  const memIcon = (m, extra) =>
    L.divIcon({
      className: "mpin-wrap",
      iconSize: [54, 62],
      iconAnchor: [27, 61],
      html: `<div class="mpin${m.id === App.activeId ? " is-active" : ""}${extra ? " " + extra : ""}">${photoCell(m)}</div>`,
    });
  App.memIcon = (m) => memIcon(m, "is-draft");
  function clusterIcon(c) {
    const ms = c.getAllChildMarkers()
      .map((mk) => D.memories.find((x) => x.id === mk.options.memId))
      .filter(Boolean)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const n = ms.length;
    const cells = ms.slice(0, 4).map(photoCell);
    if (n > 4) cells[3] = cells[3].replace("<i", '<i data-more="+' + (n - 3) + '"');
    const active = ms.some((m) => m.id === App.activeId);
    return L.divIcon({
      className: "mcl-wrap",
      iconSize: [64, 72],
      iconAnchor: [32, 71],
      html: `<div class="mcl n${Math.min(n, 4)}${active ? " is-active" : ""}" aria-label="${n} spomienky"><div class="mcl-grid">${cells.join("")}</div></div>`,
    });
  }

  const pinSvg = (kind, draft) =>
    `<svg class="ppin ppin-${kind}${draft ? " ppin-draft" : ""}" viewBox="0 0 40 52"><path d="M20 50.5S3.5 31.5 3.5 19.5a16.5 16.5 0 0 1 33 0C36.5 31.5 20 50.5 20 50.5Z" fill="currentColor" stroke="#fff" stroke-width="2.5"/>` +
    (kind === "wish"
      ? `<path fill="#fff" transform="translate(11.5 10.5) scale(.71)" d="${P.star.match(/d="([^"]+)"/)[1]}"/>`
      : `<path fill="#fff" d="M20 27.5s-8-4.8-8-10.4c0-2.4 1.9-4.3 4.2-4.3 1.6 0 3 .9 3.8 2.3.8-1.4 2.2-2.3 3.8-2.3 2.3 0 4.2 1.9 4.2 4.3 0 5.6-8 10.4-8 10.4z"/>`) +
    `</svg>`;
  const placeIcon = (kind, draft) => L.divIcon({ className: "ppin-wrap", iconSize: [40, 52], iconAnchor: [20, 50], popupAnchor: [0, -46], html: pinSvg(kind, draft) });
  App.placeIcon = placeIcon;
  // editor: upravovaná vec sa na mape skryje a namiesto nej je jej zelená, posúvateľná verzia
  App.hiddenId = null;
  App.setHidden = (id) => { if (App.hiddenId !== id) { App.hiddenId = id; renderMarkers(); } };

  function renderMarkers() {
    cluster.clearLayers();
    memMarkers.clear();
    for (const m of D.memories) {
      if (!isFinite(m.lat) || !isFinite(m.lng) || m.id === App.hiddenId) continue;
      const mk = L.marker([m.lat, m.lng], { icon: memIcon(m), memId: m.id, riseOnHover: true, keyboard: true, title: m.title || "", zIndexOffset: m.id === App.activeId ? 1000 : 0 });
      mk.on("click", (e) => { hearts(e.originalEvent); goTo(m.id); });
      mk.on("add", () => syncMarker(mk)); // značka sa znova objaví po rozdelení zhluku
      memMarkers.set(m.id, mk);
      cluster.addLayer(mk);
    }
    placeLayer.clearLayers();
    placeMarkers.clear();
    for (const p of D.places) {
      if (!isFinite(p.lat) || !isFinite(p.lng) || p.id === App.hiddenId) continue;
      const mk = L.marker([p.lat, p.lng], { icon: placeIcon(p.kind === "wish" ? "wish" : "fav"), riseOnHover: true, title: p.name || "" });
      mk.bindPopup(() => placePopup(p), { className: "love-popup", closeButton: false, maxWidth: 260, autoPanPaddingTopLeft: [20, 90], autoPanPaddingBottomRight: [20, 110] });
      mk.on("popupopen", () => { setListActive("p", p.id); if (isMobile()) closePanel(); });
      placeMarkers.set(p.id, mk);
      placeLayer.addLayer(mk);
    }
  }

  function placePopup(p) {
    const wish = p.kind === "wish";
    const el = document.createElement("div");
    el.className = wish ? "pp wish" : "pp";
    el.innerHTML =
      `<div class="pp-top"><div class="pp-kind${wish ? " wish" : ""}"><svg viewBox="0 0 24 24">${wish ? P.star : P.heart}</svg>${wish ? "Chceme ísť" : "Obľúbené miesto"}</div>` +
      `<button class="pp-close" aria-label="Zavrieť">${ic("x")}</button></div>` +
      `<div class="pp-name">${esc(p.name)}</div>` +
      (p.note ? `<p class="pp-note">${esc(p.note)}</p>` : "");
    el.querySelector(".pp-close").addEventListener("click", () => { buzz(); map.closePopup(); });
    if (App.editHooks) {
      const row = document.createElement("div");
      row.className = "pp-edit";
      row.innerHTML = `<button class="btn" data-a="edit">${ic("edit")}Upraviť</button><button class="btn danger" data-a="del">${ic("trash")}Zmazať</button>`;
      row.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]")?.dataset.a;
        if (a === "edit") App.editHooks.editPlace(p.id);
        if (a === "del") App.editHooks.deletePlace(p.id);
      });
      el.appendChild(row);
    }
    return el;
  }

  /* ---------- Hlavička + počítadlo ----------
     Každých pár sekúnd sa plynulo prepne: dni → týždne → mesiace → roky → všetko dokopy. */
  const pl = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
  const addMonths = (dt, k) => {
    const t = new Date(dt.getFullYear(), dt.getMonth() + k, 1);
    t.setDate(Math.min(dt.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
    return t;
  };
  function together() {
    if (!D.settings.together) return null;
    const start = parseDate(D.settings.together);
    const n = new Date();
    const now = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    if (isNaN(start) || start > now) return null;
    const days = Math.round((now - start) / 864e5);
    let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    while (months > 0 && addMonths(start, months) > now) months--;
    const rest = Math.round((now - addMonths(start, months)) / 864e5);
    return { days, weeks: Math.floor(days / 7), months, years: Math.floor(months / 12), mo: months % 12, rest };
  }
  function counterTexts() {
    const t = together();
    if (!t) return null;
    const y = `<b>${t.years}</b> ${pl(t.years, "rok", "roky", "rokov")}`;
    return [
      `spolu už <b>${t.days.toLocaleString("sk")}</b> ${pl(t.days, "deň", "dni", "dní")} ♥`,
      `spolu už <b>${t.weeks.toLocaleString("sk")}</b> ${pl(t.weeks, "týždeň", "týždne", "týždňov")} ♥`,
      `spolu už <b>${t.months}</b> ${pl(t.months, "mesiac", "mesiace", "mesiacov")} ♥`,
      `spolu už ${y} ♥`,
      `${y}, <b>${t.mo}</b> ${pl(t.mo, "mesiac", "mesiace", "mesiacov")} a <b>${t.rest}</b> ${pl(t.rest, "deň", "dni", "dní")} ♥`,
    ];
  }
  const counter = $("#counter");
  const COUNTER_MS = 3800;
  let cntIdx = 0, cntCur = null, cntTimer = null;
  function showCounter(html, animate) {
    const el = document.createElement("span");
    el.className = "cnt";
    el.innerHTML = html;
    if (!animate || !cntCur) { counter.replaceChildren(el); cntCur = el; return; }
    const old = cntCur;
    cntCur = el;
    el.classList.add("cnt-in");
    counter.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.remove("cnt-in"); old.classList.add("cnt-out"); }));
    setTimeout(() => old.remove(), 800);
  }
  function nextCounter() {
    const t = counterTexts();
    if (!t) return;
    cntIdx = (cntIdx + 1) % t.length;
    showCounter(t[cntIdx], true);
  }
  function restartCounter() { clearInterval(cntTimer); cntTimer = setInterval(nextCounter, COUNTER_MS); }
  counter.addEventListener("click", () => { buzz(); nextCounter(); restartCounter(); });

  function renderHeader() {
    const s = D.settings;
    $("#title").textContent = s.title || "Naša mapa";
    document.title = s.title ? `${s.title} ♥` : "Naša mapa";
    const t = counterTexts();
    if (t) {
      cntIdx %= t.length;
      showCounter(t[cntIdx], false);
      if (!cntTimer) restartCounter();
    } else {
      clearInterval(cntTimer);
      cntTimer = null;
      const n = D.memories.length;
      showCounter(`<b>${n}</b> ${pl(n, "spoločná spomienka", "spoločné spomienky", "spoločných spomienok")}`, false);
    }
  }

  /* ---------- Panel so zoznamom ---------- */
  let tab = store.get("tab") || "memories";
  const pluralSpom = (n) => (n === 1 ? "spomienka" : n >= 2 && n <= 4 ? "spomienky" : "spomienok");
  const pluralMiest = (n) => (n === 1 ? "miesto" : n >= 2 && n <= 4 ? "miesta" : "miest");

  function km() {
    const ms = mems().filter((m) => isFinite(m.lat));
    let d = 0;
    for (let i = 1; i < ms.length; i++) d += map.distance([ms[i - 1].lat, ms[i - 1].lng], [ms[i].lat, ms[i].lng]);
    return Math.round(d / 1000);
  }

  function renderPanel() {
    const fav = D.places.filter((p) => p.kind !== "wish");
    const wish = D.places.filter((p) => p.kind === "wish");
    $("#cntMem").textContent = D.memories.length;
    $("#cntFav").textContent = fav.length;
    $("#cntWish").textContent = wish.length;
    $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tab));
    moveInk();

    const ul = $("#list");
    let html = "";
    if (tab === "memories") {
      const ms = mems().reverse();
      html = ms.length
        ? ms.map((m) => `<li><button class="list-item${m.id === App.activeId ? " is-active" : ""}" data-m="${esc(m.id)}"><span class="li-thumb" style="background-image:url('${esc(thumb(m.photos && m.photos[0]))}')"></span><span class="li-main"><div class="li-title">${esc(m.title || "Bez názvu")}</div><div class="li-sub">${esc(fmtDate(m.date))}${m.place ? " · " + esc(m.place) : ""}</div></span></button></li>`).join("")
        : `<li class="list-empty">${ic("heart")}<br>Zatiaľ tu nie sú žiadne spomienky.</li>`;
    } else {
      const arr = tab === "wish" ? wish : fav;
      html = arr.length
        ? arr.map((p) => `<li><button class="list-item" data-p="${esc(p.id)}"><span class="li-ico${p.kind === "wish" ? " wish" : ""}"><svg viewBox="0 0 24 24">${p.kind === "wish" ? P.star : P.heart}</svg></span><span class="li-main"><div class="li-title">${esc(p.name)}</div>${p.note ? `<div class="li-sub">${esc(p.note)}</div>` : ""}</span></button></li>`).join("")
        : `<li class="list-empty">${ic(tab === "wish" ? "star" : "heart")}<br>${tab === "wish" ? "Sem patria miesta, kam sa spolu chystáme." : "Sem patria miesta, kam radi chodíme."}</li>`;
    }
    ul.innerHTML = html;

    const n = D.memories.length, k = km();
    const placesCount = new Set(D.memories.map((m) => m.place || `${m.lat},${m.lng}`)).size;
    $("#stats").innerHTML =
      `<span>${ic("heart")}<b>${n}</b> ${pluralSpom(n)}</span>` +
      `<span>${ic("pin")}<b>${placesCount}</b> ${pluralMiest(placesCount)}</span>` +
      (k > 0 ? `<span>${ic("route")}<b>~${k.toLocaleString("sk")}</b> km spolu</span>` : "");
  }

  function moveInk() {
    const t = $(`.tab[data-tab="${tab}"]`);
    const ink = $("#tabInk");
    if (!t || !t.offsetWidth) return;
    ink.style.width = t.offsetWidth + "px";
    ink.style.transform = `translateX(${t.offsetLeft - 8}px)`;
  }

  function setListActive(kind, id) {
    $$(".list-item").forEach((b) => b.classList.toggle("is-active", (kind === "m" && b.dataset.m === id) || (kind === "p" && b.dataset.p === id)));
  }

  $(".tabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    tab = t.dataset.tab;
    store.set("tab", tab);
    buzz();
    renderPanel();
  });

  $("#list").addEventListener("click", (e) => {
    const b = e.target.closest(".list-item");
    if (!b) return;
    buzz();
    if (b.dataset.m) {
      if (isMobile()) closePanel();
      goTo(b.dataset.m);
    } else if (b.dataset.p) {
      stopStory();
      if (isMobile()) closePanel();
      openPlace(b.dataset.p);
    }
  });

  function openPlace(id) {
    const p = D.places.find((x) => x.id === id);
    const mk = placeMarkers.get(id);
    if (!p || !mk) return;
    closeDetail();
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), p.zoom || 13), { duration: 1.1 });
    map.once("moveend", () => mk.openPopup());
  }
  App.openPlace = openPlace;

  // mobilný sheet so zoznamom
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  document.body.appendChild(backdrop);
  const openPanel = () => { closeDetail(); document.body.classList.add("panel-open"); requestAnimationFrame(moveInk); };
  const closePanel = () => document.body.classList.remove("panel-open");
  backdrop.addEventListener("click", closePanel);
  sheetDrag($("#panel"), $("#panel .sheet-handle"), closePanel);

  /* ---------- Časová os ---------- */
  const track = $("#tlTrack");
  const tip = $("#tlTip");
  let tipTimer;

  function renderTimeline() {
    const ms = mems();
    if (!ms.length) { track.innerHTML = `<div class="tl-empty">Tu sa objavia vaše stretká ♥</div>`; return; }
    let prev = null, prevMonth = null, prevYear = null, html = "";
    for (const m of ms) {
      const d = parseDate(m.date);
      let gap = 0;
      if (prev) { const days = (d - prev) / 864e5; gap = Math.min(64, 4 + Math.sqrt(days) * 6); }
      const mk = d.getFullYear() * 12 + d.getMonth();
      let label = "";
      if (mk !== prevMonth) {
        label = `<span class="tl-month">${MONTHS_SHORT[d.getMonth()]}${prevYear !== d.getFullYear() ? ` <b>${d.getFullYear()}</b>` : ""}</span>`;
        prevYear = d.getFullYear();
      }
      prevMonth = mk;
      prev = d;
      html += `<button class="tl-pill${m.id === App.activeId ? " is-active" : ""}" style="margin-left:${gap.toFixed(1)}px" data-id="${esc(m.id)}" aria-label="${esc(fmtDate(m.date) + " – " + (m.title || ""))}"><i></i>${label}</button>`;
    }
    track.innerHTML = `<div class="tl-line">${html}</div>`;
  }

  function showTip(pill, autoHide) {
    const m = D.memories.find((x) => x.id === pill.dataset.id);
    if (!m) return;
    tip.querySelector("b").textContent = fmtDate(m.date);
    tip.querySelector("span").textContent = m.title || "";
    const nav = $("#timeline").getBoundingClientRect();
    const r = pill.getBoundingClientRect();
    let x = r.left + r.width / 2 - nav.left;
    const half = Math.min(130, tip.offsetWidth / 2 || 80);
    x = Math.max(half - 6, Math.min(nav.width - half + 6, x));
    tip.style.left = x + "px";
    tip.classList.add("is-on");
    clearTimeout(tipTimer);
    if (autoHide) tipTimer = setTimeout(hideTip, 1600);
  }
  const hideTip = () => tip.classList.remove("is-on");

  track.addEventListener("pointerover", (e) => {
    const p = e.target.closest(".tl-pill");
    if (p && e.pointerType === "mouse") showTip(p);
  });
  track.addEventListener("pointerout", (e) => {
    if (e.pointerType === "mouse" && e.target.closest(".tl-pill") && !e.relatedTarget?.closest?.(".tl-pill")) hideTip();
  });
  track.addEventListener("focusin", (e) => { const p = e.target.closest(".tl-pill"); if (p) showTip(p); });
  track.addEventListener("focusout", hideTip);
  track.addEventListener("scroll", hideTip, { passive: true });
  track.addEventListener("click", (e) => {
    const p = e.target.closest(".tl-pill");
    if (!p) return;
    buzz(10);
    if (!canHover) showTip(p, true);
    goTo(p.dataset.id);
  });
  // koliesko myši posúva os do strán
  track.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { track.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });

  function syncTimelineActive() {
    $$(".tl-pill", track).forEach((p) => p.classList.toggle("is-active", p.dataset.id === App.activeId));
    const a = $(".tl-pill.is-active", track);
    if (a) {
      const tr = track.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (r.left < tr.left + 40 || r.right > tr.right - 40) track.scrollLeft += r.left - tr.left - tr.width / 2 + r.width / 2;
    }
  }

  /* ---------- Detail spomienky ---------- */
  const detail = $("#detail");
  const galTrack = $("#galTrack");
  let galIdx = 0, galProg = false, galProgT, galScrollT;
  const curMem = () => D.memories.find((x) => x.id === App.activeId);

  function renderDetail(m) {
    const ms = mems();
    const idx = ms.findIndex((x) => x.id === m.id);
    $("#dDate").innerHTML = m.date ? `${ic("cal")}${esc(fmtDate(m.date))}` : "";
    $("#dPlace").innerHTML = m.place ? `${ic("pin")}${esc(m.place)}` : "";
    $("#dTitle").textContent = m.title || "";
    $("#dText").textContent = m.text || "";
    $("#dPos").textContent = `${idx + 1} / ${ms.length}`;
    $("#dPrev").disabled = idx <= 0;
    $("#dNext").disabled = idx >= ms.length - 1;
    renderGallery(m);
    const ed = $("#dEdit");
    ed.innerHTML = App.editHooks ? `<button class="btn" data-a="edit">${ic("edit")}Upraviť</button><button class="btn danger" data-a="del">${ic("trash")}Zmazať</button>` : "";
    $(".detail-scroll").scrollTop = 0;
  }

  // Galéria: fotky vedľa seba, na mobile sa posúvajú prstom (scroll-snap), na PC šípkami.
  function renderGallery(m) {
    const photos = m.photos || [];
    $("#gallery").hidden = !photos.length;
    detail.classList.toggle("no-photo", !photos.length);
    galTrack.innerHTML = photos
      .map((p, i) => `<button class="gal-slide" data-i="${i}" aria-label="Zväčšiť fotku ${i + 1}"><img src="${esc(src(p))}" alt="${esc(m.title || "")}" decoding="async"${i > 1 ? ' loading="lazy"' : ""}></button>`)
      .join("");
    $$("img", galTrack).forEach((img) => {
      if (img.complete) img.classList.add("ok");
      else img.onload = img.onerror = () => img.classList.add("ok");
    });
    $("#galThumbs").innerHTML = photos.length > 1 ? photos.map((p, i) => `<button class="gal-thumb" data-i="${i}" style="background-image:url('${esc(thumb(p))}')" aria-label="Fotka ${i + 1}"></button>`).join("") : "";
    $("#galDots").innerHTML = photos.length > 1 ? photos.map(() => "<i></i>").join("") : "";
    $("#galZoom").innerHTML = `${ic("zoom")}Zväčšiť`;
    $("#galMain").classList.toggle("multi", photos.length > 1);
    galIdx = 0;
    galTrack.scrollLeft = 0;
    syncGal();
  }

  function syncGal() {
    const n = galTrack.children.length;
    $$(".gal-thumb").forEach((t) => t.classList.toggle("is-active", +t.dataset.i === galIdx));
    [...$("#galDots").children].forEach((d, i) => d.classList.toggle("on", i === galIdx));
    $("#galPrev").disabled = galIdx <= 0;
    $("#galNext").disabled = galIdx >= n - 1;
  }

  function setGal(i, smooth = true) {
    const n = galTrack.children.length;
    if (!n) return;
    galIdx = Math.max(0, Math.min(n - 1, i));
    galProg = true;
    clearTimeout(galProgT);
    galProgT = setTimeout(() => (galProg = false), 900);
    galTrack.scrollTo({ left: galIdx * galTrack.clientWidth, behavior: smooth && !reduceMotion() ? "smooth" : "auto" });
    syncGal();
  }

  galTrack.addEventListener("scroll", () => {
    const i = Math.round(galTrack.scrollLeft / Math.max(1, galTrack.clientWidth));
    if (!galProg && i !== galIdx) { galIdx = i; syncGal(); buzz(6); storyPhotoChanged(i); }
    clearTimeout(galScrollT);
    galScrollT = setTimeout(() => (galProg = false), 160);
  }, { passive: true });

  $("#galPrev").addEventListener("click", () => { buzz(); setGal(galIdx - 1); storyPhotoChanged(galIdx); });
  $("#galNext").addEventListener("click", () => { buzz(); setGal(galIdx + 1); storyPhotoChanged(galIdx); });
  $("#galThumbs").addEventListener("click", (e) => { const t = e.target.closest(".gal-thumb"); if (t) { buzz(); setGal(+t.dataset.i); storyPhotoChanged(galIdx); } });
  galTrack.addEventListener("click", (e) => {
    const sl = e.target.closest(".gal-slide");
    const m = curMem();
    if (sl && m && m.photos && m.photos.length) openLightbox(m.photos.map(src), +sl.dataset.i);
  });
  $("#dEdit").addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (!a || !App.editHooks) return;
    if (a === "edit") App.editHooks.editMemory(App.activeId);
    if (a === "del") App.editHooks.deleteMemory(App.activeId);
  });

  // počas príbehu skoky (šípky, časová os, značky) pokračujú v prehrávaní od zvolenej spomienky
  function goTo(id) {
    if (ST.on) {
      const i = mems().findIndex((m) => m.id === id);
      if (i >= 0) { storyGo(i); return; }
    }
    openMemory(id);
  }
  function step(dir) {
    const ms = mems();
    const idx = ms.findIndex((x) => x.id === App.activeId);
    const n = ms[idx + dir];
    if (n) { buzz(); goTo(n.id); }
  }
  $("#dPrev").addEventListener("click", () => step(-1));
  $("#dNext").addEventListener("click", () => step(1));
  $("#detailClose").addEventListener("click", () => { stopStory(); closeDetail(); });

  // aktívnu značku iba prefarbíme (bez prekreslenia), aby neblikala
  function syncMarker(mk) {
    const on = mk.options.memId === App.activeId;
    const el = mk.getElement && mk.getElement();
    if (el && el.firstElementChild) el.firstElementChild.classList.toggle("is-active", on);
  }
  function setActiveMarker(id) {
    for (const mk of memMarkers.values()) {
      const want = mk.options.memId === id;
      if (mk._wasActive !== want) { mk.setZIndexOffset(want ? 1000 : 0); mk._wasActive = want; }
      syncMarker(mk);
    }
    cluster.refreshClusters();
  }

  function openMemory(id, opts = {}) {
    const m = D.memories.find((x) => x.id === id);
    if (!m) return;
    map.closePopup();
    App.activeId = id;
    renderDetail(m);
    document.body.classList.add("detail-open");
    detail.setAttribute("aria-hidden", "false");
    detail.style.removeProperty("--drag");
    setActiveMarker(id);
    setListActive("m", id);
    syncTimelineActive();
    try { history.replaceState(null, "", location.pathname + location.search + "#" + encodeURIComponent(id)); } catch (e) {}
    if (opts.fly !== false) requestAnimationFrame(() => flyTo(m, opts.onArrive));
  }
  App.openMemory = openMemory;

  function closeDetail() {
    if (!App.activeId) return;
    App.activeId = null;
    document.body.classList.remove("detail-open");
    detail.setAttribute("aria-hidden", "true");
    setActiveMarker(null);
    setListActive("m", null);
    syncTimelineActive();
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  App.closeDetail = closeDetail;

  // Posun stredu mapy tak, aby značka nebola schovaná pod panelmi.
  function visibleOffset() {
    const W = innerWidth, H = innerHeight;
    const PIN = 34; // značka trčí nad bodom, tak ju vycentrujeme celú
    if (isMobile()) {
      const dh = detail.offsetHeight || H * 0.6;
      const top = $(".topbar").getBoundingClientRect().bottom + 8, bottom = H - dh;
      return L.point(0, H / 2 - (top + Math.max(bottom, top + 120)) / 2 - PIN);
    }
    const left = $("#panel").getBoundingClientRect().right;
    const right = W - detail.offsetWidth - 16;
    const tlTop = $("#timeline").getBoundingClientRect().top;
    return L.point(W / 2 - (left + right) / 2, H / 2 - tlTop / 2 - PIN);
  }

  function flyTo(m, onArrive) {
    const mk = memMarkers.get(m.id);
    const z = Math.max(m.zoom || 14, 3);
    const off = visibleOffset();
    const center = map.unproject(map.project([m.lat, m.lng], z).add(off), z);
    let done = false, safety = 0;
    const arrive = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (mk && !mk._icon && cluster.hasLayer(mk)) {
        const parent = cluster.getVisibleParent(mk);
        if (parent && parent.spiderfy) parent.spiderfy();
      }
      onArrive && onArrive();
    };
    // už sme na mieste: nelietať (flyTo na ten istý bod by sa zbytočne „zavlnilo“)
    if (Math.abs(map.getZoom() - z) < 0.01 && map.latLngToContainerPoint(center).distanceTo(map.latLngToContainerPoint(map.getCenter())) < 3) {
      arrive();
      return;
    }
    const far = map.distance(map.getCenter(), [m.lat, m.lng]) > 200000;
    const dur = far ? 1.8 : 1.1;
    map.flyTo(center, z, { duration: dur, easeLinearity: 0.2 });
    map.once("moveend", arrive);
    safety = setTimeout(arrive, dur * 1000 + 900);
  }

  // potiahnutie sheetu dole zavrie (mobil)
  sheetDrag(detail, $("#detailHandle"), closeDetail);
  function sheetDrag(sheet, handle, onClose) {
    let y0 = null, dy = 0;
    handle.addEventListener("pointerdown", (e) => { y0 = e.clientY; dy = 0; sheet.classList.add("dragging"); handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointermove", (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.clientY - y0);
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (y0 === null) return;
      y0 = null;
      sheet.classList.remove("dragging");
      sheet.style.transform = "";
      if (dy > 90) { buzz(); onClose(); }
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  map.on("click", (e) => {
    if (App.pickHandler) { App.pickHandler(e.latlng); return; }
    if (App.onMapClick && App.onMapClick()) return; // otvorený editor sa zavrie
    // počas prehrávania prvý ťuk do mapy iba pozastaví, ďalší zavrie
    if (ST.on && !ST.paused) { storyPause(); toast("Pozastavené ⏸", 1400); return; }
    stopStory();
    closeDetail();
    closePanel();
  });

  /* ---------- Akčné tlačidlá ---------- */
  $("#listBtn").innerHTML = ic("list");
  $("#randomBtn").innerHTML = ic("shuffle");
  $("#fitBtn").innerHTML = ic("fit");
  $("#detailClose").innerHTML = ic("x");
  $("#dPrev").innerHTML = `${ic("left")}Predošlá`;
  $("#dNext").innerHTML = `Ďalšia${ic("right")}`;
  $("#lbClose").innerHTML = ic("x");
  $("#lbPrev").innerHTML = ic("left");
  $("#lbNext").innerHTML = ic("right");
  $("#galPrev").innerHTML = ic("left");
  $("#galNext").innerHTML = ic("right");

  $("#listBtn").addEventListener("click", () => { buzz(); document.body.classList.contains("panel-open") ? closePanel() : openPanel(); });
  $("#randomBtn").addEventListener("click", (e) => {
    const ms = D.memories.filter((m) => m.id !== App.activeId);
    if (!ms.length) return;
    buzz(12);
    hearts(e);
    stopStory();
    openMemory(ms[Math.floor(Math.random() * ms.length)].id);
  });
  $("#fitBtn").addEventListener("click", () => { buzz(); stopStory(); closeDetail(); fitAll(true, "all"); });

  // "ours" = spomienky + obľúbené (pri štarte, aby sa načítalo hlavne Slovensko), "all" = aj miesta kam chceme ísť
  function fitAll(animate = true, scope = "ours") {
    let items = scope === "all" ? [...D.memories, ...D.places] : [...D.memories, ...D.places.filter((p) => p.kind !== "wish")];
    if (!items.some((x) => isFinite(x.lat))) items = [...D.memories, ...D.places];
    const pts = items.filter((x) => isFinite(x.lat)).map((x) => [x.lat, x.lng]);
    if (!pts.length) return;
    const mob = isMobile();
    const opts = {
      paddingTopLeft: mob ? [40, 110] : [$("#panel").getBoundingClientRect().right + 40, 70],
      paddingBottomRight: mob ? [40, 110] : [90, 130],
      maxZoom: 13,
      animate,
      duration: 1.2,
    };
    animate ? map.flyToBounds(pts, opts) : map.fitBounds(pts, opts);
  }
  App.fitAll = fitAll;

  /* ---------- Náš príbeh (automatické prehrávanie) ----------
     Mapa preletí na spomienku, potom sa ukáže každá jej fotka na 3,5 s, potom ďalšia spomienka.
     Pauza funguje kedykoľvek, aj počas letu mapy. Po pokračovaní sa dokončí let a ide sa ďalej. */
  const PHOTO_MS = 3500;
  const ST = { on: false, paused: false, i: 0, p: 0, phase: "travel", t: 0, tok: 0, raf: 0, last: 0, lbResume: false };
  const playBtn = $("#playBtn");
  const storyBar = $("#storyBar");
  const storyMem = () => mems()[ST.i];

  function storyUI() {
    const playing = ST.on && !ST.paused;
    $("#playIco").innerHTML = ic(playing ? "pause" : "play");
    playBtn.classList.toggle("is-playing", playing);
    playBtn.classList.toggle("is-paused", ST.on && ST.paused);
    playBtn.setAttribute("aria-label", playing ? "Pozastaviť" : ST.on ? "Pokračovať" : "Prehrať náš príbeh");
    $("#storyPP").innerHTML = ic(playing ? "pause" : "play");
    $("#storyPP").setAttribute("aria-label", playing ? "Pozastaviť" : "Pokračovať");
    document.body.classList.toggle("story-on", ST.on);
    document.body.classList.toggle("story-paused", ST.on && ST.paused);
  }
  function renderSegs() {
    const m = storyMem();
    const n = ST.on && m && m.photos ? m.photos.length : 0;
    storyBar.innerHTML = n ? "<span><i></i></span>".repeat(n) : "";
    paintSegs();
  }
  function paintSegs() {
    const segs = storyBar.children;
    for (let k = 0; k < segs.length; k++) {
      const w = k < ST.p ? 1 : k > ST.p || ST.phase !== "photo" ? 0 : Math.min(1, ST.t / PHOTO_MS);
      segs[k].firstChild.style.transform = `scaleX(${w})`;
    }
  }
  function storyGo(i) {
    const ms = mems();
    if (i >= ms.length) { storyStop(); toast("Koniec… zatiaľ ♥"); return; }
    ST.i = Math.max(0, i);
    ST.p = 0;
    ST.t = 0;
    ST.phase = "travel";
    const tok = ++ST.tok;
    openMemory(ms[ST.i].id, { onArrive: () => arrive(tok) });
    renderSegs();
  }
  function arrive(tok) {
    if (tok !== ST.tok || !ST.on) return;
    ST.phase = "photo";
    ST.t = 0;
  }
  function tick(now) {
    if (!ST.on) return;
    const dt = ST.last ? Math.min(100, now - ST.last) : 0;
    ST.last = now;
    if (!ST.paused && ST.phase === "photo") {
      ST.t += dt;
      if (ST.t >= PHOTO_MS) {
        const n = (storyMem()?.photos || []).length;
        if (ST.p + 1 < n) { ST.p++; ST.t = 0; setGal(ST.p); }
        else storyGo(ST.i + 1);
      }
      paintSegs();
    }
    ST.raf = requestAnimationFrame(tick);
  }
  function storyStart(i) {
    ST.on = true;
    ST.paused = false;
    ST.last = 0;
    storyUI();
    storyGo(i);
    cancelAnimationFrame(ST.raf);
    ST.raf = requestAnimationFrame(tick);
  }
  function storyPause() {
    if (!ST.on || ST.paused) return;
    ST.paused = true;
    if (ST.phase === "travel") { ST.tok++; map.stop(); } // zastaví aj rozlietanú mapu
    storyUI();
  }
  function storyResume() {
    if (!ST.on || !ST.paused) return;
    ST.paused = false;
    ST.last = 0;
    if (ST.phase === "travel") {
      const tok = ++ST.tok;
      const m = storyMem();
      if (m) flyTo(m, () => arrive(tok));
    }
    storyUI();
  }
  function storyToggle() { ST.on ? (ST.paused ? storyResume() : storyPause()) : null; }
  function storyStop() {
    if (!ST.on) return;
    ST.on = false;
    ST.paused = false;
    ST.tok++;
    cancelAnimationFrame(ST.raf);
    renderSegs();
    storyUI();
  }
  function stopStory() { storyStop(); }
  // ručné posunutie fotky počas príbehu: pokračuje sa od nej
  function storyPhotoChanged(i) {
    if (!ST.on || ST.phase !== "photo") return;
    ST.p = i;
    ST.t = 0;
    paintSegs();
  }

  playBtn.addEventListener("click", (e) => {
    buzz(12);
    if (ST.on) { storyToggle(); return; }
    if (!D.memories.length) return;
    hearts(e);
    const ms = mems();
    const cur = ms.findIndex((m) => m.id === App.activeId);
    storyStart(cur >= 0 && cur < ms.length - 1 ? cur : 0);
  });
  $("#storyPP").addEventListener("click", () => { buzz(); storyToggle(); });
  $("#storyResume").addEventListener("click", (e) => { e.stopPropagation(); buzz(); storyResume(); });
  $("#storyStop").addEventListener("click", () => { buzz(); storyStop(); toast("Prehrávanie zastavené", 1400); });
  $("#storyStop").innerHTML = ic("stop");
  $("#storyResume").innerHTML = ic("play");
  storyUI();

  /* ---------- Lightbox s pinch zoomom ---------- */
  const lb = $("#lightbox"), stage = $("#lbStage"), lbImg = $("#lbImg");
  const LB = { list: [], i: 0, s: 1, x: 0, y: 0 };
  const ptrs = new Map();
  let gesture = null, lastTap = 0;

  function openLightbox(list, i) {
    ST.lbResume = ST.on && !ST.paused;
    storyPause();
    LB.list = list; LB.i = i;
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lbShow();
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    ptrs.clear(); gesture = null;
    if (ST.lbResume) { ST.lbResume = false; storyPhotoChanged(galIdx); storyResume(); }
  }
  function lbShow() {
    LB.s = 1; LB.x = 0; LB.y = 0;
    lbImg.classList.remove("zoomed");
    lbImg.style.transform = "scale(0.92)";
    lbImg.src = LB.list[LB.i];
    requestAnimationFrame(() => requestAnimationFrame(() => apply()));
    $("#lbCount").textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : "";
    $("#lbPrev").style.visibility = LB.i > 0 ? "" : "hidden";
    $("#lbNext").style.visibility = LB.i < LB.list.length - 1 ? "" : "hidden";
  }
  function lbGo(d) {
    const n = LB.i + d;
    if (n < 0 || n >= LB.list.length) { apply(); return; }
    LB.i = n; buzz(); lbShow();
    setGal(n, false);
  }
  function clampPan() {
    const w = lbImg.offsetWidth * LB.s, h = lbImg.offsetHeight * LB.s;
    const mx = Math.max(0, (w - innerWidth) / 2 + 20), my = Math.max(0, (h - innerHeight) / 2 + 20);
    LB.x = Math.max(-mx, Math.min(mx, LB.x));
    LB.y = Math.max(-my, Math.min(my, LB.y));
  }
  function apply(extraX = 0) {
    lbImg.style.transform = `translate(${LB.x + extraX}px, ${LB.y}px) scale(${LB.s})`;
    lbImg.classList.toggle("zoomed", LB.s > 1.01);
  }
  // zoom okolo bodu (súradnice obrazovky)
  function zoomAt(cx, cy, ns) {
    ns = Math.max(1, Math.min(5, ns));
    const px = cx - innerWidth / 2, py = cy - innerHeight / 2;
    LB.x = px - (px - LB.x) * (ns / LB.s);
    LB.y = py - (py - LB.y) * (ns / LB.s);
    LB.s = ns;
    if (ns === 1) { LB.x = 0; LB.y = 0; }
    clampPan();
  }

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lbImg.classList.add("no-anim");
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      gesture = { type: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), s: LB.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, moved: true };
    } else if (ptrs.size === 1) {
      gesture = { type: LB.s > 1.01 ? "pan" : "swipe", sx: e.clientX, sy: e.clientY, x: LB.x, y: LB.y, t: Date.now(), moved: false, onImg: e.target === lbImg };
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId) || !gesture) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.type === "pinch" && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      zoomAt(gesture.cx, gesture.cy, gesture.s * (d / gesture.d));
      LB.x += cx - gesture.cx; LB.y += cy - gesture.cy;
      gesture.cx = cx; gesture.cy = cy; gesture.s = LB.s; gesture.d = d;
      clampPan(); apply();
    } else if (gesture.type === "pan") {
      const dx = e.clientX - gesture.sx, dy = e.clientY - gesture.sy;
      if (Math.hypot(dx, dy) > 6) gesture.moved = true;
      LB.x = gesture.x + dx; LB.y = gesture.y + dy;
      clampPan(); apply();
    } else if (gesture.type === "swipe") {
      const dx = e.clientX - gesture.sx;
      if (Math.abs(dx) > 6) gesture.moved = true;
      if (LB.list.length > 1) apply(dx * 0.9);
    }
  });
  const pointerEnd = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    lbImg.classList.remove("no-anim");
    const g = gesture;
    if (!g) return;
    if (g.type === "pinch") {
      if (ptrs.size === 1) { const [p] = [...ptrs.values()]; gesture = { type: "pan", sx: p.x, sy: p.y, x: LB.x, y: LB.y, moved: true }; }
      else gesture = null;
      if (LB.s < 1.05) { LB.s = 1; LB.x = 0; LB.y = 0; apply(); }
      return;
    }
    gesture = null;
    if (g.type === "swipe") {
      const dx = e.clientX - g.sx;
      if (g.moved && Math.abs(dx) > 60) { lbGo(dx < 0 ? 1 : -1); return; }
      apply();
    }
    if (!g.moved && e.type === "pointerup") {
      const now = Date.now();
      if (e.target === lbImg || g.onImg) {
        // dvojklik / dvojťuk = zoom
        if (now - lastTap < 320) { zoomAt(e.clientX, e.clientY, LB.s > 1.01 ? 1 : 2.5); apply(); lastTap = 0; }
        else lastTap = now;
      } else if (g.type === "swipe" || LB.s <= 1.01) {
        closeLightbox(); // ťuk mimo fotky zavrie
      } else {
        closeLightbox();
      }
    }
  };
  stage.addEventListener("pointerup", pointerEnd);
  stage.addEventListener("pointercancel", pointerEnd);
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    lbImg.classList.add("no-anim");
    zoomAt(e.clientX, e.clientY, LB.s * Math.exp(-e.deltaY * 0.0022));
    apply();
    clearTimeout(stage._wt);
    stage._wt = setTimeout(() => lbImg.classList.remove("no-anim"), 120);
  }, { passive: false });
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => lbGo(-1));
  $("#lbNext").addEventListener("click", () => lbGo(1));
  addEventListener("resize", () => { if (lb.classList.contains("is-open")) { clampPan(); apply(); } moveInk(); });

  /* ---------- Klávesnica ---------- */
  addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (lb.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lbGo(-1);
      if (e.key === "ArrowRight") lbGo(1);
      return;
    }
    if ($("#intro").classList.contains("is-open")) { if (e.key === "Escape" || e.key === "Enter") closeIntro(); return; }
    if (e.key === "Escape") { stopStory(); closeDetail(); closePanel(); }
    if (App.activeId && e.key === "ArrowLeft") step(-1);
    if (App.activeId && e.key === "ArrowRight") step(1);
    if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); playBtn.click(); }
  });

  /* ---------- Úvod ---------- */
  const intro = $("#intro");
  function openIntro() {
    $("#introTitle").textContent = D.settings.introTitle || "Ahoj ♥";
    $("#introText").textContent = D.settings.introText || "";
    intro.classList.add("is-open");
    intro.setAttribute("aria-hidden", "false");
  }
  function closeIntro() {
    intro.classList.remove("is-open");
    intro.setAttribute("aria-hidden", "true");
    store.set("introSeen", "1");
    if (!App.activeId) fitAll(true, "ours");
  }
  $("#introGo").addEventListener("click", (e) => { hearts(e, 14); buzz(15); closeIntro(); });
  intro.addEventListener("click", (e) => { if (e.target === intro) closeIntro(); });
  $("#logoBtn").addEventListener("click", (e) => { hearts(e, 10); buzz(); openIntro(); });

  /* ---------- Drobnosti ---------- */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), ms);
  }
  App.toast = toast;

  function hearts(e, n = 7) {
    if (!e || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null;
    const x = e.clientX || (r ? r.left + r.width / 2 : innerWidth / 2);
    const y = e.clientY || (r ? r.top + r.height / 2 : innerHeight / 2);
    const layer = $("#heartsLayer");
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "fly-heart";
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const dist = 50 + Math.random() * 70;
      h.style.left = x + "px";
      h.style.top = y + "px";
      h.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      h.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      h.style.setProperty("--s", (0.6 + Math.random() * 0.9).toFixed(2));
      h.style.setProperty("--r", (Math.random() * 60 - 30).toFixed(0) + "deg");
      h.style.background = ["#ff5d84", "#ff8fab", "#ffbf9b", "#9c80ff"][i % 4];
      h.style.animationDelay = i * 25 + "ms";
      layer.appendChild(h);
      setTimeout(() => h.remove(), 1300);
    }
  }
  App.hearts = hearts;

  /* ---------- Prekreslenie všetkého (aj z editora) ---------- */
  function renderAll() {
    renderHeader();
    renderMarkers();
    renderPanel();
    renderTimeline();
    if (App.activeId) {
      const m = D.memories.find((x) => x.id === App.activeId);
      if (m) { renderDetail(m); syncTimelineActive(); } else closeDetail();
    }
  }
  App.renderAll = renderAll;

  /* ---------- Štart ---------- */
  function start() {
    renderAll();
    requestAnimationFrame(moveInk);
    document.fonts && document.fonts.ready.then(moveInk);

    const hashId = decodeURIComponent(location.hash.slice(1));
    fitAll(false, "ours");
    addBaseMap(); // až po nastavení výrezu, aby sa sťahovali iba potrebné dlaždice
    if (hashId && D.memories.some((m) => m.id === hashId)) {
      setTimeout(() => openMemory(hashId), 300);
    } else if (!store.get("introSeen") && D.settings.introTitle) {
      setTimeout(openIntro, 500);
    }
  }
  // ak už stránka bola otvorená, ukáže sa hneď posledná verzia a čerstvé dáta sa doplnia,
  // pri prvej návšteve sa na ne počká (zvyčajne zlomok sekundy)
  const DB = window.DB;
  if (DB.cached) {
    useData(DB.cached);
    start();
    DB.fresh.then((d) => {
      if (DB.wrote || JSON.stringify(d) === JSON.stringify(DB.cached)) return;
      useData(d);
      renderAll();
    }, () => {});
  } else {
    DB.fresh.then(useData, () => toast("Spomienky sa nepodarilo načítať. Skontroluj internet a obnov stránku.", 6000)).then(start);
  }

  // offline cache (rýchlejšie ďalšie otvorenie): funguje na https (Netlify) a na localhoste
  if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // editor sa načíta s ?edit v adrese, cez „Upraviť mapu“ dole v paneli, alebo sám,
  // keď je v tomto prehliadači niekto prihlásený
  let editorLoading = null;
  const loadEditor = () => (editorLoading = editorLoading || loadScript("editor.js"));
  const editLink = $("#editLink");
  editLink.innerHTML = `${ic("edit")}Upraviť mapu`;
  editLink.addEventListener("click", () => {
    closePanel();
    loadEditor().then(() => App.openEditor(), () => toast("Editor sa nepodarilo načítať"));
  });
  if (new URLSearchParams(location.search).has("edit") || DB.user()) loadEditor();
})();
