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
npm test          # Jest + React Testing Library
npx tsc --noEmit  # typecheck
```

`npm run dev` and `npm run build` run `next lint` first via the `prebuild` hook.

## Architecture

Single-author portfolio site (Next.js 14, Pages Router, TypeScript, HeroUI + Tailwind) deployed on Netlify as a static export. Routes:

- **`/`** (`pages/index.tsx`) - Single page: Header, Hero, UltimoLancamento, Books, About, Contact, Footer
- **`/livros/[slug]`** (`pages/livros/[slug].tsx`) - One page per book (`getStaticPaths` over the books)
- **`/blog`**, **`/blog/[slug]`** - Posts from `content/blog/*.mdx`

Code layout: `components/{layout,sections,ui,blog}`, `lib/` (content readers), `types/index.ts`, `__tests__/` mirroring the source tree (fixtures in `__tests__/fixtures/`). `Header` and `UltimoLancamento` are loaded with `next/dynamic(..., { ssr: false })` (router hook / Countdown timer state).

## Content

All editable content lives in `content/`; `public/` holds only images. Domain terms are in `GLOSSARY.md`, the format decision in `docs/adr/0001-conteudo-em-markdown-e-json-versionados.md`.

```
content/
  books/<slug>.md   one Book per file (slug = file name = URL /livros/<slug>)
  about.json        { title, body, body2, image }
  site.json         { slogan, heroWelcome, heroPhotoAlt, aboutPhotoAlt, latestReleaseTitle,
                      booksTitle, booksSubtitle, blogTitle, blogSubtitle, contactTitle, contactSubtitle }
  contact.json      { instagram, instagramUrl, email }
  blog/             MDX posts
```

Book file: frontmatter + body (the body is the Sinopse):

```md
---
title: "..."              # required
releaseDate: "2021-05-01" # required, quoted ISO YYYY-MM-DD
image: "/images/books/x.png" # required, cover under public/images/books/
slogan: "..."             # optional
links:                    # optional, default []
  - { label: "Amazon", url: "https://...", primary: true }
reviews:                  # optional, default []
  - { author: "...", text: "..." }
---
Sinopse...
```

`id` and `direction` are never stored: `lib/books.ts` derives them (id from the sorted slug order, direction alternates over the newest-first list). A 2nd edition is a separate book file that reuses the same cover image.

Readers (`lib/books.ts`, `lib/about.ts`, `lib/contact.ts`, `lib/site.ts`, shared `lib/json-content.ts`) use `fs`, so they run only at build time inside `getStaticProps`/`getStaticPaths`. They fail with a clear error naming the file and field when a required field is missing or malformed.

### Props flow

`getStaticProps` reads content and passes it down as props: `pages/index.tsx` gives `books` to `UltimoLancamento` (first item) and `Books`, `about` to `About`, `contact` to `Contact` and `Footer`, `site` (the "Textos do site") to `Hero`, `Books`, `UltimoLancamento`, `About`, `Contact`, and `site.slogan` to `Header` and `Footer`. `pages/livros/[slug].tsx` passes `book`, `contact` and `site`. Components never touch the disk, so tests pass data directly. Any page that renders `Header` or `Footer` must fetch `contact` and `site` in its own `getStaticProps`. UI labels, navigation and aria-labels stay in code; only editorial text goes in `site.json`.

To add a book: create `content/books/<slug>.md` and put the cover in `public/images/books/`. No code change.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
