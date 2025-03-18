import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VariableForm } from "../components/variable-form"
import { PageParams } from "@/types/next"

export default async function VariablePage({ params }: PageParams<{ id: string, variableId: string }>) {
  // Attendre les paramètres avant de les utiliser
  const { id: environmentId, variableId } = await params

  // Vérifier si l'environnement existe
  const environment = await prisma.environment.findUnique({
    where: { id: environmentId },
    include: {
      application: {
        select: {
          name: true
        }
      }
    }
  })

  if (!environment) {
    notFound()
  }

  // Si on est en mode édition (variableId n'est pas 'new'), récupérer la variable
  const variableValue = variableId === 'new' ? null : await prisma.variableValue.findUnique({
    where: {
      id: variableId,
      environmentId: environmentId
    }
  })

  if (variableId !== 'new' && !variableValue) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {variableValue ? "Modifier la variable" : "Ajouter une variable"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Environnement : {environment.name} ({environment.application.name})
        </p>
      </div>

      <VariableForm
        environmentId={environmentId}
        variableValue={variableValue}
      />
    </div>
  )
} 