# Supabase: spoločná databáza pre moje weby

Prehľad pre ďalší projekt (napr. florbalová liga `fulka`), aby sa vedel napojiť na tú istú databázu.
Stav k 18. 10. 2026.

## Ako je to postavené

- **Hosting:** každá stránka je samostatný verejný repozitár na GitHub Pages (účet `LonziSlovakia`):
  - `https://lonzislovakia.github.io/laura/`: mapa spomienok, **beží**. Repozitár `LonziSlovakia/laura`, priečinok `~/projects/laura/mapalasky`.
  - `https://lonzislovakia.github.io/fulka/`: florbalová liga, ešte neexistuje.
  - Stránky sú statické (HTML/CSS/JS, bez buildu a bez servera). Dáta a fotky nie sú v repozitári, ale v Supabase.
- **Databáza:** jeden bezplatný Supabase projekt `lonzi-weby` pre všetky weby.
  - Je bez platobnej karty, takže nemôžu prísť žiadne poplatky. Keď sa minie limit, služba sa iba obmedzí.
  - Každý web má vlastné tabuľky s predponou (`laura_…`, `fulka_…`) a vlastný bucket na fotky (`laura`, `fulka`).

## GitHub (už nastavené na tomto počítači)

- `gh` CLI je v `~/.local/bin/gh` a je prihlásený ako `LonziSlovakia`, s oprávneniami `repo` a `workflow` (workflow treba na nahrávanie `.github/workflows`).
- **Commity používajú skrytú adresu**, aby vo verejnom repozitári nebol súkromný e-mail. V každom novom repozitári pred prvým commitom nastaviť:
  `git config user.email "72870876+LonziSlovakia@users.noreply.github.com"`
- Nový web na GitHub Pages:
  ```bash
  touch .nojekyll                      # GitHub nebude súbory prehadzovať cez Jekyll
  gh repo create LonziSlovakia/fulka --public --source=. --remote=origin --push
  gh api -X POST repos/LonziSlovakia/fulka/pages -f "source[branch]=main" -f "source[path]=/"
  gh api repos/LonziSlovakia/fulka/pages --jq .status   # počkať na "built" (1 – 2 min)
  ```
- Ďalšie zmeny kódu: `git commit` a `git push`. Web sa obnoví do 1 – 2 minút.
- Stránka je v podpriečinku (`/fulka/`), preto používať **iba relatívne cesty** (`app.js`, nie `/app.js`).

## Pripojenie (verejné údaje, patria do kódu stránky)

| | |
|---|---|
| Project URL | `https://anovkowkucidkutwghzx.supabase.co` |
| Publishable key | `sb_publishable_Z7x71TnM4mW0G_xrniGZsQ_PVCtIjwM` |
| REST | `https://anovkowkucidkutwghzx.supabase.co/rest/v1/<tabuľka>` |
| Fotky (verejné) | `https://anovkowkucidkutwghzx.supabase.co/storage/v1/object/public/<bucket>/<cesta>` |

**Nikdy** nedávať do kódu ani neposielať: `service_role` / `sb_secret_…` kľúč, heslo k databáze ani heslá účtov.

## Nastavenie projektu (už spravené)

- Región: Európa.
- **Data API:** zapnuté.
- **Automatically expose new tables: VYPNUTÉ.** Každá nová tabuľka potrebuje ručné `grant` (pozri šablónu nižšie), inak API vráti `permission denied` (42501).
- **Automatic RLS:** zapnuté. Každá nová tabuľka má RLS hneď, bez pravidiel je zamknutá.
- **Registrácia nových používateľov je vypnutá** (`disable_signup: true`). Účty sa pridávajú ručne cez Authentication → Users → Add user (Auto Confirm).

## Kto smie zapisovať

Tabuľka `public.admins (user_id uuid, site text)` (RLS zapnuté, bez pravidiel, cez API nečitateľná) a funkcia `public.is_admin(site text)`.
Funkcia je `security definer` a vráti true, ak je prihlásený používateľ admin danej stránky.

| Účet | UID | Weby |
|---|---|---|
| Lonzi | `bdde0469-2c9d-4c05-b696-00310f73f3a4` | `laura`, `fulka` |
| Laura | `7641f5b9-3baf-4d3e-bc6c-40d9c4ad508b` | `laura` (insert je v skripte; ak by nemohla zapisovať, spustiť ho ešte raz) |

Nový admin: `insert into public.admins (user_id, site) values ('<UID>', 'fulka');`

Pravidlá pre každý web:
- čítať môže každý (`anon`)
- zapisovať smie iba `authenticated` používateľ, pre ktorého platí `is_admin('<web>')`

Overené: anonymný insert, delete aj upload fotky sú odmietnuté.

## Čo už v databáze je

- Skript `supabase/1-zaklad-a-laura.sql` v repozitári mapy už bol spustený. Vytvoril:
  - `admins` a `is_admin()`
  - tabuľky `laura_settings` (1 riadok, `data jsonb`), `laura_memories` a `laura_places`
  - bucket `laura`: verejný, max 8 MB, jpeg/png/webp
- Pre `fulka` zatiaľ existuje iba záznam v `admins`, tabuľky a bucket treba vytvoriť.

## Šablóna SQL pre nový web (napr. fulka)

Spúšťa sa ručne v Supabase → SQL Editor. Tabuľky sú len príklad, upraviť podľa potreby:

```sql
create table if not exists public.fulka_teams   (id text primary key, name text not null, logo text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.fulka_players (id text primary key, team_id text references public.fulka_teams(id) on delete set null, name text not null, number int, photo text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.fulka_matches (id text primary key, played_at timestamptz, home_id text references public.fulka_teams(id), away_id text references public.fulka_teams(id), home_score int, away_score int, note text default '', created_at timestamptz default now(), updated_at timestamptz default now());

do $$
declare t text;
begin
  foreach t in array array['fulka_teams', 'fulka_players', 'fulka_matches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "citat moze kazdy" on public.%I', t);
    execute format('create policy "citat moze kazdy" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "pridavat moze admin" on public.%I', t);
    execute format('create policy "pridavat moze admin" on public.%I for insert to authenticated with check (public.is_admin(''fulka''))', t);
    execute format('drop policy if exists "menit moze admin" on public.%I', t);
    execute format('create policy "menit moze admin" on public.%I for update to authenticated using (public.is_admin(''fulka'')) with check (public.is_admin(''fulka''))', t);
    execute format('drop policy if exists "mazat moze admin" on public.%I', t);
    execute format('create policy "mazat moze admin" on public.%I for delete to authenticated using (public.is_admin(''fulka''))', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fulka', 'fulka', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "fulka fotky: admin vidi zoznam" on storage.objects for select to authenticated using (bucket_id = 'fulka' and public.is_admin('fulka'));
create policy "fulka fotky: admin nahrava" on storage.objects for insert to authenticated with check (bucket_id = 'fulka' and public.is_admin('fulka'));
create policy "fulka fotky: admin meni" on storage.objects for update to authenticated using (bucket_id = 'fulka' and public.is_admin('fulka'));
create policy "fulka fotky: admin maze" on storage.objects for delete to authenticated using (bucket_id = 'fulka' and public.is_admin('fulka'));
```

Tabuľku s výsledkami (body, skóre) je lepšie počítať v JS z `fulka_matches`, alebo cez SQL view. View tiež potrebuje `grant select … to anon` a `with (security_invoker = true)`.

## Ako na to ide stránka (vzor: `mapalasky/db.js`)

Bez knižnice `supabase-js`, iba `fetch`:

- **Čítanie:** `GET /rest/v1/<tabuľka>?select=...&order=...` s hlavičkou `apikey: <publishable key>`.
  Posledné dáta si stránka ukladá do `localStorage`, takže sa otvorí hneď a funguje aj bez internetu.
- **Prihlásenie:** `POST /auth/v1/token?grant_type=password` s `{email, password}`.
  - Odpoveď (`access_token`, `refresh_token`, `expires_at`) sa uloží do `localStorage`.
  - Pred vypršaním sa obnoví cez `POST /auth/v1/token?grant_type=refresh_token`.
- **Zápis:** hlavičky `apikey` a `Authorization: Bearer <access_token>`.
  - Upsert: `POST /rest/v1/<t>?on_conflict=id` s `Prefer: resolution=merge-duplicates,return=representation`.
  - Delete: `DELETE /rest/v1/<t>?id=eq.<id>` s `Prefer: return=representation`. Prázdna odpoveď znamená, že RLS nič nepovolilo, teda chýbajú práva.
- **Fotky:**
  - Upload: `POST /storage/v1/object/<bucket>/<cesta>` s `x-upsert: true` a `cache-control: max-age=31536000`.
  - Mazanie: `DELETE /storage/v1/object/<bucket>` s `{"prefixes": [...]}`.
  - Fotky sa pred nahratím zmenšia v prehliadači: max 1800 px plus 360 px náhľad, JPEG, bez EXIF/GPS.
- Editor sa načíta iba s `?edit` v adrese a ukladá každú zmenu hneď.

## Limity bezplatného plánu (orientačne, overiť na supabase.com/pricing)

- Databáza 500 MB, súbory 1 GB, prenos približne 5 GB mesačne.
- Max **2 aktívne projekty** na účet. Preto je jeden projekt pre všetky weby.
- **Projekt sa uspí po 7 dňoch bez aktivity.**
  - Dáta ostanú, ale API nejde, kým sa v dashboarde neklikne Restore.
  - **Vyriešené budíkom** `.github/workflows/keepalive.yml` v repozitári `laura`, ktorý beží a bol overený:
    - každé 3 dni o 6:17 UTC sa opýta `laura_settings?select=id`
    - pri chybe beh zlyhá a GitHub pošle e-mail
    - zároveň potvrdí svoj plán, aby ho GitHub po 60 dňoch nevypol
  - Celý projekt je jeden, takže tento budík drží hore aj `fulka`, **druhý netreba**.
  - Keby sa repozitár `laura` niekedy zmazal, budík treba presunúť inam.
  - Prehľad behov: github.com/LonziSlovakia/laura → Actions → Databáza nespí.
  - Pozor: GitHub vypína plánované workflowy vo verejných repo po 60 dňoch bez aktivity.

## Ďalšie kroky

1. ~~Repozitár a GitHub Pages pre `laura`.~~ Hotové.
2. ~~Budík proti uspaniu databázy.~~ Hotové.
3. Mapa: ostrý test nahrania fotky z mobilu (zápis textov do databázy už funguje, nahrávanie fotiek bolo zatiaľ testované iba na simulácii).
4. `fulka`:
   - spustiť SQL podľa šablóny vyššie (Supabase → SQL Editor)
   - stránku postaviť podľa vzoru `db.js`
   - nasadiť podľa časti GitHub
