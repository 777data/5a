import Link from "next/link"
import { Plus } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { OrganizationsTable } from "./components/organizations-table"

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  const formattedOrganizations = organizations.map(org => ({
    ...org,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString()
  }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les organisations de l&apos;application
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/organizations/new/edit">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Link>
        </Button>
      </div>

      <OrganizationsTable organizations={formattedOrganizations} />
    </div>
  )
} 