import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TestHistoryTable } from "./components/test-history-table"

type TestSession = {
  id: string
  startedAt: Date
  duration: number
  environment: {
    name: string
  }
  authentication: {
    name: string
  } | null
  collections: Array<{
    id: string
    name: string
    startedAt: Date
    duration: number
    status: string
    results: Array<{
      id: string
      statusCode: number
      duration: number
      api: {
        name: string
        method: string
      }
      error?: string | null
    }>
    _count: {
      results: number
    }
  }>
  _count: {
    collections: number
    totalResults: number
  }
}

export default async function TestHistoryPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour voir les résultats des tests.
          </p>
        </div>
      </div>
    )
  }

  // Récupérer les tests avec leurs résultats
  const tests = await prisma.apiTest.findMany({
    where: {
      applicationId: activeApplicationId
    },
    include: {
      environment: true,
      authentication: true,
      results: {
        include: {
          api: {
            include: {
              collection: true
            }
          }
        }
      },
      _count: {
        select: {
          results: true
        }
      }
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  // Regrouper les tests par date de session (même minute)
  const groupedTests = tests.reduce((acc, test) => {
    const sessionKey = new Date(test.startedAt).setSeconds(0, 0)
    
    // Transformer les résultats pour correspondre au type attendu
    const transformedResults = test.results.map(result => ({
      id: result.id,
      statusCode: result.statusCode,
      duration: result.duration,
      api: {
        name: result.api.name,
        method: result.api.method
      },
      error: result.error
    }))

    const collection = {
      id: test.id,
      name: test.results[0]?.api.collection.name || `Collection ${new Date(test.startedAt).toLocaleTimeString()}`,
      startedAt: test.startedAt,
      duration: test.duration,
      status: test.status,
      results: transformedResults,
      _count: {
        results: test._count.results
      }
    }

    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        id: sessionKey.toString(),
        startedAt: new Date(sessionKey),
        duration: test.duration,
        environment: {
          name: test.environment.name
        },
        authentication: test.authentication ? {
          name: test.authentication.name
        } : null,
        collections: [collection],
        _count: {
          collections: 1,
          totalResults: test._count.results
        }
      }
    } else {
      acc[sessionKey].duration += test.duration
      acc[sessionKey].collections.push(collection)
      acc[sessionKey]._count.collections += 1
      acc[sessionKey]._count.totalResults += test._count.results
    }
    return acc
  }, {} as Record<number, TestSession>)

  // Convertir l'objet en tableau et trier par date
  const sessions = Object.values(groupedTests).sort((a, b) => 
    b.startedAt.getTime() - a.startedAt.getTime()
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des tests</h1>
      </div>

      <TestHistoryTable tests={sessions} />
    </div>
  )
} 