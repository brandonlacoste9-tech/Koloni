# AdGenXAI Assets - Liquid Gradient Backgrounds

Binary assets are no longer committed to this repository. The landing hero now renders a layered, purely CSS-driven gradient so the experience remains lightweight and deployable without external downloads.

## Optional: bring your own background

If you want bespoke artwork instead of the CSS gradients:

1. Export your gradient artwork as optimized WebP (target < 300KB) in desktop (1920x1080) and mobile portrait (1080x1920) sizes.
2. Save them in this folder using the existing names (`liquid-hero-desktop.webp`, `liquid-hero-mobile.webp`, or `liquid-hero-1.webp`–`3.webp`).
3. Deploy as usual; the `<picture>` sources can be re-enabled by referencing these filenames.

Keeping the repository text-only by default keeps previews functional while honoring binary-free environments.
