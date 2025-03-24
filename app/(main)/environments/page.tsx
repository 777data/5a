import { prisma } from "@/lib/prisma"
import { EnvironmentTable } from "./components/environment-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Share2 } from "lucide-react"

export default async function EnvironmentsPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour gérer ses environnements.
          </p>
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId },
    include: {
      environments: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              variableValues: true,
            },
          },
          application: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!application) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Environnements</h1>
          <p className="flex flex-row text-sm text-gray-500 mt-1 gap-2">
            Application : {application.name} {application.organization && (
                      <Share2 className="h-4 w-4 text-gray-500" />
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/environments/new">Créer un environnement</Link>
        </Button>
      </div>

      <EnvironmentTable environments={application.environments} />
    </div>
  )
} 