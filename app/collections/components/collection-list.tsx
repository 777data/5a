'use client'

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, FolderOpen } from "lucide-react"
import { useState } from "react"
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

type Collection = {
  id: string
  name: string
  description: string | null
  color: string | null
  _count: {
    apis: number
  }
}

type CollectionListProps = {
  collections: Collection[]
}

export function CollectionList({ collections }: CollectionListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)

  async function deleteCollection(collection: Collection) {
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
      setCollectionToDelete(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="overflow-hidden">
            <CardHeader 
              className="pb-2" 
              style={{ 
                backgroundColor: collection.color || '#f3f4f6',
                borderBottom: `1px solid ${collection.color ? collection.color : '#e5e7eb'}`
              }}
            >
              <CardTitle>{collection.name}</CardTitle>
              {collection.description && (
                <CardDescription>{collection.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">
                {collection._count.apis} API{collection._count.apis !== 1 ? 's' : ''}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 border-t">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/collections/${collection.id}/view`)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Ouvrir
              </Button>
              <div className="flex gap-2">
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {collections.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">Aucune collection n&apos;a été créée</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/collections/new')}
            >
              Créer une collection
            </Button>
          </div>
        )}
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
    </>
  )
} 