import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EnvironmentForm } from "../components/environment-form"

type PageParams = {
  params: {
    id: string
  }
}

export default async function EnvironmentPage({ params }: PageParams) {
  // Attendre les paramètres avant de les utiliser
  const id = await params.id

  const environment = id === 'new'
    ? null
    : await prisma.environment.findUnique({
        where: { id }
      })

  if (id !== 'new' && !environment) {
    notFound()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {environment ? "Modifier l'environnement" : "Créer un environnement"}
      </h1>
      <EnvironmentForm environment={environment} />
    </div>
  )
} 