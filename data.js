/* Dáta mapy. Najjednoduchšie ich upravíš cez editor: otvor stránku s ?edit na konci adresy.
   Ručne sa to dá tiež, je to obyčajný JSON. */
window.LOVE_DATA = {
  "settings": {
    "title": "Laura & ja",
    "together": "2026-04-01",
    "introTitle": "Ahoj Laura ♥",
    "introText": "Toto je mapa našich spoločných chvíľ.\nKaždé srdiečko je miesto, kde sme boli spolu.\nKlikni dole na časovú os alebo pusti „Náš príbeh“."
  },
  "memories": [
    {
      "id": "m-ukazka1",
      "date": "2026-04-12",
      "title": "Prvé rande",
      "place": "Bratislava, Hrad",
      "lat": 48.1421,
      "lng": 17.1001,
      "zoom": 15,
      "text": "Sem napíš, čo sa vtedy stalo. Toto je len ukážka, cez editor ju zmažeš.",
      "photos": [{ "src": "photos/ukazka-1.svg" }, { "src": "photos/ukazka-2.svg" }]
    },
    {
      "id": "m-ukazka2",
      "date": "2026-05-23",
      "title": "Výlet na Štrbské Pleso",
      "place": "Štrbské Pleso",
      "lat": 49.1197,
      "lng": 20.0612,
      "zoom": 14,
      "text": "Ukážková spomienka. Fotku si môžeš na mobile zväčšiť dvoma prstami.",
      "photos": [{ "src": "photos/ukazka-3.svg" }]
    },
    {
      "id": "m-ukazka3",
      "date": "2026-07-04",
      "title": "Leto v Banskej Štiavnici",
      "place": "Banská Štiavnica",
      "lat": 48.4588,
      "lng": 18.8931,
      "zoom": 15,
      "text": "Ešte jedna ukážka.",
      "photos": [{ "src": "photos/ukazka-4.svg" }, { "src": "photos/ukazka-1.svg" }]
    },
    {
      "id": "m-ukazka4",
      "date": "2026-09-13",
      "title": "Viedeň na jeden deň",
      "place": "Viedeň, Prater",
      "lat": 48.2166,
      "lng": 16.3958,
      "zoom": 14,
      "text": "Aj spomienky v zahraničí fungujú, mapa pokrýva celý svet.",
      "photos": [{ "src": "photos/ukazka-2.svg" }]
    }
  ],
  "places": [
    { "id": "p-ukazka1", "kind": "fav", "name": "Naša kaviareň", "note": "Sem chodíme najčastejšie.", "lat": 48.1446, "lng": 17.1077 },
    { "id": "p-ukazka2", "kind": "wish", "name": "Benátky", "note": "Raz spolu na gondole.", "lat": 45.4408, "lng": 12.3155 },
    { "id": "p-ukazka3", "kind": "wish", "name": "Vysoké Tatry: Rysy", "note": "Východ slnka na vrchole.", "lat": 49.1795, "lng": 20.0881 }
  ]
};
