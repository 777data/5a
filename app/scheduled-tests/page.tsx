import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ScheduledTestTable } from "./components/scheduled-test-table"

export default async function ScheduledTestsPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour gérer ses tests programmés.
          </p>
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId.value },
    include: {
      scheduledTests: {
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          collections: {
            include: {
              application: true
            }
          },
          environment: true,
          authentication: true
        }
      }
    }
  })

  if (!application) {
    notFound()
  }

  const formattedScheduledTests = application.scheduledTests.map(test => ({
    ...test,
    createdAt: test.createdAt.toISOString(),
    updatedAt: test.updatedAt.toISOString()
  }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tests programmés</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/scheduled-tests/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Link>
        </Button>
      </div>

      <ScheduledTestTable
        scheduledTests={formattedScheduledTests}
      />
    </div>
  )
} 