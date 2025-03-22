'use client'

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Mail, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: string
  email: string | null
  name: string | null
  role: string
  status: 'active' | 'pending'
  createdAt: string
}

interface MembersTableProps {
  members: Member[]
  organizationId: string
}

export function MembersTable({ members, organizationId }: MembersTableProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleRemoveMember = async (memberId: string, status: 'active' | 'pending') => {
    try {
      setIsLoading(memberId)
      const endpoint = status === 'active' 
        ? `/api/organizations/${organizationId}/members/${memberId}`
        : `/api/admin/organizations/${organizationId}/invitations/${memberId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(status === 'active' 
          ? "Erreur lors de la suppression du membre" 
          : "Erreur lors de l'annulation de l'invitation"
        )
      }

      toast({
        title: status === 'active' ? "Membre supprimé" : "Invitation annulée",
        description: status === 'active' 
          ? "Le membre a été supprimé de l'organisation"
          : "L'invitation a été annulée",
      })

      // Recharger la page pour mettre à jour la liste
      window.location.reload()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleResendInvitation = async (memberId: string, email: string) => {
    try {
      setIsLoading(memberId)
      const response = await fetch(`/api/organizations/${organizationId}/invitations/${memberId}/resend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du renvoi de l'invitation")
      }

      toast({
        title: "Invitation renvoyée",
        description: "Un nouvel email d'invitation a été envoyé",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date d'ajout</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className={member.status === 'pending' ? 'bg-muted/50' : ''}>
            <TableCell>{member.name || '—'}</TableCell>
            <TableCell>{member.email || '—'}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell>
              {member.status === 'pending' ? (
                <Badge variant="secondary">En attente</Badge>
              ) : (
                <Badge variant="default">Actif</Badge>
              )}
            </TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(member.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </TableCell>
            <TableCell className="text-right space-x-2">
              {member.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => member.email && handleResendInvitation(member.id, member.email)}
                  disabled={isLoading === member.id || !member.email}
                  title="Renvoyer l'invitation"
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Renvoyer l'invitation</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveMember(member.id, member.status)}
                disabled={isLoading === member.id}
                className="text-destructive hover:text-destructive"
                title={member.status === 'pending' ? "Annuler l'invitation" : "Retirer de l'organisation"}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">
                  {member.status === 'pending' ? "Annuler l'invitation" : "Retirer de l'organisation"}
                </span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 