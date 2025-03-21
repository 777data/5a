import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"
import Link from "next/link"
import { MembersTable } from "../../components/members-table"
import type { OrganizationMember, User } from "@prisma/client"

import { Button } from "@/components/ui/button"

interface MembersPageProps {
  params: {
    organizationId: string
  }
}

type MemberWithUser = OrganizationMember & {
  user: User | null
}

export const metadata: Metadata = {
  title: "Membres de l'organisation",
  description: "Gérer les membres de l'organisation",
}

export default async function MembersPage({ params }: MembersPageProps) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: params.organizationId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!organization) {
    notFound()
  }

  const members = organization.members.map((member: MemberWithUser) => ({
    id: member.id,
    email: member.user?.email ?? null,
    name: member.user?.name ?? null,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
  }))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les membres de l&apos;organisation {organization.name}
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/organizations/${organization.id}/members/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Link>
        </Button>
      </div>
      <MembersTable members={members} organizationId={organization.id} />
    </div>
  )
} 