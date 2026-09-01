# Fonts

Drop `.woff2` files here. Two things read them:

1. **The real app** — Vite serves `public/` at the site root, so a file here is
   live at `/fonts/<name>.woff2`. Declare it in `src/style.css` with
   `@font-face`, then wire the family into `tailwind.config.js` under
   `theme.extend.fontFamily`.

2. **Design canvas mockups** — the artifact sandbox blocks every font host
   except Google Fonts, so non-Google faces have to be inlined as base64
   `@font-face` data URIs inside each artboard. `tools/font-to-css.mjs`
   generates that block from the files in here.

Prefer `.woff2`. If a foundry ships `.otf`/`.ttf` only, convert first —
it is typically 3-5x smaller as woff2.

Naming: `<Family>-<Weight><Style>.woff2`, e.g. `ClashDisplay-700.woff2`,
`Satoshi-400italic.woff2`. Variable fonts: `<Family>-Variable.woff2`.
