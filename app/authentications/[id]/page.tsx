import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AuthenticationForm } from "../components/authentication-form"

type PageParams = {
  params: {
    id: string
  }
}

export default async function AuthenticationPage({ params }: PageParams) {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour {params.id === 'new' ? 'créer' : 'modifier'} une authentification.
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId.value },
  })

  if (!application) {
    notFound()
  }

  let authentication = null
  if (params.id !== 'new') {
    authentication = await prisma.authentication.findUnique({
      where: { id: params.id },
    })

    if (!authentication || authentication.applicationId !== activeApplicationId.value) {
      notFound()
    }
  }

  const title = params.id === 'new' ? 'Ajouter une authentification' : 'Modifier l\'authentification'

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Application : {application.name}
        </p>
      </div>

      <AuthenticationForm
        applicationId={application.id}
        authentication={authentication}
      />
    </div>
  )
} 