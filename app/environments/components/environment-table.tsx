'use client'

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
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2 } from "lucide-react"

type Environment = {
  id: string
  name: string
  createdAt: Date
  application: {
    name: string
  }
  _count: {
    variableValues: number
  }
}

type EnvironmentTableProps = {
  environments: Environment[]
}

export function EnvironmentTable({ environments }: EnvironmentTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null)

  async function deleteEnvironment(environment: Environment) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/environments/${environment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Environnement supprimé",
        description: `L'environnement "${environment.name}" a été supprimé avec succès.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression",
      })
    } finally {
      setIsLoading(false)
      setEnvironmentToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {environments.map((environment) => (
              <TableRow 
                key={environment.id}
                className="cursor-pointer"
                onClick={() => router.push(`/environments/${environment.id}/variables`)}
              >
                <TableCell className="font-medium">{environment.name}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {environment._count.variableValues} variables
                  </span>
                </TableCell>
                <TableCell>{new Date(environment.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Valeurs des variables"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Éditer"
                      onClick={() => router.push(`/environments/${environment.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEnvironmentToDelete(environment)
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {environments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Aucun environnement n&apos;a été créé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!environmentToDelete} onOpenChange={() => setEnvironmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l&apos;environnement
              &quot;{environmentToDelete?.name}&quot; et toutes ses valeurs de variables associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                if (environmentToDelete) {
                  deleteEnvironment(environmentToDelete);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 