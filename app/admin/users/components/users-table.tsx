'use client'

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Mail } from "lucide-react"
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
import { formatDate } from "@/lib/utils"
import { deleteUser, validateUserEmail } from "../actions"
import { Badge } from "@/components/ui/badge"
import { User } from "@prisma/client"

type UsersTableProps = {
  users: User[]
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsLoading(userToDelete)
      await deleteUser(userToDelete)
      setUsers(users.filter(user => user.id !== userToDelete))
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur.",
      })
    } finally {
      setUserToDelete(null)
      setIsLoading(null)
    }
  }

  const handleValidateEmail = async (userId: string) => {
    try {
      setIsLoading(userId)
      await validateUserEmail(userId)
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, emailVerified: new Date() }
          : user
      ))
      toast({
        title: "Email validé",
        description: "L'email de l'utilisateur a été validé avec succès.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation de l'email.",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name || "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.emailVerified ? (
                  <Badge variant="default">Vérifié</Badge>
                ) : (
                  <Badge variant="secondary">Non vérifié</Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                {user.lastLogin ? formatDate(user.lastLogin) : "Jamais connecté"}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {!user.emailVerified && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleValidateEmail(user.id)}
                    disabled={isLoading === user.id}
                    title="Valider l'email"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">Valider l&apos;email</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUserToDelete(user.id)}
                  disabled={isLoading === user.id}
                  className="text-destructive hover:text-destructive"
                  title="Supprimer l'utilisateur"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Supprimer l&apos;utilisateur</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le compte
              de l&apos;utilisateur et toutes ses données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 