// Gera os ícones do PWA a partir do wordmark oficial da ELIÁ (branco) sobre fundo navy.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const NAVY = { r: 15, g: 23, b: 42, alpha: 1 }
const wordmark = join(root, 'public', 'brand', 'wordmark_white.png')

async function makeIcon(size, { padding = 0.18, maskable = false } = {}) {
  // área útil do wordmark dentro do quadrado
  const pad = maskable ? 0.26 : padding
  const innerW = Math.round(size * (1 - pad * 2))

  const mark = await sharp(wordmark)
    .resize({ width: innerW, fit: 'inside' })
    .toBuffer()
  const meta = await sharp(mark).metadata()

  const left = Math.round((size - (meta.width ?? innerW)) / 2)
  const top = Math.round((size - (meta.height ?? 0)) / 2)

  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer()
}

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const t of targets) {
  const buf = await makeIcon(t.size, { maskable: t.maskable })
  await sharp(buf).toFile(join(outDir, t.name))
  console.log(`${t.name} gerado (${t.size}px)`) // eslint-disable-line no-console
}

// favicon 64px (navy quadrado arredondado é tratado no SVG; aqui geramos PNG simples)
await sharp(await makeIcon(64, { padding: 0.14 })).toFile(join(outDir, 'favicon-64.png'))
console.log('favicon-64.png gerado')
