#!/usr/bin/env node
// Emit @font-face rules with base64-inlined woff2, for embedding in
// design-canvas artboards (the artifact sandbox blocks non-Google font hosts).
//
//   node tools/font-to-css.mjs public/fonts/ClashDisplay-700.woff2 ...
//   node tools/font-to-css.mjs public/fonts/*.woff2 > /tmp/faces.css
//
// Filename convention: <Family>-<weight><style>.woff2, or <Family>-Variable.woff2

import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'

const files = process.argv.slice(2)
if (!files.length) {
  console.error('usage: node tools/font-to-css.mjs <font.woff2> [...]')
  process.exit(1)
}

const NAMED = { thin: 100, extralight: 200, light: 300, regular: 400, normal: 400,
                medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 }

let total = 0
for (const file of files) {
  const stem = basename(file).replace(/\.woff2$/i, '')
  const [family, spec = 'regular'] = stem.split('-')
  const variable = /^variable$/i.test(spec)
  const style = /italic|oblique/i.test(spec) ? 'italic' : 'normal'
  const token = spec.replace(/italic|oblique/i, '') || 'regular'
  const weight = variable ? '100 900'
    : (NAMED[token.toLowerCase()] ?? (/^\d{3}$/.test(token) ? token : 400))

  const b64 = readFileSync(file).toString('base64')
  total += statSync(file).size
  console.log(`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;charset=utf-8;base64,${b64}) format('woff2')}`)
}
console.error(`${files.length} face(s), ${(total / 1024).toFixed(0)} KB raw / ~${(total * 1.37 / 1024).toFixed(0)} KB inlined`)
