import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TestHistoryTable } from "./components/test-history-table"
import { notFound } from "next/navigation"

export default async function TestHistoryPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return notFound()
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
          api: true
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique des tests</h1>
      </div>

      <TestHistoryTable tests={tests} />
    </div>
  )
} 