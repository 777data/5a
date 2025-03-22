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
import { useToast } from "@/hooks/use-toast"
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

type ScheduledTest = {
  id: string
  cronExpression: string
  collections: {
    id: string
    name: string
    application: {
      name: string
    }
  }[]
  environment: {
    id: string
    name: string
  }
  authentication?: {
    id: string
    name: string
  } | null
  createdAt: string
}

type ScheduledTestTableProps = {
  scheduledTests: ScheduledTest[]
}

export function ScheduledTestTable({ scheduledTests }: ScheduledTestTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [testToDelete, setTestToDelete] = useState<ScheduledTest | null>(null)

  const handleDelete = async (test: ScheduledTest) => {
    try {
      setIsLoading(test.id)
      const response = await fetch(`/api/scheduled-tests/${test.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du test programmé')
      }

      toast({
        title: "Test programmé supprimé",
        description: "Le test programmé a été supprimé avec succès.",
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsLoading(null)
      setTestToDelete(null)
    }
  }

  const formatCronExpression = (cron: string) => {
    // Ici vous pouvez ajouter une logique pour formater l'expression cron de manière plus lisible
    return cron
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collections</TableHead>
              <TableHead>Environnement</TableHead>
              <TableHead>Authentification</TableHead>
              <TableHead>Périodicité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Aucun test programmé
                </TableCell>
              </TableRow>
            ) : (
              scheduledTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    {test.collections.map(col => `${col.name}`).join(", ")}
                  </TableCell>
                  <TableCell>{test.environment.name}</TableCell>
                  <TableCell>{test.authentication?.name || "Aucune"}</TableCell>
                  <TableCell>{formatCronExpression(test.cronExpression)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/tests/scheduled/${test.id}`)}
                      className="h-8 w-8"
                      disabled={isLoading === test.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTestToDelete(test)}
                      className="h-8 w-8 text-red-600 hover:text-red-600"
                      disabled={isLoading === test.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={testToDelete !== null} onOpenChange={() => setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le test programmé
              {testToDelete && (
                <span className="font-medium">
                  {" "}pour les collections : {testToDelete.collections.map(col => col.name).join(", ")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => testToDelete && handleDelete(testToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 