# MatteMästaren

Räkneträning med dra och släpp för låg- och mellanstadiet. Barnet drar svarskorten till rätt tal
innan tiden tar slut – multiplikation som standard, men också andra räknesätt.

**Spela:** https://mathmaster.skolappar.com · En del av [Skolappar](https://www.skolappar.com) – pedagogiska appar av föräldrar · öppen källkod (MIT)

Började som ett Google AI Studio-projekt och körs nu fristående.

## Vad du kan göra

- **Åtta räknesätt**: multiplikation, addition, subtraktion, division, procent, potenser,
  kvadratrot och algebra.
- **Dra och släpp** svaret till rätt uppgift, med finger eller mus.
- **Tio nivåer** med fler uppgifter, större tal och kortare tid.
- **Nedräkning**: fel svar kostar fem sekunder och nollställer sviten.
- **Svit (streak)** som ger extrapoäng, och **mynt** som samlas mellan omgångarna.
- **Fyra teman** med egna färger och ljud: Klassisk Matte, Hockeymatch, Fotbollsplan och
  Rymdäventyr.
- Konfetti när en nivå är klar; ljuden skapas i webbläsaren (Web Audio).

## Kom igång

```bash
npm install
npm run dev      # utvecklingsserver på port 3000
npm run build    # produktionsbygge till dist/
npm run preview  # förhandsgranska bygget
```

Docker-bygget använder Node 22.

## Docker

```bash
docker build -t mathmaster .
docker run --rm -p 8080:8080 mathmaster
```

Servern ligger bakom nginx med `deploy/nginx.conf`.

## Integritet

- Ingen inloggning, inga kakor, ingen analys, inga AI-tjänster.
- Inga anrop till externa servrar. Typsnittet Fredoka ligger i `public/fonts/`.
- Det enda som sparas är antalet mynt, i `localStorage` under `mm_coins`.

## Struktur

```
App.tsx                      meny, spel, nivåer, poäng och mynt
constants.ts                 teman och nivåer
utils/mathLogic.ts           skapar uppgifterna för varje räknesätt
utils/sound.ts               ljud per tema
components/DraggableCard.tsx svarskort
components/DroppableZone.tsx uppgift att släppa svaret på
components/Confetti.tsx      konfetti
deploy/nginx.conf            nginx-konfiguration
```

`src/App.tsx` är en äldre variant med årskursval som inte byggs in i appen.

## Licens

MIT – se [LICENSE](LICENSE).
