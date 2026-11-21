// 用 antvis/china-geojson（MIT）生成中国地图 SVG 路径。
// 用法：node scripts/build-china-map.mjs <path/to/china.json>
// 输出：src/mysites/assets/china-map.js
//
// 说明：
//   - 采用 Albers 等积圆锥投影（标准纬线 25° / 47°，中央经线 105°），
//     对中国的形变比 Mercator 小。
//   - 「南海诸岛」在原数据里是独立的一块，这里按标准中国地图的做法缩成右下角小图，
//     并带一个外框，避免它把整个版图拉长。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CN_PROVINCE_NAMES,
  CN_PROVINCE_MAP_IDS,
} from '../src/mysites/utils/geo.js'

const here = dirname(fileURLToPath(import.meta.url))
const src = process.argv[2]
if (!src) {
  console.error('usage: node scripts/build-china-map.mjs <china.geojson>')
  process.exit(1)
}

const geo = JSON.parse(readFileSync(resolve(src), 'utf8'))
const features = geo.features || []
const southSea = features.find((f) => f.properties?.name === '南海诸岛')
const mainland = features.filter((f) => f.properties?.name !== '南海诸岛')

const RAD = Math.PI / 180
const P1 = 25 * RAD
const P2 = 47 * RAD
const L0 = 105 * RAD
const P0 = 35 * RAD
const n = (Math.sin(P1) + Math.sin(P2)) / 2
const C = Math.cos(P1) ** 2 + 2 * n * Math.sin(P1)
const rho0 = Math.sqrt(C - 2 * n * Math.sin(P0)) / n

function project([lon, lat]) {
  const rho = Math.sqrt(Math.max(C - 2 * n * Math.sin(lat * RAD), 0)) / n
  const theta = n * (lon * RAD - L0)
  return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)]
}

function eachRing(geometry, fn) {
  if (!geometry) return
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(fn)
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly.forEach(fn))
  }
}

// Ramer–Douglas–Peucker（在屏幕坐标上做，单位是 px）
function rdp(points, eps) {
  if (points.length <= 4) return points
  const sq = eps * eps
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1

  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    const [x1, y1] = points[start]
    const [x2, y2] = points[end]
    const dx = x2 - x1
    const dy = y2 - y1
    const lenSq = dx * dx + dy * dy

    let maxDist = -1
    let index = -1
    for (let i = start + 1; i < end; i++) {
      const [px, py] = points[i]
      let d
      if (lenSq === 0) {
        d = (px - x1) ** 2 + (py - y1) ** 2
      } else {
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
        d = (px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2
      }
      if (d > maxDist) {
        maxDist = d
        index = i
      }
    }

    if (maxDist > sq && index > 0) {
      keep[index] = 1
      stack.push([start, index], [index, end])
    }
  }

  return points.filter((_, i) => keep[i])
}

function fmt(v) {
  return Number(v.toFixed(1)).toString()
}

const WIDTH = 900
const PAD = 10

// 先投影所有大陆要素，算 bbox
const projected = []
let minX = Infinity
let minY = Infinity
let maxX = -Infinity
let maxY = -Infinity

for (const f of mainland) {
  const rings = []
  eachRing(f.geometry, (ring) => {
    const pts = ring.map(project)
    rings.push(pts)
  })
  for (const pts of rings) {
    for (const [x, y] of pts) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  projected.push({ name: f.properties.name, rings })
}

const scale = (WIDTH - PAD * 2) / (maxX - minX)
const HEIGHT = Math.round((maxY - minY) * scale + PAD * 2)

function toSvg([x, y]) {
  return [PAD + (x - minX) * scale, PAD + (maxY - y) * scale]
}

function ringToPath(ring) {
  const pts = rdp(ring.map(toSvg), 0.55)
  if (pts.length < 3) return ''
  let d = ''
  pts.forEach(([x, y], i) => {
    d += `${i === 0 ? 'M' : 'L'}${fmt(x)},${fmt(y)}`
  })
  return `${d}Z`
}

const nameToId = {}
for (const [code, name] of Object.entries(CN_PROVINCE_NAMES)) {
  const id = CN_PROVINCE_MAP_IDS[code]
  if (id) nameToId[name] = id
}
nameToId['台湾'] = CN_PROVINCE_MAP_IDS.TW

const locations = []
const unmatched = []

for (const { name, rings } of projected) {
  const id = nameToId[name]
  if (!id) {
    unmatched.push(name)
    continue
  }
  const d = rings.map(ringToPath).filter(Boolean).join('')
  if (d) locations.push({ id, name, path: d })
}

// 南海诸岛：缩成右下角小图
let frames = []
let insetLines = []
if (southSea) {
  let sx0 = Infinity
  let sy0 = Infinity
  let sx1 = -Infinity
  let sy1 = -Infinity
  const raw = []
  eachRing(southSea.geometry, (ring) => raw.push(ring))

  for (const ring of raw) {
    for (const [x, y] of ring) {
      if (x < sx0) sx0 = x
      if (x > sx1) sx1 = x
      if (y < sy0) sy0 = y
      if (y > sy1) sy1 = y
    }
  }

  const boxW = 80
  const boxH = 110
  const gap = 6
  const boxX = WIDTH - boxW - gap
  const boxY = HEIGHT - boxH - gap
  const s = Math.min(boxW / (sx1 - sx0), boxH / (sy1 - sy0))

  const offsetX = boxX + (boxW - (sx1 - sx0) * s) / 2
  const offsetY = boxY + (boxH - (sy1 - sy0) * s) / 2

  const toBox = ([x, y]) => [
    offsetX + (x - sx0) * s,
    offsetY + (sy1 - y) * s,
  ]

  const filled = []
  const lines = []

  for (const ring of raw) {
    const pts = rdp(ring.map(toBox), 0.35)
    if (pts.length < 2) continue

    // 九段线在原始数据里是极细的三角形，缩到小图里会消失，按线段描边画
    if (ring.length <= 4) {
      const [a, b] = pts
      lines.push(`M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`)
      continue
    }

    let path = ''
    pts.forEach(([x, y], i) => {
      path += `${i === 0 ? 'M' : 'L'}${fmt(x)},${fmt(y)}`
    })
    if (path) filled.push(`${path}Z`)
  }

  if (filled.length) {
    locations.push({ id: 'south-sea', name: '南海诸岛', path: filled.join('') })
  }
  frames = [
    `M${fmt(boxX)},${fmt(boxY)}H${fmt(boxX + boxW)}V${fmt(boxY + boxH)}H${fmt(boxX)}Z`,
  ]
  insetLines = lines
}

const output = {
  label: 'Map of China',
  viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
  frames,
  lines: insetLines,
  locations,
}

const outPath = resolve(here, '../src/mysites/assets/china-map.js')
mkdirSync(dirname(outPath), { recursive: true })
const header = `// 自动生成，勿手改；生成脚本：scripts/build-china-map.mjs
// 数据来源：https://github.com/antvis/china-geojson （MIT License）
// 投影：Albers 等积圆锥（25° / 47°，中央经线 105°）；含台湾、南海诸岛小图。
`
writeFileSync(
  outPath,
  `${header}export default ${JSON.stringify(output)}\n`,
  'utf8'
)

const bytes = JSON.stringify(output).length
console.log(
  `written ${outPath} (${(bytes / 1024).toFixed(1)} KB), locations=${locations.length}, unmatched=${unmatched.join(',') || 'none'}`
)
