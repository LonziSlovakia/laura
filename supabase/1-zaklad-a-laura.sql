-- Spustiť raz v Supabase: SQL Editor → New query → vložiť celé → Run.
-- Dá sa spustiť aj opakovane, nič sa nezduplikuje.
--
-- Čo to spraví:
--   * tabuľka admins: kto smie zapisovať do ktorej stránky (laura, fulka, ...)
--   * tabuľky pre mapu lásky: laura_settings, laura_memories, laura_places
--   * priečinok (bucket) na fotky "laura"
--   * pravidlá: čítať môže ktokoľvek s odkazom, zapisovať iba admin danej stránky
--   * po jednej ukážke od každého druhu (v editore sa dajú zmazať)
--
-- Zrušenie všetkého (ak by bolo treba): pozri koniec súboru.

-- ---------- Admini ----------
create table if not exists public.admins (
  user_id uuid not null references auth.users (id) on delete cascade,
  site text not null,
  primary key (user_id, site)
);
alter table public.admins enable row level security; -- bez pravidiel = cez API ju nik nečíta

create or replace function public.is_admin(p_site text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid() and a.site = p_site);
$$;
revoke all on function public.is_admin(text) from public;
grant execute on function public.is_admin(text) to anon, authenticated;

insert into public.admins (user_id, site) values
  ('bdde0469-2c9d-4c05-b696-00310f73f3a4', 'laura'),
  ('bdde0469-2c9d-4c05-b696-00310f73f3a4', 'fulka')
on conflict do nothing;

-- ---------- Mapa lásky ----------
create table if not exists public.laura_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.laura_memories (
  id text primary key,
  date date not null,
  title text not null default '',
  place text not null default '',
  lat double precision not null,
  lng double precision not null,
  zoom real,
  text text not null default '',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.laura_places (
  id text primary key,
  kind text not null default 'fav' check (kind in ('fav', 'wish')),
  name text not null default '',
  note text not null default '',
  lat double precision not null,
  lng double precision not null,
  zoom real,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['laura_settings', 'laura_memories', 'laura_places'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "citat moze kazdy" on public.%I', t);
    execute format('create policy "citat moze kazdy" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "pridavat moze admin" on public.%I', t);
    execute format('create policy "pridavat moze admin" on public.%I for insert to authenticated with check (public.is_admin(''laura''))', t);
    execute format('drop policy if exists "menit moze admin" on public.%I', t);
    execute format('create policy "menit moze admin" on public.%I for update to authenticated using (public.is_admin(''laura'')) with check (public.is_admin(''laura''))', t);
    execute format('drop policy if exists "mazat moze admin" on public.%I', t);
    execute format('create policy "mazat moze admin" on public.%I for delete to authenticated using (public.is_admin(''laura''))', t);
  end loop;
end $$;

-- ---------- Fotky ----------
-- verejný bucket = fotky sa dajú zobraziť cez odkaz (bez neho ich nik nenájde, mená sú náhodné)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('laura', 'laura', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "laura fotky: admin vidi zoznam" on storage.objects;
create policy "laura fotky: admin vidi zoznam" on storage.objects for select to authenticated
  using (bucket_id = 'laura' and public.is_admin('laura'));
drop policy if exists "laura fotky: admin nahrava" on storage.objects;
create policy "laura fotky: admin nahrava" on storage.objects for insert to authenticated
  with check (bucket_id = 'laura' and public.is_admin('laura'));
drop policy if exists "laura fotky: admin meni" on storage.objects;
create policy "laura fotky: admin meni" on storage.objects for update to authenticated
  using (bucket_id = 'laura' and public.is_admin('laura'));
drop policy if exists "laura fotky: admin maze" on storage.objects;
create policy "laura fotky: admin maze" on storage.objects for delete to authenticated
  using (bucket_id = 'laura' and public.is_admin('laura'));

-- ---------- Ukážky (po jednej, v editore ich zmažeš) ----------
insert into public.laura_settings (id, data) values (1, jsonb_build_object(
  'title', 'Laura & ja',
  'together', '2026-04-01',
  'introTitle', 'Ahoj Laura ♥',
  'introText', E'Toto je mapa našich spoločných chvíľ.\nKaždé srdiečko je miesto, kde sme boli spolu.\nKlikni dole na časovú os alebo pusti „Náš príbeh“.'
)) on conflict (id) do nothing;

insert into public.laura_memories (id, date, title, place, lat, lng, zoom, text, photos) values (
  'm-ukazka1', '2026-04-12', 'Prvé rande', 'Bratislava, Hrad', 48.1421, 17.1001, 15,
  'Sem napíš, čo sa vtedy stalo. Toto je len ukážka, v editore ju zmažeš.',
  '[{"src": "photos/ukazka-1.svg"}, {"src": "photos/ukazka-2.svg"}]'
) on conflict (id) do nothing;

insert into public.laura_places (id, kind, name, note, lat, lng) values
  ('p-ukazka1', 'fav', 'Naša kaviareň', 'Ukážka obľúbeného miesta.', 48.1446, 17.1077),
  ('p-ukazka2', 'wish', 'Benátky', 'Ukážka miesta, kam chceme ísť.', 45.4408, 12.3155)
on conflict (id) do nothing;

-- ---------- Zrušenie (NESPÚŠŤAJ, iba pre prípad potreby) ----------
-- drop table if exists public.laura_memories, public.laura_places, public.laura_settings;
-- delete from storage.objects where bucket_id = 'laura';  -- (ak to nepovolí, zmaž fotky v Storage ručne)
-- delete from storage.buckets where id = 'laura';
