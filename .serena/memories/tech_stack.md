# Tech Stack

- **Language**: JavaScript (no TypeScript)
- **Framework**: Next.js 13.4.x (Pages Router)
- **UI Library**: NextUI v1 beta (`@nextui-org/react ^1.0.0-beta.13`) — all components wrapped in `NextUIProvider`
- **Icons**: `@react-icons/all-files ^4.1.0`
- **Carousel**: `react-responsive-carousel ^3.2.23`
- **Device detection**: `react-device-detect ^2.2.3`
- **HTTP**: `axios ^1.4.0`
- **Routing**: Next.js file-based routing (not react-router-dom despite it being in deps)
- **Linting**: ESLint with `next/core-web-vitals` config
- **Git hooks**: Husky 8 + commitlint (conventional commits, config in `commitlint.config.js` and `.commit-msg.conf`)
- **Releases**: `standard-version` (generates CHANGELOG.md, bumps version)
- **Deploy**: Netlify (no config file present; likely auto-detected Next.js)
- **Node**: 16+
- **Package manager**: npm
