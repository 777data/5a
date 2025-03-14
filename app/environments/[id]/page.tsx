import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EnvironmentForm } from "../components/environment-form"

export default async function EnvironmentPage({
  params,
}: {
  params: { id: string }
}) {
  const environment = params.id === 'new' 
    ? null 
    : await prisma.environment.findUnique({
        where: { id: params.id }
      })

  if (params.id !== 'new' && !environment) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {environment ? 'Modifier l\'environnement' : 'Nouvel environnement'}
        </h1>
      </div>
      <div className="max-w-2xl">
        <EnvironmentForm environment={environment} />
      </div>
    </div>
  )
} 