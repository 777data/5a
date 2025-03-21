import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { OrganizationForm } from "../../components/organization-form"

interface EditOrganizationPageProps {
  params: {
    organizationId: string
  }
}

export default async function EditOrganizationPage({
  params,
}: EditOrganizationPageProps) {
  const isNew = params.organizationId === "new"

  const organization = !isNew
    ? await prisma.organization.findUnique({
        where: {
          id: params.organizationId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : null

  if (!isNew && !organization) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "Nouvelle organisation" : "Modifier l'organisation"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isNew
            ? "Créez une nouvelle organisation"
            : "Modifiez les informations de l'organisation"}
        </p>
      </div>

      <div className="max-w-2xl">
        <OrganizationForm organization={organization || undefined} />
      </div>
    </div>
  )
} 