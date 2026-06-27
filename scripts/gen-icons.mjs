// Gera ícones PNG do PWA (sem dependências externas).
// Fundo navy (#0f172a) com monograma "E" branco.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const NAVY = [15, 23, 42]
const WHITE = [248, 250, 252]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function makePNG(size) {
  const px = (x, y) => {
    // monograma "E": três barras horizontais + uma vertical, centralizado
    const m = size * 0.26 // margem
    const w = size - m * 2
    const th = w * 0.17 // espessura
    const left = m
    const right = m + w
    const top = m
    const bottom = m + w
    const inE =
      (x >= left && x <= left + th && y >= top && y <= bottom) || // vertical
      (y >= top && y <= top + th && x >= left && x <= right) || // topo
      (y >= (top + bottom) / 2 - th / 2 && y <= (top + bottom) / 2 + th / 2 && x >= left && x <= right * 0.92) || // meio
      (y >= bottom - th && y <= bottom && x >= left && x <= right) // base
    return inE ? WHITE : NAVY
  }

  const raw = Buffer.alloc((size * 4 + 1) * size)
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filtro none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = 255
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const idat = deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makePNG(size))
  console.log(`icon-${size}.png gerado`)
}
