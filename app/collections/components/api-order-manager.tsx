'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided
} from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { GripVertical, Save } from "lucide-react"

type Api = {
  id: string
  name: string
  method: string
  url: string
  order: number
}

type ApiOrderManagerProps = {
  apis: Api[]
  collectionId: string
}

export function ApiOrderManager({ apis, collectionId }: ApiOrderManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [orderedApis, setOrderedApis] = useState<Api[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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
    setHasChanges(true)
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
          apis: orderedApis.map((api, index) => ({
            id: api.id,
            order: index
          }))
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "Ordre sauvegardé",
        description: "L'ordre des APIs a été sauvegardé avec succès.",
      })

      setHasChanges(false)
      router.refresh()
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ordre d'exécution des APIs</h2>
        <Button 
          onClick={saveOrder} 
          disabled={!hasChanges || isLoading}
          variant={hasChanges ? "default" : "outline"}
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder l'ordre
        </Button>
      </div>
      
      <div className="border rounded-md">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="apis">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 p-2"
              >
                {orderedApis.map((api, index) => (
                  <Draggable key={api.id} draggableId={api.id} index={index}>
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center p-3 bg-white border rounded-md shadow-sm hover:bg-gray-50"
                      >
                        <div {...provided.dragHandleProps} className="mr-3 text-gray-400">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2
                              ${api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                api.method === 'POST' ? 'bg-green-100 text-green-700' :
                                api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                api.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {api.method}
                            </span>
                            <span className="font-medium">{api.name}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 truncate max-w-md">
                            {api.url}
                          </div>
                        </div>
                        <div className="text-gray-500 font-mono">
                          #{index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {orderedApis.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    Aucune API dans cette collection
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
} 