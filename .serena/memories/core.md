# Core

Personal website for Brazilian author Amanda Boaviagem. Static Next.js 13 site deployed on Netlify.

## Source Map

- `pages/index.js` — Main SPA page; assembles all section components in order: Header → Intro → About → Store → HopeWriter → WriterCertification → InstaFeed → Testimonials → ContactUs → Footer
- `pages/store/index.js` — Dedicated store sub-page; reuses `Store`, `HeaderProject`, `FooterProject` with `isInitialPage={false}`
- `pages/components/` — All section components (one file per section)
- `public/data/` — Static content as JS const objects (`DataStore`, `DataIntro`, `DataAbout`, `DataHopeWriter`, `DataTestimonials`)
- `styles/` — Global CSS and Home module CSS

## Key Invariants

- No backend, no API calls to own server; all content is static in `public/data/`
- Components that depend on device detection (`Intro`, `Testimonials`, `Store`, `HopeWriter`) use `next/dynamic` with `ssr: false`
- `HeaderProject` and `Store` accept `isInitialPage` prop (true on home page, false on /store page) to control appearance/behavior
- Data files export a default const with an `items` array; the store "show more" button only appears when `items.length > 2`
- Responsive images: data files contain separate entries/keys for desktop vs mobile; preferred image format is SVG
