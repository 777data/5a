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
  const organization = await prisma.organization.findUnique({
    where: {
      id: params.organizationId,
    },
  })

  if (!organization) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier l&apos;organisation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modifiez les informations de l&apos;organisation
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <OrganizationForm organization={organization} />
      </div>
    </div>
  )
} 