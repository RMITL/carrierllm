# Storybook Guide (a11y-first)
Setup: Storybook v8 with React + Vite.

Addons: essentials, a11y, interactions.

Imports theme.css + Tailwind global.css.

Stories:

Button (variants, sizes)

Banner (info, warning, error, success)

UsageMeter (default, near limit, over limit)

CarrierCard (high/medium/low fit)

Accessibility:

Axe-core integration -> no color-contrast violations.

Manual checks: focus-visible outlines, ARIA roles.

CI: GitHub Actions to build + upload artifacts. Optional Chromatic for visual regression.


