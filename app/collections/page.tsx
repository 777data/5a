import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { CollectionTable } from "./components/collection-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"

export default async function CollectionsPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour voir ses collections.
          </p>
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId },
    include: {
      collections: {
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              apis: true,
            },
          },
        },
      },
    },
  })

  if (!application) {
    return notFound()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle collection
          </Link>
        </Button>
      </div>

      <CollectionTable collections={application.collections} />
    </div>
  )
} 