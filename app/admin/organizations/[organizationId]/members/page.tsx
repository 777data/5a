import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { OrganizationMember, User, OrganizationInvitation } from "@prisma/client"
import { InviteMemberDialog } from "../../components/invite-member-dialog"
import { MembersTable } from "../../components/members-table"

interface MembersPageProps {
  params: {
    organizationId: string
  }
}

type MemberWithUser = OrganizationMember & {
  user: User | null
}

type MemberOrInvitation = {
  id: string
  email: string | null
  name: string | null
  role: string
  status: 'active' | 'pending'
  createdAt: string
}

export const metadata: Metadata = {
  title: "Membres de l'organisation",
  description: "Gérer les membres de l'organisation",
}

export default async function MembersPage({ params }: MembersPageProps) {
  const [organization, pendingInvitations] = await Promise.all([
    prisma.organization.findUnique({
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
    }),
    prisma.organizationInvitation.findMany({
      where: {
        organizationId: params.organizationId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

  if (!organization) {
    notFound()
  }

  // Convertir les membres actifs
  const activeMembers: MemberOrInvitation[] = organization.members.map((member: MemberWithUser) => ({
    id: member.id,
    email: member.user?.email ?? null,
    name: member.user?.name ?? null,
    role: member.role,
    status: 'active',
    createdAt: member.createdAt.toISOString(),
  }))

  // Convertir les invitations en attente
  const pendingMembers: MemberOrInvitation[] = pendingInvitations.map((invitation: OrganizationInvitation) => ({
    id: invitation.id,
    email: invitation.email,
    name: null,
    role: 'MEMBER', // Rôle par défaut pour les invitations
    status: 'pending',
    createdAt: invitation.createdAt.toISOString(),
  }))

  // Combiner les membres actifs et les invitations
  const allMembers = [...activeMembers, ...pendingMembers]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Membres</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les membres de l&apos;organisation {organization.name}
          </p>
        </div>
        <InviteMemberDialog
          organizationId={organization.id}
          organizationName={organization.name}
        />
      </div>
      <MembersTable members={allMembers} organizationId={organization.id} />
    </div>
  )
} 