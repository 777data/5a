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
import { ApiToTest } from "@/lib/api-test.service"
import { ApiTestDialog } from "@/app/(main)/components/api-test-dialog"
import { Edit, Play, Trash2, Save, GripVertical } from "lucide-react"
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided
} from "@hello-pangea/dnd"

type Api = {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
  order: number
  createdAt: Date
}

type Environment = {
  id: string
  name: string
}

type Authentication = {
  id: string
  name: string
}

type DraggableApiTableProps = {
  apis: Api[]
  applicationId: string
  collectionId: string
  environments?: Environment[]
  authentications?: Authentication[]
}

// Composant pour afficher la méthode HTTP avec une couleur appropriée
function MethodBadge({ method }: { method: string }) {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'POST':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'PATCH':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'DELETE':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getMethodColor(method)}`}>
      {method.toUpperCase()}
    </span>
  )
}

export function DraggableApiTable({ 
  apis, 
  applicationId,
  collectionId,
  environments = [], 
  authentications = [],
}: DraggableApiTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [apiToDelete, setApiToDelete] = useState<Api | null>(null)
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set())
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [apiToTest, setApiToTest] = useState<Api | null>(null)
  const [orderedApis, setOrderedApis] = useState<Api[]>([])
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  
  // Utiliser notre hook de test d'API
  const { 
    isLoading: isTestLoading, 
    testSingleApi, 
    testApis, 
    testCollection 
  } = useApiTest({ applicationId })

  // Initialiser les APIs triées par ordre
  useEffect(() => {
    setOrderedApis([...apis].sort((a, b) => a.order - b.order))
  }, [apis])

  // Gérer le drag-and-drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(orderedApis)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Mettre à jour l'ordre
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }))

    setOrderedApis(updatedItems)
    setHasOrderChanges(true)
  }

  // Sauvegarder l'ordre des APIs
  const saveOrder = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/collections/${collectionId}/reorder-apis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apis: orderedApis.map(api => ({
            id: api.id,
            order: api.order
          }))
        })
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde de l'ordre")
      }

      setHasOrderChanges(false)
      toast({
        title: "Ordre sauvegardé",
        description: "L'ordre des APIs a été sauvegardé avec succès.",
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Supprimer une API
  const deleteApi = async () => {
    if (!apiToDelete) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/apis/${apiToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'API")
      }

      // Mettre à jour la liste des APIs
      setOrderedApis(orderedApis.filter(api => api.id !== apiToDelete.id))
      
      // Supprimer l'API de la sélection si elle y est
      if (selectedApis.has(apiToDelete.id)) {
        const newSelection = new Set(selectedApis)
        newSelection.delete(apiToDelete.id)
        setSelectedApis(newSelection)
      }

      toast({
        title: "API supprimée",
        description: `L'API "${apiToDelete.name}" a été supprimée avec succès.`,
      })
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression",
      })
    } finally {
      setIsLoading(false)
      setApiToDelete(null)
    }
  }

  // Ouvrir la boîte de dialogue de test
  const openTestDialog = (api?: Api) => {
    setApiToTest(api || null)
    setIsTestDialogOpen(true)
  }

  // Gérer la sélection d'une API
  const toggleApiSelection = (apiId: string) => {
    const newSelection = new Set(selectedApis)
    if (newSelection.has(apiId)) {
      newSelection.delete(apiId)
    } else {
      newSelection.add(apiId)
    }
    setSelectedApis(newSelection)
  }

  // Gérer la sélection de toutes les APIs
  const toggleSelectAll = () => {
    if (selectedApis.size === orderedApis.length) {
      // Tout désélectionner
      setSelectedApis(new Set())
    } else {
      // Tout sélectionner
      setSelectedApis(new Set(orderedApis.map(api => api.id)))
    }
  }

  // Gérer le test d'API(s)
  const handleTest = async (environmentId: string, authenticationId: string | null) => {
    if (apiToTest) {
      // Tester une seule API
      const apiToTestData: ApiToTest = {
        id: apiToTest.id,
        name: apiToTest.name,
        url: apiToTest.url,
        method: apiToTest.method,
        headers: apiToTest.headers,
        body: apiToTest.body,
        order: apiToTest.order
      }
      
      console.log(`[DRAGGABLE_API_TABLE] Test de l'API ${apiToTest.name}`)
      // Utiliser le hook qui appelle maintenant la Server Action
      await testSingleApi(apiToTestData, environmentId, authenticationId)
    } else if (selectedApis.size > 0) {
      // Tester plusieurs APIs sélectionnées
      const selectedApisList = orderedApis
        .filter(api => selectedApis.has(api.id))
        .sort((a, b) => a.order - b.order)
        .map(api => ({
          id: api.id,
          name: api.name,
          url: api.url,
          method: api.method,
          headers: api.headers,
          body: api.body,
          order: api.order
        }))
      
      console.log(`[DRAGGABLE_API_TABLE] Test de ${selectedApisList.length} APIs sélectionnées`)
      // Utiliser le hook qui appelle maintenant la Server Action
      await testApis({
        apis: selectedApisList,
        environmentId,
        authenticationId
      })
    } else {
      // Tester toute la collection
      console.log(`[DRAGGABLE_API_TABLE] Test de la collection entière ${collectionId}`)
      // Utiliser le hook qui appelle maintenant la Server Action
      await testCollection(collectionId, environmentId, authenticationId)
    }
    
    // Fermer la boîte de dialogue après le test
    setIsTestDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        {selectedApis.size > 0 && (
          <Button
            variant="outline"
            className="gap-2"
            disabled={isLoading || isTestLoading}
            onClick={() => openTestDialog()}
          >
            <Play className="h-4 w-4" />
            Tester la sélection
          </Button>
        )}
        {hasOrderChanges && (
          <Button
            onClick={saveOrder}
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Sauvegarder l&apos;ordre
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="apis">
          {(provided: DroppableProvided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="border rounded-md"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedApis.size === orderedApis.length && orderedApis.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Sélectionner toutes les APIs"
                      />
                    </TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedApis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Aucune API dans cette collection
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderedApis.map((api, index) => (
                      <Draggable key={api.id} draggableId={api.id} index={index}>
                        {(provided: DraggableProvided) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedApis.has(api.id)}
                                onCheckedChange={() => toggleApiSelection(api.id)}
                                aria-label={`Sélectionner ${api.name}`}
                              />
                            </TableCell>
                            <TableCell {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>{api.name}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{api.url}</TableCell>
                            <TableCell>
                              <MethodBadge method={api.method} />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Éditer"
                                  onClick={() => router.push(`/applications/${applicationId}/apis/${api.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Tester"
                                  onClick={() => openTestDialog(api)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Supprimer"
                                  onClick={() => setApiToDelete(api)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </TableBody>
              </Table>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={!!apiToDelete} onOpenChange={(open) => !open && setApiToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette API ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;API &quot;{apiToDelete?.name}&quot; sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={deleteApi}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boîte de dialogue de test */}
      <ApiTestDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        title={apiToTest ? `Tester l'API "${apiToTest.name}"` : `Tester ${selectedApis.size} API(s)`}
        environments={environments}
        authentications={authentications}
        onTest={handleTest}
        isLoading={isTestLoading}
      />
    </>
  )
} 