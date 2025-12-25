# DEAF|HUB Project Constraints (AGENTS.md / STATE_LOCK.md)

## DESIGN BANS (STRICT)
- **NO Video Backgrounds**: Only static or R3F-based minimalist backgrounds.
- **NO Background Blurs**: Use solid colors or low-opacity fills for premium feel.
- **NO Zoom Effects**: Avoid scroll-driven zoom on backgrounds.
- **NO Game Images**: Use neutral premium placeholders (gradients/patterns) until official assets are provided.
- **NO Heavy Postprocessing**: Keep `@react-three/postprocessing` OFF by default for 240Hz-safe performance.

## PERFORMANCE TARGETS
- **240Hz Safe**: Animations must be lightweight (opacity/translate).
- **Single Canvas**: All 3D content must use the shared `GlobalCanvas` via `View`.
- **Demand Frameloop**: R3F must only render when items are visible or on interaction.

## BRAND IDENTITY
- **Dark Theme**: #0A0F14 background.
- **Accent**: #22D3EE (Cyan).
- **Text**: #EAFBFF.
- **Rounding**: `rounded-2xl` (16px) or `rounded-3xl` (20px).
- **Cards**: `border: white 10-12%`, `bg: white 4-6%`.
