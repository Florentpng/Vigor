import type { WeightEntry } from './weights'

export type ChartPadding = { top: number; right: number; bottom: number; left: number }

export type ChartPoint = { id: string; date: string; kg: number; x: number; y: number }

export type WeightChart = {
  points: ChartPoint[]
  path: string // tracé de la courbe (attribut `d` d'un <path> SVG)
  yTicks: { value: number; y: number }[]
  xLabels: { text: string; x: number }[]
  left: number // limites de la zone de tracé
  right: number
  top: number
  bottom: number
}

const DAY = 24 * 60 * 60 * 1000

function toTime(date: string) {
  return Date.parse(`${date}T12:00:00Z`)
}

// "2026-11-19" -> "19 nov." (avec l'année si elle change entre la première et la dernière pesée)
export function formatChartDate(date: string, withYear: boolean) {
  return new Date(toTime(date)).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  })
}

// Point le plus proche d'une position (x, y) dans le graphique
export function nearestPoint(points: ChartPoint[], x: number, y: number): number {
  let best = 0
  let bestDistance = Infinity
  points.forEach((p, i) => {
    const distance = (p.x - x) ** 2 + (p.y - y) ** 2
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  })
  return best
}

// Géométrie de la courbe de poids ; `entries` : au moins 2 pesées, de la plus ancienne à la plus récente.
export function buildWeightChart(
  entries: WeightEntry[],
  width: number,
  height: number,
  pad: ChartPadding
): WeightChart {
  const left = pad.left
  const right = width - pad.right
  const top = pad.top
  const bottom = height - pad.bottom

  // Axe des poids : bornes entières, 3 intervalles de même taille
  const weights = entries.map((e) => e.weight_kg)
  const lo = Math.floor(Math.min(...weights) - 0.5)
  const hi = Math.ceil(Math.max(...weights) + 0.5)
  const step = Math.max(1, Math.ceil((hi - lo) / 3))
  const yMin = lo
  const yMax = lo + step * 3
  const y = (kg: number) => bottom - ((kg - yMin) / (yMax - yMin)) * (bottom - top)

  // Axe du temps : proportionnel aux dates réelles
  const t0 = toTime(entries[0].measured_on)
  const t1 = toTime(entries[entries.length - 1].measured_on)
  const span = Math.max(t1 - t0, DAY)
  const x = (date: string) => left + ((toTime(date) - t0) / span) * (right - left)

  const points = entries.map((e) => ({
    id: e.id,
    date: e.measured_on,
    kg: e.weight_kg,
    x: x(e.measured_on),
    y: y(e.weight_kg),
  }))

  const withYear = entries[0].measured_on.slice(0, 4) !== entries[entries.length - 1].measured_on.slice(0, 4)

  return {
    points,
    path: points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),
    yTicks: [0, 1, 2, 3].map((i) => ({ value: yMin + step * i, y: y(yMin + step * i) })),
    xLabels: [
      { text: formatChartDate(entries[0].measured_on, withYear), x: left },
      { text: formatChartDate(entries[entries.length - 1].measured_on, withYear), x: right },
    ],
    left,
    right,
    top,
    bottom,
  }
}
