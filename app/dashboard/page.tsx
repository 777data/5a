import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExecutionTimeChart } from "./components/execution-time-chart";

export default async function DashboardPage() {  
  const cookieStore = await cookies();
  const activeApplicationId = cookieStore.get("activeApplicationId")?.value;

  // Récupérer le dernier test
  const lastTest = await prisma.apiTest.findFirst({
    where: {
      applicationId: activeApplicationId,
    },
    orderBy: {
      startedAt: "desc",
    },
    include: {
      results: {
        include: {
          api: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Récupérer les 50 derniers tests pour les graphiques
  const recentTests = await prisma.apiTest.findMany({
    where: {
      applicationId: activeApplicationId,
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 50,
    include: {
      results: {
        include: {
          api: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Calculer les statistiques globales
  const totalTests = await prisma.apiTest.count({
    where: {
      applicationId: activeApplicationId,
    },
  });

  const successfulTests = await prisma.apiTest.count({
    where: {
      applicationId: activeApplicationId,
      status: "SUCCESS",
    },
  });

  // Préparer les données pour le graphique
  const chartData = recentTests.map((test) => ({
    date: format(test.startedAt, "dd/MM HH:mm", { locale: fr }),
    ...test.results.reduce(
      (acc, result) => ({
        ...acc,
        [result.api.name]: result.duration,
      }),
      {}
    ),
  })).reverse();

  return (
    <div className="p-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Dernier test */}
        <Card>
          <CardHeader>
            <CardTitle>Dernier test</CardTitle>
          </CardHeader>
          <CardContent>
            {lastTest ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Date : {format(lastTest.startedAt, "dd MMMM yyyy HH:mm", { locale: fr })}
                </p>
                <p className="text-sm text-gray-500">
                  Status : <span className={
                    lastTest.status === "SUCCESS" 
                      ? "text-green-600" 
                      : lastTest.status === "PARTIAL" 
                      ? "text-yellow-600" 
                      : "text-red-600"
                  }>{lastTest.status}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Durée : {lastTest.duration}ms
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun test effectué</p>
            )}
          </CardContent>
        </Card>

        {/* Statistiques globales */}
        <Card>
          <CardHeader>
            <CardTitle>Tests totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{totalTests}</p>
              <p className="text-sm text-gray-500">
                Taux de succès : {totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Temps moyen */}
        <Card>
          <CardHeader>
            <CardTitle>Temps moyen d&apos;exécution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {recentTests.length > 0
                  ? `${(
                      recentTests.reduce((acc, test) => acc + test.duration, 0) /
                      recentTests.length
                    ).toFixed(0)}ms`
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Sur les 50 derniers tests
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des temps d'exécution */}
      <Card>
        <CardHeader>
          <CardTitle>Temps d&apos;exécution par API</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionTimeChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
} 