import { CircuitBoard, Cpu, HardDrive, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ServerMetrics } from "../actions"

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  return `${days}j ${hours}h ${minutes}m`
}

export function ServerMetricsCards({ metrics }: { metrics: ServerMetrics }) {
  const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100
  const diskUsagePercent = (metrics.disk.used / metrics.disk.total) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.cpu.usage.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.cpu.cores} cœurs - {metrics.cpu.model}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
          <CircuitBoard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{memoryUsagePercent.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disque</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{diskUsagePercent.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(metrics.disk.free)} disponible
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            Uptime: {formatUptime(metrics.uptime)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 