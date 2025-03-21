import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "../components/application-form"
import { PageParams } from "@/types/next"

export default async function ApplicationPage({ params }: PageParams<{ id: string }>) {
  // Attendre les paramètres avant de les utiliser
  const { id } = await params
  
  // Si l'ID est "new", c'est une création
  const isNew = id === 'new'

  // Si ce n'est pas une nouvelle application, on récupère l'existante
  const application = !isNew ? await prisma.application.findUnique({
    where: { id },
  }) : null

  // Si on demande une application existante qui n'existe pas, on renvoie une 404
  if (!isNew && !application) {
    notFound()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isNew ? "Nouvelle application" : `Modifier l'application "${application!.name}"`}
      </h1>
      <ApplicationForm application={application || undefined} />
    </div>
  )
} 