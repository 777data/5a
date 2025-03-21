import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApiForm } from "@/app/apis/components/api-form"
import { PageParams } from "@/types/next"

export default async function EditApiPage({ params }: PageParams<{ id: string, apiId: string }>) {
  const { id: applicationId, apiId } = await params
  
  // Vérifier si l'API existe et appartient à l'application via sa collection
  const api = await prisma.api.findUnique({
    where: {
      id: apiId
    },
    include: {
      collection: true
    }
  })

  if (!api || api.collection.applicationId !== applicationId) {
    notFound()
  }

  // Convertir les headers et body pour qu'ils correspondent au type attendu par ApiForm
  const formattedApi = {
    ...api,
    headers: api.headers ? (api.headers as Record<string, string>) : {},
    body: api.body,
    collectionId: api.collectionId
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier l&apos;API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modifiez les informations de l&apos;API
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm api={formattedApi} applicationId={applicationId} />
      </div>
    </div>
  )
} 