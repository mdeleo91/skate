// SkateFit icon pipeline. Regenerates every app icon, splash screen and
// favicon from one source of truth:
//   - branding/icon.png  (the real brand icon, if present — preferred)
//   - otherwise a built-in placeholder mark in brand colors
// Run from the repo root:  node branding/generate-icons.mjs
// (needs sharp: npm i --no-save sharp)
import sharp from 'sharp'
import { existsSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MIDNIGHT = '#0D1117' // icon/splash background (near-black from the brand sheet)
const TEAL = '#2DD4BF'

// ---- placeholder mark (used until branding/icon.png exists) ---------------
// Dark tile, white S, teal chassis + wheels, teal motion streaks. A clean
// geometric stand-in for the real S-skate logo — same palette, same idea.
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
    <circle cx="186" cy="412" r="26" fill="#FFFFFF"/><circle cx="186" cy="412" r="9" fill="${MIDNIGHT}"/>
    <circle cx="248" cy="412" r="26" fill="#FFFFFF"/><circle cx="248" cy="412" r="9" fill="${MIDNIGHT}"/>
    <circle cx="310" cy="412" r="26" fill="#FFFFFF"/><circle cx="310" cy="412" r="9" fill="${MIDNIGHT}"/>
    <circle cx="372" cy="412" r="26" fill="#FFFFFF"/><circle cx="372" cy="412" r="9" fill="${MIDNIGHT}"/>
  </g>
</svg>`)
}

const SOURCE = 'branding/icon.png'
const hasRealIcon = existsSync(SOURCE)

// TILE: the app-icon artwork on its dark rounded square (transparent corners).
// MARK: the artwork alone on transparency (adaptive foregrounds, splashes).
async function tilePng(size, { rx = 0.23, square = false } = {}) {
  if (hasRealIcon) {
    // Trim any margin, fit onto a dark square, optionally round the corners.
    const trimmed = await sharp(SOURCE).trim({ threshold: 40 }).toBuffer()
    const art = await sharp(trimmed)
      .resize(size, size, { fit: 'contain', background: MIDNIGHT })
      .flatten({ background: MIDNIGHT })
      .png().toBuffer()
    if (square) return art
    const r = Math.round(size * rx)
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`)
    return sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  }
  return sharp(markSvg({ background: MIDNIGHT, rx: square ? 0 : Math.round(512 * 0.23) }))
    .resize(size, size).png().toBuffer()
}

async function markPng(canvas, scale) {
  const inner = Math.round(canvas * scale)
  let art
  if (hasRealIcon) {
    const trimmed = await sharp(SOURCE).trim({ threshold: 40 }).toBuffer()
    art = await sharp(trimmed).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    // The real icon carries its own dark tile — round its corners so the
    // adaptive-icon foreground doesn't show hard square edges.
    const r = Math.round(inner * 0.23)
    const mask = Buffer.from(`<svg width="${inner}" height="${inner}"><rect width="${inner}" height="${inner}" rx="${r}" fill="#fff"/></svg>`)
    art = await sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  } else {
    art = await sharp(markSvg({})).resize(inner, inner).png().toBuffer()
  }
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'center' }]).png().toBuffer()
}

async function solidWithMark(w, h, markScale) {
  const inner = Math.round(Math.min(w, h) * markScale)
  const art = await tilePng(inner)
  const [r, g, b] = [13, 17, 23] // MIDNIGHT
  return sharp({ create: { width: w, height: h, channels: 4, background: { r, g, b, alpha: 1 } } })
    .composite([{ input: art, gravity: 'center' }]).png().toBuffer()
}

async function main() {
  console.log(hasRealIcon ? 'Using real icon: branding/icon.png' : 'Using built-in placeholder mark')

  // --- web / PWA ---
  writeFileSync('public/icon.svg', hasRealIcon
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><image width="512" height="512" href="data:image/png;base64,${(await tilePng(512)).toString('base64')}"/></svg>`
    : markSvg({ background: MIDNIGHT, rx: 118 }).toString())
  writeFileSync('public/favicon-32x32.png', await tilePng(32, { rx: 0.18 }))
  writeFileSync('public/apple-touch-icon.png', await tilePng(180, { square: true }))
  for (const s of [192, 512]) {
    writeFileSync(`public/pwa-${s}x${s}.png`, await tilePng(s))
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
      if (f === 'ic_launcher.png') out = await tilePng(width)
      else if (f === 'ic_launcher_round.png') out = await tilePng(width, { rx: 0.5 })
      else if (f === 'ic_launcher_foreground.png') out = await markPng(width, 0.58)
      else if (f === 'splash.png') out = await solidWithMark(width, height, 0.28)
      else continue
      writeFileSync(path, out)
    }
  }
  writeFileSync(`${res}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${MIDNIGHT}</color>\n</resources>\n`)
  console.log('Android icons + splashes done')
}

main().catch((e) => { console.error(e); process.exit(1) })
