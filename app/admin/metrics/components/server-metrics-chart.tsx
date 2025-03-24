'use client'

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { ServerMetrics } from "../actions"

type MetricPoint = {
  timestamp: string
  cpu: number
  memory: number
  disk: number
}

export function ServerMetricsChart({ metrics: initialMetrics }: { metrics: ServerMetrics }) {
  const [data, setData] = useState<MetricPoint[]>([])

  useEffect(() => {
    // Ajouter le point initial
    const initialPoint = {
      timestamp: new Date().toLocaleTimeString(),
      cpu: initialMetrics.cpu.usage,
      memory: (initialMetrics.memory.used / initialMetrics.memory.total) * 100,
      disk: (initialMetrics.disk.used / initialMetrics.disk.total) * 100,
    }
    setData([initialPoint])

    // Mettre à jour les métriques toutes les 5 secondes
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/metrics')
        const newMetrics: ServerMetrics = await response.json()
        
        setData(prevData => {
          const newPoint = {
            timestamp: new Date().toLocaleTimeString(),
            cpu: newMetrics.cpu.usage,
            memory: (newMetrics.memory.used / newMetrics.memory.total) * 100,
            disk: (newMetrics.disk.used / newMetrics.disk.total) * 100,
          }
          
          // Garder seulement les 20 derniers points
          const newData = [...prevData, newPoint]
          if (newData.length > 20) {
            newData.shift()
          }
          return newData
        })
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [initialMetrics])

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="timestamp"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#2563eb"
            strokeWidth={2}
            name="CPU"
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="#16a34a"
            strokeWidth={2}
            name="Mémoire"
          />
          <Line
            type="monotone"
            dataKey="disk"
            stroke="#dc2626"
            strokeWidth={2}
            name="Disque"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 