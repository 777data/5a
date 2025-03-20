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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(id)
      const response = await fetch(`/api/scheduled-tests/${id}`, {
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
    }
  }

  const formatCronExpression = (cron: string) => {
    // Ici vous pouvez ajouter une logique pour formater l'expression cron de manière plus lisible
    return cron
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collections</TableHead>
            <TableHead>Environnement</TableHead>
            <TableHead>Authentification</TableHead>
            <TableHead>Périodicité</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                  {test.collections.map(col => `${col.application.name} - ${col.name}`).join(", ")}
                </TableCell>
                <TableCell>{test.environment.name}</TableCell>
                <TableCell>{test.authentication?.name || "Aucune"}</TableCell>
                <TableCell>{formatCronExpression(test.cronExpression)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isLoading === test.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/scheduled-tests/${test.id}`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(test.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 