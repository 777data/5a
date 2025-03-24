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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Edit, Share2, Trash2 } from "lucide-react"

type Application = {
  id: string
  name: string
  createdAt: Date
  organization?: {
    id: string
    name: string
  } | null
}

type ApplicationWithCount = Application & {
  _count: {
    environments: number
  }
}

type ApplicationTableProps = {
  applications: ApplicationWithCount[]
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)

  async function deleteApplication(application: Application) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Application supprimée",
        description: `L'application "${application.name}" a été supprimée avec succès.`,
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
      setApplicationToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Environnements</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {application.name}
                    {application.organization && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Share2 className="h-4 w-4 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Partagé avec {application.organization.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {application._count.environments} environnements
                  </span>
                </TableCell>
                <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Éditer"
                      onClick={() => router.push(`/applications/${application.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setApplicationToDelete(application)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Aucune application n&apos;a été créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!applicationToDelete} onOpenChange={() => setApplicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l&apos;application
              &quot;{applicationToDelete?.name}&quot; et tous ses environnements associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => applicationToDelete && deleteApplication(applicationToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 