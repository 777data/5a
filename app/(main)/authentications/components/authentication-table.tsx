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
import { Edit, Trash2 } from "lucide-react"
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

type Authentication = {
  id: string
  name: string
  token: string | null
  apiKey: string | null
  createdAt: string
  updatedAt: string
}

type AuthenticationTableProps = {
  authentications: Authentication[]
  applicationId: string
}

export function AuthenticationTable({ authentications, applicationId }: AuthenticationTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [authToDelete, setAuthToDelete] = useState<Authentication | null>(null)

  async function deleteAuthentication(authentication: Authentication) {
    try {
      const response = await fetch(`/api/applications/${applicationId}/authentications/${authentication.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Authentification supprimée",
        description: `L'authentification "${authentication.name}" a été supprimée avec succès.`,
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
      setAuthToDelete(null)
    }
  }

  if (authentications.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 mt-4">
        Aucune authentification n&apos;a été créée.
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
              <TableHead>Token</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authentications.map((auth) => (
              <TableRow key={auth.id}>
                <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/authentications/${auth.id}`)}>{auth.name}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => router.push(`/authentications/${auth.id}`)}>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {auth.token ? auth.token.substring(0, 8) + '...' : 'N/A'}
                  </code>
                </TableCell>
                <TableCell className="cursor-pointer" onClick={() => router.push(`/authentications/${auth.id}`)}>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {auth.apiKey ? auth.apiKey.substring(0, 8) + '...' : 'N/A'}
                  </code>
                </TableCell>
                <TableCell className="cursor-pointer" onClick={() => router.push(`/authentications/${auth.id}`)}>{new Date(auth.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Éditer"
                      onClick={() => router.push(`/authentications/${auth.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setAuthToDelete(auth)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {authentications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  Aucune authentification n&apos;a été créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!authToDelete} onOpenChange={() => setAuthToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l&apos;authentification
              {authToDelete?.name && ` "${authToDelete.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => authToDelete && deleteAuthentication(authToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 