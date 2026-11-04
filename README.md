# Personal site

My personal website: app landing pages, browser-based language practice tools, and a portfolio of 3D and design work from 2020 to 2023.

Built with **Astro 6** and **Tailwind CSS 4**, written in **TypeScript**, deployed on **Vercel** with Vercel Analytics.

## What's on it

- **App pages** for [Manabu](src/pages/projects/manabu) and [Tsundoku](src/pages/projects/tsundoku): landing page, changelog, privacy policy and EULA
- **Language practice tools**, all running client-side:
  - Japanese conjugation practice: a conjugation engine for ichidan, godan and irregular verbs and i/na-adjectives ([`src/lib/conjugation.ts`](src/lib/conjugation.ts))
  - Japanese vocabulary practice (JLPT N5 to N1 plus themed lists)
  - Chinese vocabulary practice (HSK 1 to 6)
  - Kana practice
  - Romaji input conversion ([`src/lib/romaji.ts`](src/lib/romaji.ts)) and a Leitner-box spaced-repetition scheduler ([`src/lib/srs.ts`](src/lib/srs.ts))
- **Work gallery**: Blender renders, game assets and design work by year, plus a CV page

## Running locally

Requires Node 22.12+.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
```

## Layout

```
src/
  pages/        routes: index, language/*, projects/*, work/*
  components/   navbars, heroes, work gallery
  data/         vocabulary lists (JLPT, HSK, kana)
  lib/          conjugation engine, romaji conversion, SRS scheduler
  layouts/      shared page layout
public/         static assets
```
