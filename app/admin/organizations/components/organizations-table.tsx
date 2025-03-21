'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Users } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type Organization = {
  id: string
  name: string
  createdAt: string
  _count: {
    members: number
  }
}

interface OrganizationsTableProps {
  organizations: Organization[]
}

export function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null)

  async function deleteOrganization(organization: Organization) {
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Organisation supprimée",
        description: `L'organisation "${organization.name}" a été supprimée avec succès.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression",
      })
    } finally {
      setOrgToDelete(null)
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 mt-4">
        Aucune organisation n&apos;a été créée.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Membres</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell 
                  className="font-medium cursor-pointer" 
                  onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                >
                  {org.name}
                </TableCell>
                <TableCell 
                  className="cursor-pointer" 
                  onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                >
                  {org._count.members}
                </TableCell>
                <TableCell 
                  className="cursor-pointer" 
                  onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                >
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Voir les membres"
                      onClick={() => router.push(`/admin/organizations/${org.id}/members`)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Éditer"
                      onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setOrgToDelete(org)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Aucune organisation n&apos;a été créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!orgToDelete} onOpenChange={() => setOrgToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l&apos;organisation
              {orgToDelete?.name && ` "${orgToDelete.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => orgToDelete && deleteOrganization(orgToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 