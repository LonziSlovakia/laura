# Naša mapa ♥

Mapa spoločných spomienok: fotky na mape, obľúbené miesta, miesta kam chceme ísť a časová os dole.

## Súbory

| Súbor | Načo je |
|---|---|
| `index.html`, `style.css`, `app.js` | samotná stránka |
| `data.js` | všetky spomienky a miesta (editor ho prepisuje sám) |
| `photos/` a `photos/thumbs/` | fotky a ich malé náhľady |
| `editor.js`, `editor.css` | editor, načíta sa iba s `?edit` v adrese |
| `map-style.json` | vzhľad mapy (pastelové farby) |
| `vendor/` | knižnice mapy (Leaflet, MapLibre), aby sa nesťahovali z cudzích serverov |
| `sw.js` | pamätá si mapu, knižnice a fotky, takže ďalšie otvorenie je rýchle aj bez internetu |

## Pozrieť si to lokálne

```bash
cd ~/projects/laura/mapalasky
python3 -m http.server 8000
```

Potom otvor v prehliadači na Windowse:
- **http://localhost:8000**: tak, ako to uvidí Laura
- **http://localhost:8000/?edit**: s editorom (ceruzka vpravo hore)

## Pridanie spomienky

1. Otvor `?edit` a klikni na ceruzku.
2. Pretiahni fotky. **Dátum a GPS sa načítajú priamo z fotky**, a ak fotka má polohu, doplní sa aj názov miesta.
   - Keď fotka polohu nemá (napr. poslaná cez WhatsApp/Messenger, tie ju mažú), vyhľadaj miesto alebo klikni **Na mape**.
   - Zelený špendlík sa dá potiahnuť a polohu tak doladiť.
   - Klik na fotku ju nastaví ako titulnú (tá sa ukáže v špendlíku na mape).
3. Doplň názov a popis a klikni **Pridať spomienku**.
4. Vlastné ukážkové spomienky zmažeš v detaile tlačidlom **Zmazať**.
5. **Ulož zmeny:**
   - **Uložiť do priečinka** (Chrome/Edge): vyber priečinok `mapalasky`, fotky aj `data.js` sa zapíšu rovno tam.
     Cez `\\wsl.localhost\...` to Windows niekedy nepovolí, vtedy použi ZIP.
   - **Stiahnuť ZIP**: rozbaľ ho do `mapalasky` a prepíš súbory.

Fotky sa pri pridávaní zmenšia (max 1800 px) a **GPS sa z nich odstráni**. Poloha zostane iba v `data.js`.
iPhone fotky typu HEIC Chrome na PC neotvorí, preto ich exportuj ako JPG (alebo na iPhone: Nastavenia → Fotoaparát → Formáty → Najkompatibilnejší).

V záložke **Nastavenia** v editore nastavíš dátum, odkedy ste spolu (počítadlo dní), nadpis a úvodný text, ktorý Laura uvidí pri prvom otvorení.

## Zverejnenie zadarmo

**Netlify Drop (najjednoduchšie):** choď na https://app.netlify.com/drop a pretiahni tam celý priečinok `mapalasky`.
Dostaneš odkaz, ktorý jej pošleš. Po každej zmene priečinok pretiahni znova (v rovnakej stránke na Netlify: *Deploys → drag & drop*).

**GitHub Pages:** dá sa tiež, ale pri bezplatnom účte musí byť repozitár verejný, takže fotky by boli verejne dostupné. Preto radšej Netlify.

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
