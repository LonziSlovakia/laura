# Naša mapa ♥

Mapa spoločných spomienok: fotky na mape, obľúbené miesta, miesta kam chceme ísť a časová os dole.

## Súbory

| Súbor | Načo je |
|---|---|
| `index.html`, `style.css`, `app.js` | samotná stránka |
| `db.js` | napojenie na databázu (Supabase), kde sú spomienky, miesta aj fotky |
| `supabase/` | SQL skripty, ktoré v Supabase vytvoria tabuľky a pravidlá (spúšťajú sa raz) |
| `photos/` | iba ukážkové obrázky, skutočné fotky sú v databáze |
| `editor.js`, `editor.css` | editor, načíta sa iba s `?edit` v adrese |
| `map-style.json` | vzhľad mapy (pastelové farby) |
| `vendor/` | knižnice mapy (Leaflet, MapLibre), aby sa nesťahovali z cudzích serverov |
| `sw.js` | pamätá si mapu, knižnice a fotky, takže ďalšie otvorenie je rýchle aj bez internetu |

## Databáza (Supabase)

Spomienky, miesta, nastavenia aj fotky sú v bezplatnom projekte na **supabase.com** (bez platobnej karty, takže nič nemôžu strhnúť).
- Čítať môže každý, kto má odkaz na stránku. Zapisovať smie iba účet zapísaný v tabuľke `admins` (ty a Laura pre stránku `laura`).
- Nový admin: v Supabase **Authentication → Users → Add user**, skopíruj jeho UID a v SQL Editore spusti `insert into public.admins (user_id, site) values ('UID', 'laura');`
- Tabuľky a pravidlá vytvorí skript `supabase/1-zaklad-a-laura.sql`: v Supabase otvor **SQL Editor**, vlož ho celý a klikni **Run**.
- Kľúč v `db.js` je verejný (*publishable*), patrí do stránky. Tajný kľúč (`service_role` / `sb_secret_…`) a heslo k databáze do stránky nikdy nedávaj.
- Stránka si posledné stiahnuté spomienky pamätá, takže sa otvorí hneď a ukáže ich aj bez internetu.

## Pridanie spomienky

1. Otvor stránku s `?edit` na konci adresy (napr. `…/laura/?edit`), klikni na ceruzku a prihlás sa. Prihlásenie si prehliadač pamätá.
2. Pridaj fotky. **Dátum a GPS sa načítajú priamo z fotky**, a ak fotka má polohu, doplní sa aj názov miesta.
   - Keď fotka polohu nemá (napr. poslaná cez WhatsApp/Messenger, tie ju mažú), vyhľadaj miesto alebo klikni **Na mape**.
   - Zelený špendlík sa dá potiahnuť a polohu tak doladiť.
   - Klik na fotku ju nastaví ako titulnú (tá sa ukáže v špendlíku na mape).
3. Doplň názov a popis a klikni **Pridať spomienku**. Fotky sa nahrajú a spomienka sa uloží hneď, Laura ju uvidí pri ďalšom otvorení stránky.
4. Úprava a mazanie: v detaile spomienky (alebo v bubline miesta) sú tlačidlá **Upraviť** a **Zmazať**. Pri zmazaní sa zmažú aj fotky.

Fotky sa pri pridávaní zmenšia (max 1800 px, okolo 300 kB) a **GPS sa z nich odstráni**. Poloha zostane iba v databáze.
Do bezplatného 1 GB sa tak zmestí približne 2 500 – 3 000 fotiek.
iPhone fotky typu HEIC Chrome na PC neotvorí, preto ich exportuj ako JPG (alebo na iPhone: Nastavenia → Fotoaparát → Formáty → Najkompatibilnejší).

V záložke **Nastavenia** v editore nastavíš dátum, odkedy ste spolu (počítadlo dní), nadpis a úvodný text, ktorý Laura uvidí pri prvom otvorení.

## Pozrieť si to lokálne

```bash
cd ~/projects/laura/mapalasky
python3 -m http.server 8000
```

Potom otvor **http://localhost:8000** (tak, ako to uvidí Laura) alebo **http://localhost:8000/?edit** (s editorom).
Aj lokálne sa dáta čítajú a ukladajú do tej istej databázy ako na webe.

## Zverejnenie

Plán: GitHub Pages, adresa `https://lonzislovakia.github.io/laura/`.
Repozitár s kódom bude verejný, ale spomienky ani fotky v ňom nie sú, tie sú v databáze.
Zmena kódu = commit a push, web sa obnoví do 1 – 2 minút. Spomienky sa pridávajú cez editor, bez gitu.

Stránka má `noindex`, takže ju Google nezaradí do vyhľadávania. Kto však dostane odkaz, ten ju uvidí.

## Ovládanie

- **Časová os:** prejdenie myšou ukáže dátum, klik/ťuk presunie mapu na spomienku a otvorí detail.
- **▶ vľavo dole:** „Náš príbeh“ prejde všetky spomienky po poradí. Pri každej ukáže všetky fotky, 3,5 s na jednu (prúžky hore na fotke).
  Pozastaviť sa dá kedykoľvek, aj keď mapa práve letí: tlačidlom ▶/⏸, dole v detaile, ťuknutím do mapy alebo medzerníkom.
  ■ prehrávanie zastaví. Ťuknutie na časovú os alebo šípky počas prehrávania preskočia na danú spomienku a pokračuje sa odtiaľ.
- **Viac fotiek pri spomienke:** na mobile sa posúvajú prstom do strán, na PC šípkami na fotke alebo náhľadmi pod ňou.
- **Počítadlo hore:** každé ~4 s sa prepne dni → týždne → mesiace → roky → všetko dokopy. Ťuknutím sa prepne hneď.
- **Fotka v detaile:** zväčší sa na celú obrazovku. Na mobile sa dá priblížiť dvoma prstami alebo dvojťukom, posúvať do strán a zavrieť ťuknutím mimo fotky. Na PC funguje koliesko, šípky a Esc.
- **Klik do mapy** zavrie detail (počas prehrávania ho prvý ťuk iba pozastaví).
- **Mobil:** detail aj zoznam sa dajú stiahnuť prstom dole a zavrieť.
- Každá spomienka má vlastný odkaz (`…/#m-xxxx`), takže môžeš poslať aj konkrétnu.

## Mapa a rýchlosť

Podklad je z **VersaTiles** (zadarmo, bez registrácie), dáta © OpenStreetMap.
Pri prvej návšteve sa najprv ukáže hrubá mapa z pár malých dlaždíc a detailná sa plynulo načíta cez ňu.
Pri ďalších návštevách sú dlaždice a knižnice uložené v prehliadači (`sw.js`), takže sa načíta hneď.
Ak sa vektorová mapa nedá zobraziť (starý prehliadač bez WebGL), použije sa obyčajná mapa OpenStreetMap.

Keby si menil súbory vo `vendor/`, zvýš `VERSION` na začiatku `sw.js`, aby si prehliadače stiahli nové.
