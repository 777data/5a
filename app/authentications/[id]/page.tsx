import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AuthenticationForm } from "../components/authentication-form"

type PageParams = {
  params: {
    id: string
  }
}

// Type correspondant à celui attendu par AuthenticationForm
type FormattedAuthentication = {
  id: string
  name: string
  token: string
  apiKey: string
}

export default async function AuthenticationPage({ params }: PageParams) {
  // Attendre les paramètres de route avant de les utiliser
  const { id } = await params
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour {id === 'new' ? 'créer' : 'modifier'} une authentification.
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

  let formattedAuthentication: FormattedAuthentication | null = null
  if (id !== 'new') {
    const authentication = await prisma.authentication.findUnique({
      where: { id },
    })

    if (!authentication || authentication.applicationId !== activeApplicationId.value) {
      notFound()
    }
    
    // Formater l'authentification pour correspondre au type attendu
    formattedAuthentication = {
      id: authentication.id,
      name: authentication.name,
      token: authentication.token || "",
      apiKey: authentication.apiKey || "",
    }
  }

  const title = id === 'new' ? 'Ajouter une authentification' : 'Modifier l\'authentification'

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
        authentication={formattedAuthentication}
      />
    </div>
  )
} 