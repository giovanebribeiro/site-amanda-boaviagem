# Conventions

## Data Files (`public/data/`)

Each file exports a default const with an `items` array (or named sub-arrays for banners):
- `DataStore` — `items[]`: `{id, title, description, image, linkAmazon, linkUiclap, direction}`
- `DataIntro` — separate `bannersDesktop[]` and `bannersMobile[]` for responsive banner images
- `DataTestimonials` — separate `Images[]` and `ImagesMobile[]`
- `DataAbout`, `DataHopeWriter` — single `items[]`

Adding content = adding an object to the relevant array in the data file. No rebuild required for content-only changes (static imports).

## Component Patterns

- Section components are function components; no class components
- Device-dependent sections use `next/dynamic(() => import(...), { ssr: false })`
- `isInitialPage` boolean prop distinguishes home-page context from sub-page context
- Global styles are inlined via `<style jsx global>` in page files; component-level styles use CSS modules or inline styles

## Commit Format

Conventional Commits: `<type>(<scope>): <subject>` enforced by commitlint + Husky.
