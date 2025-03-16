'use client'

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { useApiTest } from "@/app/hooks/use-api-test"
import { ApiTestDialog } from "@/app/components/api-test-dialog"
import { Edit, Play, Trash2 } from "lucide-react"

type Collection = {
  id: string
  name: string
  description: string | null
  color: string | null
  _count: {
    apis: number
  }
}

type Environment = {
  id: string
  name: string
}

type Authentication = {
  id: string
  name: string
}

type CollectionTableProps = {
  collections: Collection[]
  environments?: Environment[]
  authentications?: Authentication[]
  applicationId: string
}

export function CollectionTable({ 
  collections, 
  environments = [], 
  authentications = [],
  applicationId 
}: CollectionTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  
  // Utiliser notre hook de test d'API
  const { 
    isLoading: isTestLoading, 
    testCollection 
  } = useApiTest({ applicationId })

  async function deleteCollection(collection: Collection) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Collection supprimée",
        description: `La collection "${collection.name}" a été supprimée avec succès.`,
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
      setCollectionToDelete(null)
    }
  }

  function toggleCollectionSelection(collectionId: string) {
    const newSelectedCollections = new Set(selectedCollections)
    if (newSelectedCollections.has(collectionId)) {
      newSelectedCollections.delete(collectionId)
    } else {
      newSelectedCollections.add(collectionId)
    }
    setSelectedCollections(newSelectedCollections)
  }

  function toggleAllCollections() {
    if (selectedCollections.size === collections.length) {
      setSelectedCollections(new Set())
    } else {
      setSelectedCollections(new Set(collections.map(collection => collection.id)))
    }
  }

  function openTestDialog() {
    setIsTestDialogOpen(true)
  }

  // Gérer le test des collections sélectionnées
  const handleTest = async (environmentId: string, authenticationId: string | null) => {
    if (selectedCollections.size === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner au moins une collection",
      })
      return
    }

    try {
      // Tester chaque collection sélectionnée
      for (const collectionId of selectedCollections) {
        await testCollection(collectionId, environmentId, authenticationId)
      }
      
      // Fermer la boîte de dialogue après le test
      setIsTestDialogOpen(false)
    } catch (error) {
      console.error('Erreur lors du test des collections:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors des tests",
      })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        {selectedCollections.size > 0 && (
          <Button
            variant="outline"
            className="gap-2"
            disabled={isLoading || isTestLoading}
            onClick={openTestDialog}
          >
            <Play className="h-4 w-4" />
            Tester la sélection
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedCollections.size === collections.length && collections.length > 0}
                  onCheckedChange={toggleAllCollections}
                  aria-label="Sélectionner toutes les collections"
                />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Nombre d'APIs</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucune collection trouvée
                </TableCell>
              </TableRow>
            ) : (
              collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCollections.has(collection.id)}
                      onCheckedChange={() => toggleCollectionSelection(collection.id)}
                      aria-label={`Sélectionner ${collection.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {collection.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                      )}
                      {collection.name}
                    </div>
                  </TableCell>
                  <TableCell>{collection.description || "-"}</TableCell>
                  <TableCell>{collection._count.apis}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Voir"
                        onClick={() => router.push(`/collections/${collection.id}/view`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Tester"
                        onClick={() => {
                          setSelectedCollections(new Set([collection.id]))
                          openTestDialog()
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer"
                        onClick={() => setCollectionToDelete(collection)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={!!collectionToDelete} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette collection ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La collection "{collectionToDelete?.name}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => collectionToDelete && deleteCollection(collectionToDelete)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boîte de dialogue de test */}
      <ApiTestDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        title={`Tester ${selectedCollections.size} collection(s)`}
        environments={environments}
        authentications={authentications}
        onTest={handleTest}
        isLoading={isTestLoading}
      />
    </>
  )
} 