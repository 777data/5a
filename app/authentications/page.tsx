import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { AuthenticationTable } from "./components/authentication-table"

export default async function AuthenticationsPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour gérer ses authentifications.
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId.value },
    include: {
      authentications: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!application) {
    notFound()
  }

  const formattedAuthentications = application.authentications.map(auth => ({
    ...auth,
    createdAt: auth.createdAt.toISOString(),
    updatedAt: auth.updatedAt.toISOString()
  }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Authentifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/authentications/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Link>
        </Button>
      </div>

      <AuthenticationTable
        authentications={formattedAuthentications}
        applicationId={application.id}
      />
    </div>
  )
} 