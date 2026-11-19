'use client'

import { useEffect, useRef, useState } from 'react'
import { buildWeightChart, formatChartDate, nearestPoint } from '@vigor/shared/weight-chart'
import type { WeightEntry } from '@vigor/shared/weights'

const H = 220 // hauteur fixe : seule la largeur suit celle de la carte
const PAD = { top: 16, right: 16, bottom: 32, left: 44 }

// Courbe du poids ; `entries` du plus ancien au plus récent (au moins 2)
export default function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const [active, setActive] = useState<number | null>(null)
  const [W, setWidth] = useState(640)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(Math.round(entry.contentRect.width), 240)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const chart = buildWeightChart(entries, W, H, PAD)
  const withYear = entries[0].measured_on.slice(0, 4) !== entries[entries.length - 1].measured_on.slice(0, 4)
  const point = active === null ? null : chart.points[active]

  // Point le plus proche du pointeur
  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    setActive(nearestPoint(chart.points, x, y))
  }

  return (
    <div ref={box} className="relative">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block touch-pan-y"
        role="img"
        aria-label={`Courbe de poids, de ${entries[0].weight_kg} kg à ${entries[entries.length - 1].weight_kg} kg`}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setActive(null)}
      >
        {chart.yTicks.map((t) => (
          <g key={t.value}>
            <line x1={chart.left} x2={chart.right} y1={t.y} y2={t.y} className="stroke-gray-200" strokeWidth={1} />
            <text x={chart.left - 8} y={t.y + 4} textAnchor="end" className="fill-gray-500 text-[12px]">
              {t.value}
            </text>
          </g>
        ))}
        {chart.xLabels.map((l, i) => (
          <text
            key={l.text}
            x={l.x}
            y={H - 8}
            textAnchor={i === 0 ? 'start' : 'end'}
            className="fill-gray-500 text-[12px]"
          >
            {l.text}
          </text>
        ))}

        {point && (
          <line x1={point.x} x2={point.x} y1={chart.top} y2={chart.bottom} className="stroke-gray-400" strokeWidth={1} />
        )}
        <path d={chart.path} fill="none" className="stroke-blue-600" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {chart.points.map((p, i) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={i === active ? 6 : 4} className="fill-blue-600" />
        ))}
      </svg>

      {point && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border bg-white px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: `${Math.min(Math.max((point.x / W) * 100, 12), 88)}%`,
            top: `${(point.y / H) * 100}%`,
            marginTop: -10,
          }}
        >
          <p className="font-semibold text-gray-900">{point.kg} kg</p>
          <p className="text-gray-500">{formatChartDate(point.date, withYear)}</p>
        </div>
      )}
    </div>
  )
}
