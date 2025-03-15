import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { VariableTable } from "./components/variable-table"

type PageParams = {
  params: {
    id: string
  }
}

export default async function EnvironmentVariablesPage({ params }: PageParams) {
  const environmentId = await params.id

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

  const variables = await prisma.variableValue.findMany({
    where: {
      environmentId
    },
    select: {
      id: true,
      name: true,
      value: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Variables</h1>
          <p className="text-sm text-gray-500 mt-1">
            Environnement : {environment.name} ({environment.application.name})
          </p>
        </div>
        <Button asChild>
          <Link href={`/environments/${environmentId}/variables/new`}>
            Ajouter une variable
          </Link>
        </Button>
      </div>

      <VariableTable variables={variables} environmentId={environmentId} />
    </div>
  )
} 