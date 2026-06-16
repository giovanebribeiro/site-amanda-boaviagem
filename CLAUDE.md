# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install       # install dependencies
npm run dev       # lint + start dev server on localhost:3000
npm run lint      # run ESLint (next/core-web-vitals) standalone
npm run build     # production build
npm run start     # serve production build locally
npm run app       # build + static export to out/
npm run release   # bump version, update CHANGELOG.md, create git tag
```

No test suite is configured. `npm run dev` automatically runs `next lint` first via the `prebuild` hook.

## Architecture

Single-author portfolio site (Next.js 13, Pages Router) deployed on Netlify. Two routes:

- **`/`** (`pages/index.js`) — Single-page layout assembling all sections: Header → Intro → About → Store → HopeWriter → WriterCertification → InstaFeed → Testimonials → ContactUs → Footer
- **`/store`** (`pages/store/index.js`) — Dedicated store page reusing `Store`, `HeaderProject`, and `FooterProject` components

All section components live in `pages/components/`. Components that require device detection (`Intro`, `Testimonials`, `Store`, `HopeWriter`) are loaded with `next/dynamic(..., { ssr: false })` to avoid SSR hydration mismatches.

## Content Management

All site content is static data in `public/data/`. Each file exports a default const object:

```js
const DataFoo = { items: [ { id, ...fields } ] }
export default DataFoo
```

Specific file structures:
- **`DataStore`** — `items[]` with `{id, title, description, image, linkAmazon, linkUiclap, direction}`. The "show more" button on the home-page store section only appears when there are more than 2 items.
- **`DataIntro`** — separate `bannersDesktop[]` and `bannersMobile[]` arrays for responsive banner images
- **`DataTestimonials`** — separate `Images[]` and `ImagesMobile[]` arrays
- **`DataAbout`**, **`DataHopeWriter`** — single `items[]`

To add content, append an object to the relevant array. SVG is the preferred image format; mobile and desktop image variants are kept separately.

## Key Patterns

- `HeaderProject` and `Store` accept an `isInitialPage` boolean prop — `true` on the home page, `false` on the `/store` sub-page — to control appearance and navigation behavior.
- Global styles are applied via `<style jsx global>` inline in page files. The primary background color is `#2d638e`.
- `NextUIProvider` wraps all component trees (both `<main>` and `<footer>` in `pages/index.js`).
