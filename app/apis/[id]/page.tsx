import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApiForm } from "../components/api-form"
import { PageParams } from "@/types/next"

export default async function EditApiPage({
  params,
}: PageParams<{ id: string }>) {
  // Attendre les paramètres de route avant de les utiliser
  const { id } = await params
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    redirect('/collections')
  }

  const api = await prisma.api.findUnique({
    where: {
      id,
    },
  })

  if (!api || api.applicationId !== activeApplicationId) {
    notFound()
  }
  
  // Conversion des headers et body pour correspondre au type attendu par ApiForm
  const formattedApi = {
    ...api,
    headers: api.headers ? (api.headers as Record<string, string>) : {},
    body: api.body
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
        <ApiForm api={formattedApi} applicationId={activeApplicationId} />
      </div>
    </div>
  )
} 