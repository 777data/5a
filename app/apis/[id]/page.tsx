import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApiForm } from "../components/api-form"

export default async function EditApiPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    redirect('/collections')
  }

  const api = await prisma.api.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!api || api.applicationId !== activeApplicationId) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier l'API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modifiez les informations de l'API
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm api={api} applicationId={activeApplicationId} />
      </div>
    </div>
  )
} 