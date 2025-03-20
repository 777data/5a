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

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour gérer ses tests programmés.
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