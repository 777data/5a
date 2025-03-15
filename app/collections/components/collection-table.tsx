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
import { Edit, Trash2, FolderOpen, Play, CheckSquare } from "lucide-react"
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
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// Clé pour stocker les préférences de test dans le localStorage
const STORAGE_KEY = 'api-tester-preferences'

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
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('')
  const [selectedAuthentication, setSelectedAuthentication] = useState<string>('')
  const [isTestLoading, setIsTestLoading] = useState(false)

  // Charger les préférences depuis le localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferences = localStorage.getItem(STORAGE_KEY)
      if (preferences) {
        const { environmentId, authenticationId } = JSON.parse(preferences)
        setSelectedEnvironment(environmentId || '')
        setSelectedAuthentication(authenticationId || '')
      }
    }
  }, [])

  // Sauvegarder les préférences dans le localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEnvironment && selectedAuthentication) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        environmentId: selectedEnvironment,
        authenticationId: selectedAuthentication,
      }))
    }
  }, [selectedEnvironment, selectedAuthentication])

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

  async function testSelectedCollections() {
    setIsTestLoading(true)
    try {
      // Récupérer les collections sélectionnées avec leurs APIs
      const selectedCollectionIds = Array.from(selectedCollections)
      const collectionsWithApisResponse = await fetch(`/api/collections/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionIds: selectedCollectionIds,
          environmentId: selectedEnvironment,
          authenticationId: selectedAuthentication,
          applicationId: applicationId
        })
      })

      if (!collectionsWithApisResponse.ok) {
        const errorData = await collectionsWithApisResponse.json()
        throw new Error(errorData.error || "Impossible de récupérer les APIs des collections")
      }

      const testData = await collectionsWithApisResponse.json()

      toast({
        title: "Test terminé",
        description: `Le test des collections a été effectué avec succès.`,
      })

      // Rediriger vers la page d'historique des tests avec l'ID du test
      router.push(`/tests?testId=${testData.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du test",
      })
    } finally {
      setIsTestLoading(false)
      setIsTestDialogOpen(false)
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
            Tester les collections ({selectedCollections.size})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedCollections.size === collections.length && collections.length > 0}
                  onCheckedChange={toggleAllCollections}
                />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>APIs</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedCollections.has(collection.id)}
                    onCheckedChange={() => toggleCollectionSelection(collection.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {collection.color && (
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: collection.color }}
                      />
                    )}
                    {collection.name}
                  </div>
                </TableCell>
                <TableCell>{collection.description || '-'}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {collection._count.apis} API{collection._count.apis !== 1 ? 's' : ''}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Ouvrir"
                      onClick={() => router.push(`/collections/${collection.id}/view`)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Éditer"
                      onClick={() => router.push(`/collections/${collection.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setCollectionToDelete(collection)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  Aucune collection n'a été créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la collection
              {collectionToDelete?.name && ` "${collectionToDelete.name}"`}.
              Les APIs associées ne seront pas supprimées, mais elles ne seront plus associées à cette collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => collectionToDelete && deleteCollection(collectionToDelete)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Tester {selectedCollections.size} collection{selectedCollections.size > 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Environnement</label>
              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un environnement" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Authentification</label>
              <Select value={selectedAuthentication} onValueChange={setSelectedAuthentication}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une authentification" />
                </SelectTrigger>
                <SelectContent>
                  {authentications.map((auth) => (
                    <SelectItem key={auth.id} value={auth.id}>
                      {auth.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTestDialogOpen(false)}
              disabled={isTestLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={testSelectedCollections}
              disabled={!selectedEnvironment || !selectedAuthentication || isTestLoading}
            >
              {isTestLoading ? "Test en cours..." : "Lancer le test"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 