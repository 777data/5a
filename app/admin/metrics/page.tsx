import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerMetrics } from "./actions"
import { ServerMetricsChart } from "./components/server-metrics-chart"
import { ServerMetricsCards } from "./components/server-metrics-cards"

export default async function MetricsPage() {
  const metrics = await getServerMetrics()

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administration - Métriques Serveur</h1>
      </div>

      <ServerMetricsCards metrics={metrics} />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Historique des performances</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerMetricsChart metrics={metrics} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 