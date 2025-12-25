# Changelog - DEAF|HUB v2

## [0.1.0] - 2025-12-24

### Added
- **Core Architecture**: Next.js 16 (App Router) + TypeScript + Tailwind v4.
- **3D System**: Global R3F Canvas with `View`-based avatar embedding for high performance.
- **I18n**: Multi-language support (RU/EN) via Zustand store and local dictionaries.
- **Shell**: Sticky header with logo and language toggle, mobile bottom navigation.
- **Pages**:
    - `Home`: Dense layout with hero, featured games, stats, news, and roadmap.
    - `Live`: Tabs for tournament/match listings with live status indicators.
    - `Tournaments`: Filterable tournament cards and live bracket visualization using `@xyflow/react`.
    - `Team`: Recruitment UI with incoming requests and active roster display.
    - `Profile`: User stats, 3D avatar view, match history table, and trophy cabinet.
- **Design**: Premium dark theme (#0A0F14) with Cyan accent (#22D3EE), 16-20px rounded corners, and micro-animations.
- **Experience**: Lenis smooth scroll with reduced-motion support.

### Assets
- Logo copied from user D: drive to `/public/brand/dh.png`.
- Custom inline SVG flags for RU/GB.
