// SkateFit icon pipeline. Regenerates every app icon, splash screen and
// favicon from one source of truth, in priority order:
//   1. branding/icon.svg  (the real brand icon — vector, best quality)
//   2. branding/icon.png  (raster fallback)
//   3. a built-in placeholder mark in brand colors
// Also publishes the in-app logo assets: public/brand-icon.svg and a
// dark-background recolor of branding/wordmark.svg → public/wordmark.svg.
// Run from the repo root:  node branding/generate-icons.mjs
// (needs sharp: npm i --no-save sharp)
import sharp from 'sharp'
import { existsSync, readdirSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const TEAL = '#2DD4BF'
const SRC_SVG = 'branding/icon.svg'
const SRC_PNG = 'branding/icon.png'
const WORDMARK = 'branding/wordmark.svg'
const hasSvg = existsSync(SRC_SVG)
const hasPng = !hasSvg && existsSync(SRC_PNG)

// The real icon draws its own dark rounded tile; splashes and adaptive-icon
// backgrounds must match that exact color so edges disappear.
const ICON_BG = hasSvg ? '#16171a' : '#0D1117'
const BG_RGB = hasSvg ? { r: 22, g: 23, b: 26 } : { r: 13, g: 17, b: 23 }

// ---- placeholder mark (used only when no real icon file exists) -----------
function markSvg({ size = 512, background = null, rx = 0 } = {}) {
  const bg = background ? `<rect width="512" height="512" rx="${rx}" fill="${background}"/>` : ''
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  ${bg}
  <g stroke="${TEAL}" stroke-linecap="round" fill="none">
    <path d="M64 206 H188" stroke-width="17" opacity="0.95"/>
    <path d="M46 254 H150" stroke-width="13" opacity="0.8"/>
    <path d="M78 300 H160" stroke-width="10" opacity="0.6"/>
  </g>
  <text x="298" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold" font-size="318"
        fill="#FFFFFF" text-anchor="middle">S</text>
  <rect x="150" y="352" width="250" height="32" rx="16" fill="${TEAL}"/>
  <g>
    <circle cx="186" cy="412" r="26" fill="#FFFFFF"/><circle cx="186" cy="412" r="9" fill="${ICON_BG}"/>
    <circle cx="248" cy="412" r="26" fill="#FFFFFF"/><circle cx="248" cy="412" r="9" fill="${ICON_BG}"/>
    <circle cx="310" cy="412" r="26" fill="#FFFFFF"/><circle cx="310" cy="412" r="9" fill="${ICON_BG}"/>
    <circle cx="372" cy="412" r="26" fill="#FFFFFF"/><circle cx="372" cy="412" r="9" fill="${ICON_BG}"/>
  </g>
</svg>`)
}

// Render the icon art at `size` on a transparent square. The real SVG tile
// keeps its own rounded corners (transparent outside them).
async function artPng(size) {
  if (hasSvg) {
    return sharp(SRC_SVG, { density: Math.max(96, (size / 1127) * 96) })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer()
  }
  if (hasPng) {
    const trimmed = await sharp(SRC_PNG).trim({ threshold: 40 }).toBuffer()
    const art = await sharp(trimmed)
      .resize(size, size, { fit: 'contain', background: ICON_BG })
      .flatten({ background: ICON_BG }).png().toBuffer()
    const r = Math.round(size * 0.23)
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`)
    return sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  }
  return sharp(markSvg({ background: ICON_BG, rx: Math.round(512 * 0.23) })).resize(size, size).png().toBuffer()
}

// Full-bleed square: art flattened onto the tile color (no transparent corners).
async function squarePng(size) {
  return sharp(await artPng(size)).flatten({ background: ICON_BG }).png().toBuffer()
}

// Circle-masked (Android round icons).
async function roundPng(size) {
  const sq = await squarePng(size)
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`)
  return sharp(sq).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

// Art scaled into the center of a transparent canvas (adaptive foreground).
async function markPng(canvas, scale) {
  const inner = Math.round(canvas * scale)
  const art = await artPng(inner)
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'center' }]).png().toBuffer()
}

// Splash / maskable: solid tile-color background with the art centered.
async function solidWithMark(w, h, markScale) {
  const inner = Math.round(Math.min(w, h) * markScale)
  const art = await artPng(inner)
  return sharp({ create: { width: w, height: h, channels: 4, background: { ...BG_RGB, alpha: 1 } } })
    .composite([{ input: art, gravity: 'center' }]).png().toBuffer()
}

async function main() {
  console.log(hasSvg ? 'Using real vector icon: branding/icon.svg' : hasPng ? 'Using raster icon: branding/icon.png' : 'Using built-in placeholder mark')

  // --- in-app logo assets ---
  if (hasSvg) {
    writeFileSync('public/brand-icon.svg', readFileSync(SRC_SVG))
    writeFileSync('public/icon.svg', readFileSync(SRC_SVG))
  } else {
    const svg = markSvg({ background: ICON_BG, rx: 118 }).toString()
    writeFileSync('public/brand-icon.svg', svg)
    writeFileSync('public/icon.svg', svg)
  }
  if (existsSync(WORDMARK)) {
    // The wordmark ships with dark letters for light backgrounds — recolor
    // them off-white for the app's dark UI, keeping the teal "Fit".
    const recolored = readFileSync(WORDMARK, 'utf8')
      .replaceAll('#0f151b', '#EAEAEA')
      .replaceAll('#0F151B', '#EAEAEA')
    writeFileSync('public/wordmark.svg', recolored)
    console.log('wordmark recolored for dark background → public/wordmark.svg')
  }

  // --- web / PWA ---
  writeFileSync('public/favicon-32x32.png', await artPng(32))
  writeFileSync('public/apple-touch-icon.png', await squarePng(180))
  for (const s of [192, 512]) {
    writeFileSync(`public/pwa-${s}x${s}.png`, await artPng(s))
    writeFileSync(`public/pwa-maskable-${s}x${s}.png`, await solidWithMark(s, s, 0.72))
  }
  console.log('web/PWA icons done')

  // --- Android launcher + splash: regenerate every existing asset at its own size ---
  const res = 'android/app/src/main/res'
  for (const dir of readdirSync(res)) {
    const full = join(res, dir)
    if (!statSync(full).isDirectory()) continue
    for (const f of readdirSync(full)) {
      if (!f.endsWith('.png')) continue
      const path = join(full, f)
      const { width, height } = await sharp(path).metadata()
      let out
      if (f === 'ic_launcher.png') out = await artPng(width)
      else if (f === 'ic_launcher_round.png') out = await roundPng(width)
      else if (f === 'ic_launcher_foreground.png') out = await markPng(width, 0.58)
      else if (f === 'splash.png') out = await solidWithMark(width, height, 0.28)
      else continue
      writeFileSync(path, out)
    }
  }
  writeFileSync(`${res}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${ICON_BG}</color>\n</resources>\n`)
  console.log('Android icons + splashes done')
}

main().catch((e) => { console.error(e); process.exit(1) })
