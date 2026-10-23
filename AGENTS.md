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

## LOCAL WORKFLOW (OWNER PREFERENCE)
- On the owner's current PC, use `E:\DEAFHUB` as the working checkout. Read, search, edit, and verify source files locally to reduce repeated GitHub requests and context usage.
- Work on `preview/deafhub-setup`. Check the branch and working-tree status before changes; preserve existing local edits.
- Use GitHub for synchronization, remote history, collaboration, and saving verified commits. Prefer Git CLI for repository operations; use connected GitHub tools when needed for remote-only information or when CLI access is unavailable.
- Fetch and compare remote state at the start of a work session and before pushing. Do not repeatedly fetch unchanged files through the GitHub connector or download ZIP copies for routine local work.
- Run checks appropriate to the change locally, then commit and push verified changes to the Preview branch. Report actual commit SHAs and distinguish local verification from deployed Preview checks.
- Never modify `main`, production `www.deafhub.cc`, payments, or approved design without the owner's explicit authorization for that scope.
