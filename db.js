/* Napojenie na databázu (Supabase). Spomienky, miesta a fotky sú tam, takže zmena z editora
   (aj z mobilu) sa hneď ukáže každému, kto stránku otvorí.
   Kľúč nižšie je verejný ("publishable"), patrí do stránky. Čítať smie každý, zapisovať
   iba prihlásený admin (pravidlá sú v supabase/1-zaklad-a-laura.sql). */
(() => {
  "use strict";
  const CFG = {
    url: "https://anovkowkucidkutwghzx.supabase.co",
    key: "sb_publishable_Z7x71TnM4mW0G_xrniGZsQ_PVCtIjwM",
    site: "laura", // predpona tabuliek: laura_settings, laura_memories, laura_places
    bucket: "laura", // priečinok na fotky
  };
  const T = { settings: `${CFG.site}_settings`, memories: `${CFG.site}_memories`, places: `${CFG.site}_places` };
  const CACHE_KEY = `${CFG.site}-data-v1`;
  const SESSION_KEY = `${CFG.site}-session-v1`;
  const PUBLIC = `${CFG.url}/storage/v1/object/public/${CFG.bucket}/`;
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  async function check(res) {
    if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);
    const j = await res.json().catch(() => ({}));
    const err = new Error(j.message || j.msg || j.error_description || j.error || res.statusText);
    err.status = res.status;
    err.code = j.code || j.error_code || j.error;
    throw err;
  }
  function rest(path, { method = "GET", body, token, prefer } = {}) {
    const headers = { apikey: CFG.key };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    return fetch(`${CFG.url}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" }).then(check);
  }

  /* ---------- Čítanie ----------
     Posledné stiahnuté dáta sú uložené v prehliadači, takže stránka sa ukáže hneď
     a čerstvé dáta sa dotiahnu na pozadí (a bez internetu ostane posledná verzia). */
  const clean = (rows) => rows.map((r) => { for (const k in r) if (r[k] === null) delete r[k]; return r; });
  const cached = ls.get(CACHE_KEY);
  const fresh = Promise.all([
    rest(`${T.settings}?select=data&id=eq.1`),
    rest(`${T.memories}?select=id,date,title,place,lat,lng,zoom,text,photos&order=date`),
    rest(`${T.places}?select=id,kind,name,note,lat,lng,zoom&order=created_at`),
  ]).then(([s, memories, places]) => {
    const d = { settings: (s[0] && s[0].data) || {}, memories: clean(memories), places: clean(places) };
    ls.set(CACHE_KEY, d);
    return d;
  });
  fresh.catch(() => {});

  /* ---------- Prihlásenie (iba editor) ---------- */
  let session = ls.get(SESSION_KEY);
  const auth = (path, body, token) =>
    fetch(`${CFG.url}/auth/v1/${path}`, {
      method: "POST",
      headers: { apikey: CFG.key, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body || {}),
    }).then(check);
  function keep(s) {
    session = {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
      user: { id: s.user.id, email: s.user.email },
    };
    ls.set(SESSION_KEY, session);
  }
  function forget() { session = null; ls.del(SESSION_KEY); }
  async function signIn(email, password) {
    keep(await auth("token?grant_type=password", { email, password }));
    return session.user;
  }
  function signOut() {
    const t = session && session.access_token;
    forget();
    if (t) auth("logout", {}, t).catch(() => {});
  }
  let refreshing = null;
  async function token() {
    if (!session) throw Object.assign(new Error("Nie si prihlásený"), { status: 401 });
    if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
    refreshing = refreshing || auth("token?grant_type=refresh_token", { refresh_token: session.refresh_token })
      .then(keep)
      .catch((e) => { if (e.status >= 400 && e.status < 500) forget(); throw e; })
      .finally(() => { refreshing = null; });
    await refreshing;
    return session.access_token;
  }

  /* ---------- Zápis ---------- */
  let wrote = false;
  const write = async (path, opts) => { wrote = true; return rest(path, { ...opts, token: await token() }); };
  const now = () => new Date().toISOString();
  const noRights = () => Object.assign(new Error("Tento účet nemá právo zapisovať"), { status: 403 });

  async function upsert(kind, row) {
    const r = await write(`${T[kind]}?on_conflict=id`, { method: "POST", body: { ...row, updated_at: now() }, prefer: "resolution=merge-duplicates,return=representation" });
    if (!r || !r.length) throw noRights();
  }
  async function remove(kind, id) {
    const r = await write(`${T[kind]}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=representation" });
    if (!r || !r.length) throw noRights(); // RLS potichu nezmaže nič, ak účet nie je admin
  }
  const saveSettings = (data) => upsert("settings", { id: 1, data });

  /* ---------- Fotky ---------- */
  async function upload(path, blob) {
    const res = await fetch(`${CFG.url}/storage/v1/object/${CFG.bucket}/${path}`, {
      method: "POST",
      headers: { apikey: CFG.key, Authorization: `Bearer ${await token()}`, "Content-Type": blob.type || "image/jpeg", "cache-control": "max-age=31536000", "x-upsert": "true" },
      body: blob,
    });
    await check(res);
    wrote = true;
    return PUBLIC + path;
  }
  const isOurs = (url) => typeof url === "string" && url.startsWith(PUBLIC);
  async function removeFiles(urls) {
    const prefixes = urls.filter(isOurs).map((u) => decodeURIComponent(u.slice(PUBLIC.length)));
    if (!prefixes.length) return;
    const res = await fetch(`${CFG.url}/storage/v1/object/${CFG.bucket}`, {
      method: "DELETE",
      headers: { apikey: CFG.key, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes }),
    });
    await check(res);
  }

  window.DB = {
    cached,
    fresh,
    get wrote() { return wrote; },
    saveCache: (d) => ls.set(CACHE_KEY, { settings: d.settings, memories: d.memories, places: d.places }),
    user: () => (session ? session.user : null),
    signIn,
    signOut,
    upsert,
    remove,
    saveSettings,
    upload,
    removeFiles,
    isOurs,
  };
})();
