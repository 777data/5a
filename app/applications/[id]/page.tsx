import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "../components/application-form"
import { PageParams } from "@/types/next"

export default async function EditApplicationPage({ params }: PageParams<{ id: string }>) {
  // Attendre les paramètres avant de les utiliser
  const { id } = await params
  
  const application = await prisma.application.findUnique({
    where: {
      id,
    },
  })

  if (!application) {
    notFound()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Modifier l&apos;application &quot;{application.name}&quot;
      </h1>
      <ApplicationForm application={application} />
    </div>
  )
} 