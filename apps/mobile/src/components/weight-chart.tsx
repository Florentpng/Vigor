import { useState } from 'react'
import { type GestureResponderEvent, Text, useColorScheme, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg'

import { buildWeightChart, formatChartDate, nearestPoint } from '@vigor/shared/weight-chart'
import type { WeightEntry } from '@vigor/shared/weights'

import { useAccent } from '@/lib/theme'

const HEIGHT = 220
const PAD = { top: 12, right: 12, bottom: 30, left: 38 }

// Courbe du poids ; `entries` du plus ancien au plus récent (au moins 2).
// Un appui (ou un glissement) sur le graphique affiche la pesée la plus proche.
export default function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const accent = useAccent()
  const dark = useColorScheme() === 'dark'
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)

  const grid = dark ? '#334155' : '#e2e8f0'
  const muted = dark ? '#8b9bb0' : '#64748b'
  const withYear = entries[0].measured_on.slice(0, 4) !== entries[entries.length - 1].measured_on.slice(0, 4)

  const chart = width > 0 ? buildWeightChart(entries, width, HEIGHT, PAD) : null
  const point = chart && active !== null ? chart.points[active] : null

  function select(e: GestureResponderEvent) {
    if (!chart) return
    setActive(nearestPoint(chart.points, e.nativeEvent.locationX, e.nativeEvent.locationY))
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* Zone d'information : toujours réservée, pour que le graphique ne saute pas */}
      <View className="mb-1 h-7 justify-center">
        {point ? (
          <Text className="text-sm text-gray-500 dark:text-zinc-400">
            <Text className="font-display text-xl text-gray-900 dark:text-white">{point.kg} kg</Text>
            {'  '}
            {formatChartDate(point.date, withYear)}
          </Text>
        ) : (
          <Text className="text-xs text-gray-500 dark:text-zinc-400">Touche le graphique pour voir une pesée.</Text>
        )}
      </View>

      {chart ? (
        <View onStartShouldSetResponder={() => true} onResponderGrant={select} onResponderMove={select}>
          <Svg width={width} height={HEIGHT} pointerEvents="none">
            {chart.yTicks.map((t) => (
              <G key={t.value}>
                <Line x1={chart.left} x2={chart.right} y1={t.y} y2={t.y} stroke={grid} strokeWidth={1} />
                <SvgText x={chart.left - 8} y={t.y + 4} fontSize={12} fill={muted} textAnchor="end">
                  {String(t.value)}
                </SvgText>
              </G>
            ))}
            {chart.xLabels.map((l, i) => (
              <SvgText
                key={l.text}
                x={l.x}
                y={HEIGHT - 8}
                fontSize={12}
                fill={muted}
                textAnchor={i === 0 ? 'start' : 'end'}
              >
                {l.text}
              </SvgText>
            ))}
            {point ? (
              <Line x1={point.x} x2={point.x} y1={chart.top} y2={chart.bottom} stroke={muted} strokeWidth={1} />
            ) : null}
            <Path d={chart.path} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {chart.points.map((p, i) => (
              <Circle key={p.id} cx={p.x} cy={p.y} r={i === active ? 6 : 4} fill={accent} />
            ))}
          </Svg>
        </View>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  )
}
