/* Editor spomienok a miest. Načíta sa iba keď je v adrese ?edit */
(() => {
  "use strict";
  const App = window.App, D = App.data, ic = App.ic, P = App.P, esc = App.esc, toast = App.toast;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "editor.css";
  document.head.appendChild(css);

  const loadScript = (url) => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  const libs = {
    exifr: () => (window.exifr ? Promise.resolve() : loadScript("https://unpkg.com/exifr@7.1.3/dist/lite.umd.js")),
    zip: () => (window.JSZip ? Promise.resolve() : loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js")),
  };
  libs.exifr().catch(() => {});

  const pending = new Map(); // cesta -> Blob (nové fotky, ešte neuložené)
  let dirty = 0;
  const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------- UI ---------- */
  const fab = document.createElement("button");
  fab.className = "icon-btn ed-fab";
  fab.dataset.tip = "Editor";
  fab.setAttribute("aria-label", "Editor");
  fab.innerHTML = `${ic("edit")}<span class="ed-badge" id="edBadge"></span>`;
  $("#actions").prepend(fab);

  const ed = document.createElement("div");
  ed.className = "ed glass";
  ed.innerHTML = `
    <div class="ed-head"><h3>Editor ♥</h3><button class="icon-btn small" id="edClose" aria-label="Zavrieť">${ic("x")}</button></div>
    <div class="ed-tabs">
      <button class="ed-tab is-active" data-f="mem">Spomienka</button>
      <button class="ed-tab" data-f="place">Miesto</button>
      <button class="ed-tab" data-f="set">Nastavenia</button>
    </div>
    <div class="ed-body">
      <form class="ed-form is-active" id="fMem" autocomplete="off">
        <div class="ed-mode" id="memMode" hidden><span>Upravuješ spomienku</span><button type="button" data-reset>zrušiť</button></div>
        <label class="drop" id="drop">${ic("plus")}Pretiahni sem fotky alebo klikni
          <small>Miesto a dátum sa skúsia načítať priamo z fotky</small>
          <input type="file" accept="image/*" multiple hidden id="fileIn">
        </label>
        <div class="ph-grid" id="phGrid"></div>
        <label class="fld"><span>Názov</span><input name="title" required placeholder="napr. Prvé rande"></label>
        <div class="row2">
          <label class="fld"><span>Dátum</span><input type="date" name="date" required></label>
          <label class="fld"><span>Miesto (text)</span><input name="place" placeholder="napr. Bratislava"></label>
        </div>
        <div class="fld search"><span>Poloha na mape</span>
          <input class="q" placeholder="Hľadať miesto…" data-search="mem">
          <div class="search-res"></div>
        </div>
        <div class="loc"><span class="loc-txt" id="memLoc">Poloha zatiaľ nie je zvolená</span><button type="button" class="btn" data-pick="mem">${ic("pin")}Na mape</button></div>
        <label class="fld"><span>Čo sa vtedy stalo</span><textarea name="text" placeholder="Napíš pár viet…"></textarea></label>
        <button class="btn primary big" type="submit" id="memSubmit">${ic("heart")}Pridať spomienku</button>
      </form>

      <form class="ed-form" id="fPlace" autocomplete="off">
        <div class="ed-mode" id="placeMode" hidden><span>Upravuješ miesto</span><button type="button" data-reset>zrušiť</button></div>
        <div class="seg">
          <label><input type="radio" name="kind" value="fav" checked><span><svg viewBox="0 0 24 24">${P.heart}</svg>Obľúbené</span></label>
          <label><input type="radio" name="kind" value="wish"><span><svg viewBox="0 0 24 24">${P.star}</svg>Chceme ísť</span></label>
        </div>
        <label class="fld"><span>Názov</span><input name="name" required placeholder="napr. Naša kaviareň"></label>
        <div class="fld search"><span>Poloha na mape</span>
          <input class="q" placeholder="Hľadať miesto…" data-search="place">
          <div class="search-res"></div>
        </div>
        <div class="loc"><span class="loc-txt" id="placeLoc">Poloha zatiaľ nie je zvolená</span><button type="button" class="btn" data-pick="place">${ic("pin")}Na mape</button></div>
        <label class="fld"><span>Poznámka</span><textarea name="note" placeholder="Prečo je to miesto naše…"></textarea></label>
        <button class="btn primary big" type="submit" id="placeSubmit">${ic("pin")}Pridať miesto</button>
      </form>

      <form class="ed-form" id="fSet" autocomplete="off">
        <label class="fld"><span>Nadpis</span><input name="title" placeholder="Laura & ja"></label>
        <label class="fld"><span>Spolu od (počítadlo dní)</span><input type="date" name="together"></label>
        <label class="fld"><span>Nadpis úvodu</span><input name="introTitle"></label>
        <label class="fld"><span>Text úvodu</span><textarea name="introText"></textarea></label>
        <p class="hint">Úvod sa zobrazí iba pri prvej návšteve. Znova sa dá otvoriť kliknutím na srdiečko vľavo hore.</p>
        <button class="btn primary big" type="submit">Použiť</button>
      </form>
    </div>
    <div class="ed-foot">
      <div class="ed-status" id="edStatus">Všetko je uložené</div>
      <div class="btns">
        <button class="btn primary" id="saveDir">Uložiť do priečinka</button>
        <button class="btn" id="saveZip">Stiahnuť ZIP</button>
      </div>
    </div>`;
  document.body.appendChild(ed);
  if (!window.showDirectoryPicker) $("#saveDir").hidden = true;

  const fMem = $("#fMem"), fPlace = $("#fPlace"), fSet = $("#fSet");
  const open = () => { document.body.classList.add("ed-open"); App.closeDetail(); syncDraft(); };
  // zatvorenie editora (X alebo klik do mapy) zruší rozrobenú úpravu existujúcej veci,
  // takže zelený špendlík zmizne a pôvodný sa vráti
  const close = () => {
    document.body.classList.remove("ed-open");
    stopPick();
    if (F.place.id) resetPlace();
    if (F.mem.id) resetMem();
    syncDraft();
  };
  App.onMapClick = () => {
    if (!document.body.classList.contains("ed-open")) return false;
    close();
    return true;
  };
  fab.addEventListener("click", () => (document.body.classList.contains("ed-open") ? close() : open()));
  $("#edClose").addEventListener("click", close);

  function showForm(f) {
    $$(".ed-tab", ed).forEach((t) => t.classList.toggle("is-active", t.dataset.f === f));
    [fMem, fPlace, fSet].forEach((x) => x.classList.toggle("is-active", x.id === { mem: "fMem", place: "fPlace", set: "fSet" }[f]));
    stopPick();
    if (f === "set") fillSettings();
    syncDraft();
  }
  $(".ed-tabs", ed).addEventListener("click", (e) => { const t = e.target.closest(".ed-tab"); if (t) showForm(t.dataset.f); });

  function markDirty() {
    dirty++;
    $("#edBadge").textContent = dirty;
    const s = $("#edStatus");
    s.textContent = `${dirty} neuložen${dirty === 1 ? "á zmena" : dirty < 5 ? "é zmeny" : "ých zmien"}, nezabudni uložiť`;
    s.classList.add("dirty");
  }
  function markClean() {
    dirty = 0;
    $("#edBadge").textContent = "";
    const s = $("#edStatus");
    s.textContent = "Všetko je uložené ♥";
    s.classList.remove("dirty");
  }
  addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Výber polohy ---------- */
  const F = { mem: { id: null, photos: [], lat: null, lng: null, zoom: null }, place: { id: null, lat: null, lng: null, zoom: null } };
  let draft = null, draftKey = "", picking = null;

  /* Zelený špendlík ukazuje polohu práve upravovanej spomienky/miesta a dá sa potiahnuť.
     Pri úprave existujúcej veci nahradí jej pôvodnú značku (tá sa dočasne skryje), takže na mape
     je stále iba jedna. Vidno ho len pri otvorenom editore a pri formulári, ktorému patrí. */
  const visibleForm = () => (fMem.classList.contains("is-active") ? "mem" : fPlace.classList.contains("is-active") ? "place" : null);
  function draftIcon(which) {
    if (which === "place") return [App.placeIcon(fPlace.elements.kind.value === "wish" ? "wish" : "fav", true), "p" + fPlace.elements.kind.value];
    const cover = F.mem.photos[0];
    return [App.memIcon({ id: "_draft", photos: cover ? [cover] : [] }), "m" + (cover ? cover.src : "")];
  }
  function syncDraft() {
    const which = document.body.classList.contains("ed-open") ? visibleForm() : null;
    const st = which && F[which];
    const show = !!(st && st.lat != null);
    App.setHidden(show && st.id ? st.id : null);
    if (!show) {
      if (draft) { draft.remove(); draft = null; draftKey = ""; }
      return;
    }
    const [icon, key] = draftIcon(which);
    if (!draft) {
      draft = L.marker([st.lat, st.lng], { draggable: true, icon, zIndexOffset: 2000, title: "Potiahni na presnú polohu" }).addTo(App.map);
      draft.on("dragend", () => { const p = draft.getLatLng(); setLoc(draft._which, p.lat, p.lng, { fly: false }); });
    } else {
      draft.setLatLng([st.lat, st.lng]);
      if (key !== draftKey) draft.setIcon(icon);
    }
    draftKey = key;
    draft._which = which;
  }

  function setLoc(which, lat, lng, { fly = true, label } = {}) {
    const st = F[which];
    st.lat = +lat.toFixed(6);
    st.lng = +lng.toFixed(6);
    st.zoom = Math.round(Math.min(17, Math.max(12, App.map.getZoom() > 11 ? App.map.getZoom() : 15)));
    const el = $(which === "mem" ? "#memLoc" : "#placeLoc");
    el.textContent = label || `${st.lat.toFixed(4)}, ${st.lng.toFixed(4)}`;
    el.classList.add("ok");
    syncDraft();
    if (fly) App.map.flyTo([st.lat, st.lng], Math.max(App.map.getZoom(), 14), { duration: 0.9 });
  }
  function clearLoc(which) {
    const st = F[which];
    st.lat = st.lng = st.zoom = null;
    const el = $(which === "mem" ? "#memLoc" : "#placeLoc");
    el.textContent = "Poloha zatiaľ nie je zvolená";
    el.classList.remove("ok");
    syncDraft();
  }

  function startPick(which) {
    picking = which;
    document.body.classList.add("ed-picking");
    toast("Klikni na mapu, kde to bolo ♥", 3500);
    App.pickHandler = (ll) => {
      setLoc(which, ll.lat, ll.lng, { fly: false });
      if (which === "mem" && !fMem.elements.place.value) reverse(ll.lat, ll.lng).then((n) => { if (n && !fMem.elements.place.value) fMem.elements.place.value = n; });
      stopPick();
    };
  }
  function stopPick() {
    picking = null;
    App.pickHandler = null;
    document.body.classList.remove("ed-picking");
  }
  ed.addEventListener("click", (e) => { const b = e.target.closest("[data-pick]"); if (b) (picking ? stopPick() : startPick(b.dataset.pick)); });

  /* ---------- Hľadanie miest (OpenStreetMap Nominatim, zadarmo) ---------- */
  const NOM = "https://nominatim.openstreetmap.org";
  async function reverse(lat, lng) {
    try {
      const r = await fetch(`${NOM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=sk`).then((r) => r.json());
      const a = r.address || {};
      const spot = r.name || a.tourism || a.leisure || a.amenity || a.park || "";
      const town = a.city || a.town || a.village || a.municipality || a.county || "";
      return [spot, town].filter((x, i, arr) => x && arr.indexOf(x) === i).join(", ");
    } catch (e) { return ""; }
  }
  let searchT;
  ed.addEventListener("input", (e) => {
    const q = e.target.closest("[data-search]");
    if (!q) return;
    const res = q.nextElementSibling;
    clearTimeout(searchT);
    if (q.value.trim().length < 3) { res.classList.remove("is-on"); return; }
    searchT = setTimeout(async () => {
      try {
        const list = await fetch(`${NOM}/search?format=jsonv2&limit=5&accept-language=sk&q=${encodeURIComponent(q.value.trim())}`).then((r) => r.json());
        res.innerHTML = list.length
          ? list.map((r) => `<button type="button" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${esc(r.name || "")}">${esc(r.display_name)}</button>`).join("")
          : `<button type="button" disabled>Nič som nenašiel</button>`;
        res.classList.add("is-on");
      } catch (err) { toast("Hľadanie teraz nefunguje"); }
    }, 450);
  });
  ed.addEventListener("click", (e) => {
    const b = e.target.closest(".search-res button[data-lat]");
    if (!b) return;
    const which = b.closest(".search").querySelector("[data-search]").dataset.search;
    setLoc(which, +b.dataset.lat, +b.dataset.lng);
    if (which === "mem" && !fMem.elements.place.value) fMem.elements.place.value = b.dataset.name;
    if (which === "place" && !fPlace.elements.name.value) fPlace.elements.name.value = b.dataset.name;
    b.parentElement.classList.remove("is-on");
    b.closest(".search").querySelector("input").value = "";
  });

  /* ---------- Fotky ---------- */
  const drop = $("#drop"), fileIn = $("#fileIn"), grid = $("#phGrid");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); addFiles([...e.dataTransfer.files]); });
  fileIn.addEventListener("change", () => { addFiles([...fileIn.files]); fileIn.value = ""; });

  async function decode(file) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) {}
    const url = URL.createObjectURL(file);
    try { const img = new Image(); img.src = url; await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  function resize(img, max, q) {
    const w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return new Promise((ok) => c.toBlob(ok, "image/jpeg", q));
  }

  async function addFiles(files) {
    files = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    await libs.exifr().catch(() => {});
    let gotGps = F.mem.lat != null, gotDate = !!fMem.elements.date.value;
    for (const file of files) {
      const ph = document.createElement("div");
      ph.className = "ph loading";
      grid.appendChild(ph);
      try {
        let gps = null, meta = null;
        if (window.exifr) {
          [gps, meta] = await Promise.all([
            exifr.gps(file).catch(() => null),
            exifr.parse(file, ["DateTimeOriginal", "CreateDate"]).catch(() => null),
          ]);
        }
        const img = await decode(file);
        const [full, th] = await Promise.all([resize(img, 1800, 0.84), resize(img, 360, 0.8)]);
        const when = meta && (meta.DateTimeOriginal || meta.CreateDate);
        const dstr = when instanceof Date && !isNaN(when) ? ymd(when) : null;
        const name = `${dstr || "foto"}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const photo = { src: `photos/${name}`, thumb: `photos/thumbs/${name}` };
        pending.set(photo.src, full);
        pending.set(photo.thumb, th);
        App.srcMap.set(photo.src, URL.createObjectURL(full));
        App.srcMap.set(photo.thumb, URL.createObjectURL(th));
        F.mem.photos.push(photo);
        if (!gotDate && dstr) { fMem.elements.date.value = dstr; gotDate = true; }
        if (!gotGps && gps && isFinite(gps.latitude)) {
          gotGps = true;
          setLoc("mem", gps.latitude, gps.longitude, { label: "Poloha načítaná z fotky ✓" });
          reverse(gps.latitude, gps.longitude).then((n) => { if (n && !fMem.elements.place.value) fMem.elements.place.value = n; });
        }
      } catch (err) {
        console.warn(err);
        toast(`Fotku ${file.name} sa nepodarilo načítať. Skús ju uložiť ako JPG.`, 4000);
      }
      ph.remove();
      renderPhotos();
    }
    if (!gotGps) toast("Fotka nemá polohu. Vyhľadaj miesto alebo ho klikni na mape.", 3800);
  }

  function renderPhotos() {
    grid.innerHTML = F.mem.photos
      .map((p, i) => `<div class="ph${i === 0 ? " cover" : ""}" data-i="${i}" style="background-image:url('${esc(App.srcMap.get(p.thumb || p.src) || p.thumb || p.src)}')" title="Klikni = titulná fotka"><button type="button" class="ph-x" data-x="${i}" aria-label="Odstrániť">${ic("x")}</button></div>`)
      .join("");
    syncDraft();
  }
  grid.addEventListener("click", (e) => {
    const x = e.target.closest("[data-x]");
    if (x) { F.mem.photos.splice(+x.dataset.x, 1); renderPhotos(); return; }
    const p = e.target.closest(".ph");
    if (p && +p.dataset.i > 0) { const [it] = F.mem.photos.splice(+p.dataset.i, 1); F.mem.photos.unshift(it); renderPhotos(); }
  });

  /* ---------- Spomienka: uložiť / upraviť / zmazať ---------- */
  function resetMem() {
    fMem.reset();
    F.mem = { id: null, photos: [], lat: null, lng: null, zoom: null };
    renderPhotos();
    clearLoc("mem");
    $("#memMode").hidden = true;
    $("#memSubmit").innerHTML = `${ic("heart")}Pridať spomienku`;
  }
  fMem.addEventListener("submit", (e) => {
    e.preventDefault();
    if (F.mem.lat == null) { toast("Ešte vyber polohu na mape ♥"); return; }
    const st = F.mem;
    const m = {
      id: st.id || uid("m"),
      date: fMem.elements.date.value,
      title: fMem.elements.title.value.trim(),
      place: fMem.elements.place.value.trim(),
      lat: st.lat,
      lng: st.lng,
      zoom: st.zoom || 15,
      text: fMem.elements.text.value.trim(),
      photos: st.photos.slice(),
    };
    const i = D.memories.findIndex((x) => x.id === m.id);
    i >= 0 ? (D.memories[i] = m) : D.memories.push(m);
    markDirty();
    resetMem();
    App.renderAll();
    if (innerWidth < 820) close();
    App.openMemory(m.id);
    App.hearts({ clientX: innerWidth / 2, clientY: innerHeight / 2 }, 12);
    toast(i >= 0 ? "Spomienka upravená ✓" : "Spomienka pridaná ♥");
  });
  fMem.querySelector("[data-reset]").addEventListener("click", resetMem);

  function editMemory(id) {
    const m = D.memories.find((x) => x.id === id);
    if (!m) return;
    open();
    showForm("mem");
    resetMem();
    F.mem.id = m.id;
    F.mem.photos = (m.photos || []).map((p) => (typeof p === "string" ? { src: p } : { ...p }));
    fMem.elements.title.value = m.title || "";
    fMem.elements.date.value = m.date || "";
    fMem.elements.place.value = m.place || "";
    fMem.elements.text.value = m.text || "";
    renderPhotos();
    setLoc("mem", m.lat, m.lng, { fly: false });
    F.mem.zoom = m.zoom || 15;
    $("#memMode").hidden = false;
    $("#memSubmit").innerHTML = `${ic("heart")}Uložiť úpravy`;
  }
  function deleteMemory(id) {
    const m = D.memories.find((x) => x.id === id);
    if (!m || !confirm(`Naozaj zmazať „${m.title}“?`)) return;
    D.memories = D.memories.filter((x) => x.id !== id);
    App.closeDetail();
    App.renderAll();
    markDirty();
    toast("Spomienka zmazaná");
  }

  /* ---------- Miesto ---------- */
  function resetPlace() {
    fPlace.reset();
    F.place = { id: null, lat: null, lng: null, zoom: null };
    clearLoc("place");
    $("#placeMode").hidden = true;
    $("#placeSubmit").innerHTML = `${ic("pin")}Pridať miesto`;
  }
  fPlace.addEventListener("submit", (e) => {
    e.preventDefault();
    if (F.place.lat == null) { toast("Ešte vyber polohu na mape ♥"); return; }
    const p = {
      id: F.place.id || uid("p"),
      kind: fPlace.elements.kind.value,
      name: fPlace.elements.name.value.trim(),
      note: fPlace.elements.note.value.trim(),
      lat: F.place.lat,
      lng: F.place.lng,
      zoom: F.place.zoom || 14,
    };
    const i = D.places.findIndex((x) => x.id === p.id);
    i >= 0 ? (D.places[i] = p) : D.places.push(p);
    markDirty();
    resetPlace();
    App.renderAll();
    if (innerWidth < 820) close();
    App.openPlace(p.id);
    toast(i >= 0 ? "Miesto upravené ✓" : "Miesto pridané ♥");
  });
  fPlace.querySelector("[data-reset]").addEventListener("click", resetPlace);
  fPlace.addEventListener("change", (e) => { if (e.target.name === "kind") syncDraft(); });

  function editPlace(id) {
    const p = D.places.find((x) => x.id === id);
    if (!p) return;
    App.map.closePopup();
    open();
    showForm("place");
    resetPlace();
    F.place.id = p.id;
    fPlace.elements.name.value = p.name || "";
    fPlace.elements.note.value = p.note || "";
    fPlace.elements.kind.value = p.kind === "wish" ? "wish" : "fav";
    setLoc("place", p.lat, p.lng, { fly: false });
    F.place.zoom = p.zoom || 14;
    $("#placeMode").hidden = false;
    $("#placeSubmit").innerHTML = `${ic("pin")}Uložiť úpravy`;
  }
  function deletePlace(id) {
    const p = D.places.find((x) => x.id === id);
    if (!p || !confirm(`Naozaj zmazať „${p.name}“?`)) return;
    D.places = D.places.filter((x) => x.id !== id);
    App.map.closePopup();
    App.renderAll();
    markDirty();
    toast("Miesto zmazané");
  }

  /* ---------- Nastavenia ---------- */
  function fillSettings() {
    const s = D.settings;
    fSet.elements.title.value = s.title || "";
    fSet.elements.together.value = s.together || "";
    fSet.elements.introTitle.value = s.introTitle || "";
    fSet.elements.introText.value = s.introText || "";
  }
  fSet.addEventListener("submit", (e) => {
    e.preventDefault();
    Object.assign(D.settings, {
      title: fSet.elements.title.value.trim(),
      together: fSet.elements.together.value,
      introTitle: fSet.elements.introTitle.value.trim(),
      introText: fSet.elements.introText.value.trim(),
    });
    markDirty();
    App.renderAll();
    toast("Nastavenia použité ✓");
  });

  /* ---------- Uloženie ---------- */
  function serialize() {
    const clean = { settings: D.settings, memories: App.mems(), places: D.places };
    return (
      "/* Dáta mapy. Najjednoduchšie ich upravíš cez editor: otvor stránku s ?edit na konci adresy.\n" +
      "   Ručne sa to dá tiež, je to obyčajný JSON. */\n" +
      "window.LOVE_DATA = " + JSON.stringify(clean, null, 2) + ";\n"
    );
  }
  function usedPending() {
    const used = new Set();
    for (const m of D.memories) for (const p of m.photos || []) { if (p.src) used.add(p.src); if (p.thumb) used.add(p.thumb); }
    if (F.mem.photos) for (const p of F.mem.photos) { used.add(p.src); used.add(p.thumb); }
    return [...pending].filter(([path]) => used.has(path));
  }

  let dirHandle = null;
  async function writeFile(dir, name, data) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
  }
  $("#saveDir").addEventListener("click", async () => {
    try {
      if (!dirHandle) {
        const h = await showDirectoryPicker({ id: "laskova-mapa", mode: "readwrite" });
        try { await h.getFileHandle("index.html"); } catch (e) { toast("Vyber priečinok mapalasky (ten, kde je index.html)", 4000); return; }
        dirHandle = h;
      }
      const photos = await dirHandle.getDirectoryHandle("photos", { create: true });
      const thumbs = await photos.getDirectoryHandle("thumbs", { create: true });
      for (const [path, blob] of usedPending()) {
        const name = path.split("/").pop();
        await writeFile(path.startsWith("photos/thumbs/") ? thumbs : photos, name, blob);
        pending.delete(path);
      }
      await writeFile(dirHandle, "data.js", serialize());
      markClean();
      toast("Uložené do priečinka ♥ Teraz to už len nahraj na web.", 4000);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.error(err);
      toast("Uloženie do priečinka zlyhalo, skús Stiahnuť ZIP", 4000);
    }
  });
  $("#saveZip").addEventListener("click", async () => {
    try {
      await libs.zip();
      const zip = new JSZip();
      zip.file("data.js", serialize());
      for (const [path, blob] of usedPending()) zip.file(path, blob);
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mapa-update-${ymd(new Date())}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      markClean();
      toast("ZIP stiahnutý. Rozbaľ ho do priečinka mapalasky a prepíš súbory.", 5000);
    } catch (err) {
      console.error(err);
      toast("ZIP sa nepodarilo vytvoriť", 4000);
    }
  });

  /* ---------- Napojenie na mapu ---------- */
  App.editHooks = { editMemory, deleteMemory, editPlace, deletePlace };
  App.renderAll();
  toast("Režim úprav je zapnutý ✎", 2500);
})();
