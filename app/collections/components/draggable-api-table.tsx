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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
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
  body: any
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

const STORAGE_KEY = 'api-test-preferences'

// Fonction utilitaire pour remplacer les variables
function replaceVariables(
  template: string, 
  variables: Array<{ name: string, value: string }>,
  previousResponse?: any
): string {
  let result = template

  // Remplacer les variables standard
  variables.forEach(variable => {
    const pattern = new RegExp(`{{${variable.name}}}`, 'g')
    result = result.replace(pattern, variable.value)
  })

  // Remplacer les variables de type response.body.xxx si une réponse précédente existe
  if (previousResponse) {
    // Trouver toutes les occurrences de {{response.body.xxx}}
    const responsePattern = /{{response\.body\.([\w\.]+)}}/g
    let match

    while ((match = responsePattern.exec(template)) !== null) {
      const fullMatch = match[0]
      const path = match[1].split('.')
      
      // Extraire la valeur du chemin dans la réponse
      let value = previousResponse
      try {
        for (const key of path) {
          value = value[key]
          if (value === undefined) break
        }
        
        // Remplacer la variable par la valeur si elle existe
        if (value !== undefined) {
          // Convertir en chaîne si nécessaire
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
          result = result.replace(fullMatch, stringValue)
        }
      } catch (error) {
        console.warn(`Impossible d'accéder au chemin ${path.join('.')} dans la réponse précédente`, error)
      }
    }
  }

  // Vérifier s'il reste des variables non remplacées
  const remainingVars = result.match(/{{[^{}]+}}/g)
  if (remainingVars) {
    console.warn(`Variables non remplacées détectées: ${remainingVars.join(', ')}`)
  }

  return result
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
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('')
  const [selectedAuthentication, setSelectedAuthentication] = useState<string>('')
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<any | null>(null)
  const [orderedApis, setOrderedApis] = useState<Api[]>([])
  const [hasOrderChanges, setHasOrderChanges] = useState(false)

  // Initialiser les APIs triées par ordre
  useEffect(() => {
    setOrderedApis([...apis].sort((a, b) => a.order - b.order))
  }, [apis])

  // Charger les préférences depuis le localStorage
  useEffect(() => {
    const preferences = localStorage.getItem(STORAGE_KEY)
    if (preferences) {
      const { environmentId, authenticationId } = JSON.parse(preferences)
      setSelectedEnvironment(environmentId || '')
      setSelectedAuthentication(authenticationId || '')
    }
  }, [])

  // Sauvegarder les préférences dans le localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      environmentId: selectedEnvironment,
      authenticationId: selectedAuthentication,
    }))
  }, [selectedEnvironment, selectedAuthentication])

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

      setHasOrderChanges(false)
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

  async function deleteApi(api: Api) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/apis/${api.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      toast({
        title: "API supprimée",
        description: `L'API "${api.name}" a été supprimée avec succès.`,
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
      setApiToDelete(null)
    }
  }

  function toggleApiSelection(apiId: string) {
    const newSelectedApis = new Set(selectedApis)
    if (newSelectedApis.has(apiId)) {
      newSelectedApis.delete(apiId)
    } else {
      newSelectedApis.add(apiId)
    }
    setSelectedApis(newSelectedApis)
  }

  function toggleAllApis() {
    if (selectedApis.size === orderedApis.length) {
      setSelectedApis(new Set())
    } else {
      setSelectedApis(new Set(orderedApis.map(api => api.id)))
    }
  }

  function openTestDialog(api?: Api) {
    if (api) {
      setApiToTest(api)
    } else {
      setApiToTest(null)
    }
    setIsTestDialogOpen(true)
  }

  async function testApi(apiId: string) {
    setIsTestLoading(true)
    try {
      // Trouver l'API sélectionnée
      const selectedApi = orderedApis.find(api => api.id === apiId)
      if (!selectedApi) {
        throw new Error("API non trouvée")
      }

      // Récupérer les variables de l'environnement
      const variablesResponse = await fetch(`/api/environments/${selectedEnvironment}/variables`)
      if (!variablesResponse.ok) {
        throw new Error("Impossible de récupérer les variables")
      }
      const variables = await variablesResponse.json()

      // Récupérer l'authentification sélectionnée
      const authResponse = await fetch(`/api/applications/${applicationId}/authentications/${selectedAuthentication}`)
      if (!authResponse.ok) {
        throw new Error("Impossible de récupérer l'authentification")
      }
      const auth = await authResponse.json()

      // Remplacer les variables dans l'URL
      const url = replaceVariables(selectedApi.url, variables, null)

      // Préparer les headers avec les variables remplacées et l'authentification
      const headers: Record<string, string> = {
        'apiKey': auth.apiKey,
        'token': auth.token
      }
      
      // Ajouter les headers personnalisés de l'API
      if (selectedApi.headers) {
        Object.entries(selectedApi.headers).forEach(([key, value]) => {
          headers[key] = replaceVariables(value, variables, null)
        })
      }

      // Préparer le body avec les variables remplacées si nécessaire
      let body = undefined
      if (selectedApi.body) {
        if (typeof selectedApi.body === 'string') {
          body = replaceVariables(selectedApi.body, variables, null)
        } else {
          // Si le body est un objet, on remplace les variables dans chaque valeur
          body = JSON.stringify(
            Object.entries(selectedApi.body).reduce((acc, [key, value]) => ({
              ...acc,
              [key]: typeof value === 'string' ? replaceVariables(value, variables, null) : value
            }), {})
          )
        }
      }

      const startTime = Date.now()

      // Effectuer l'appel API via notre proxy
      const apiResponse = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: selectedApi.method,
          headers,
          body
        })
      })

      const duration = Date.now() - startTime

      const result = await apiResponse.json()

      // Déterminer le statut en fonction du code de statut
      let status = "SUCCESS"
      if (result.status >= 400) {
        status = "FAILED"
      }

      // Enregistrer le résultat du test
      const testResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          environmentId: selectedEnvironment,
          authenticationId: selectedAuthentication,
          duration,
          status: status,
          results: [{
            apiId: apiId,
            statusCode: result.status,
            duration,
            response: {
              headers: result.headers,
              data: result.data
            },
            error: result.status >= 400 ? result.statusText : null
          }]
        })
      })

      if (!testResponse.ok) {
        console.error("Erreur lors de l'enregistrement du test:", await testResponse.text())
        throw new Error("Erreur lors de l'enregistrement du test")
      }

      // Récupérer l'ID du test créé
      const testData = await testResponse.json()
      
      // Afficher un message de succès
      toast({
        title: "Test terminé",
        description: `Le test de l'API "${selectedApi.name}" a été effectué avec succès.`,
      })

      // Fermer la boîte de dialogue
      setIsTestDialogOpen(false)
      
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
    }
  }

  async function testSelectedApis() {
    setIsLoading(true)
    try {
      // Récupérer les variables de l'environnement
      const variablesResponse = await fetch(`/api/environments/${selectedEnvironment}/variables`)
      if (!variablesResponse.ok) {
        throw new Error("Impossible de récupérer les variables")
      }
      const variables = await variablesResponse.json()

      // Récupérer l'authentification sélectionnée
      let auth = null
      if (selectedAuthentication) {
        const authResponse = await fetch(`/api/applications/${applicationId}/authentications/${selectedAuthentication}`)
        if (!authResponse.ok) {
          throw new Error("Impossible de récupérer l'authentification")
        }
        auth = await authResponse.json()
      }

      // Récupérer les APIs sélectionnées et les trier par ordre
      const selectedApisList = orderedApis
        .filter(api => selectedApis.has(api.id))
        .sort((a, b) => a.order - b.order)

      // Tester chaque API dans l'ordre
      let overallStatus = "SUCCESS"
      const results = []
      let previousResponse: Record<string, any> | null = null

      for (const api of selectedApisList) {
        try {
          // Remplacer les variables dans l'URL, y compris celles de la réponse précédente
          const url = replaceVariables(api.url, variables, previousResponse)

          // Préparer les headers avec les variables remplacées et l'authentification
          const headers: Record<string, string> = {
            'apiKey': auth?.apiKey || '',
            'token': auth?.token || ''
          }
          
          // Ajouter les headers personnalisés de l'API
          if (api.headers) {
            Object.entries(api.headers).forEach(([key, value]) => {
              headers[key] = replaceVariables(value, variables, previousResponse)
            })
          }

          // Préparer le body avec les variables remplacées si nécessaire
          let body = undefined
          if (api.body) {
            if (typeof api.body === 'string') {
              body = replaceVariables(api.body, variables, previousResponse)
            } else {
              // Si le body est un objet, on remplace les variables dans chaque valeur
              body = JSON.stringify(
                Object.entries(api.body).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key]: typeof value === 'string' ? replaceVariables(value, variables, previousResponse) : value
                }), {})
              )
            }
          }

          const startTime = Date.now()

          // Effectuer l'appel API via notre proxy
          const apiResponse = await fetch('/api/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              method: api.method,
              headers,
              body
            })
          })

          const duration = Date.now() - startTime

          const result = await apiResponse.json()
          
          // Stocker la réponse pour l'utiliser dans les tests suivants
          previousResponse = result.data
          
          // Ajouter le résultat
          results.push({
            apiId: api.id,
            statusCode: result.status,
            duration,
            response: {
              headers: result.headers,
              data: result.data
            },
            error: result.status >= 400 ? result.statusText : null
          })
          
          // Nous ne mettons plus à jour le statut global ici, il sera recalculé à la fin
        } catch (error) {
          console.error(`Erreur lors du test de l'API ${api.name}:`, error)
          
          // Ajouter un résultat d'erreur
          results.push({
            apiId: api.id,
            statusCode: 500,
            duration: 0,
            response: {},
            error: error instanceof Error ? error.message : "Une erreur est survenue"
          })
          
          // Nous ne mettons plus à jour le statut global ici, il sera recalculé à la fin
        }
      }
      
      // Recalculer le statut global en fonction des résultats
      // Si au moins une API a échoué avec un code 401, 403, 404 ou 5xx, c'est un échec
      const hasAuthErrors = results.some(result => 
        result.statusCode === 401 || 
        result.statusCode === 403 || 
        result.statusCode === 404 || 
        result.statusCode >= 500
      )
      
      // Si toutes les APIs ont échoué, c'est un échec
      const allFailed = results.every(result => result.statusCode >= 400)
      
      // Si au moins une API a échoué mais pas toutes, c'est partiel
      const someFailedButNotAll = results.some(result => result.statusCode >= 400) && !allFailed
      
      // Forcer le statut à FAILED si au moins une API a retourné une erreur 401
      if (results.some(result => result.statusCode === 401)) {
        overallStatus = "FAILED"
      } else if (hasAuthErrors || allFailed) {
        overallStatus = "FAILED"
      } else if (someFailedButNotAll) {
        overallStatus = "PARTIAL"
      }
      
      console.log("Statut global:", overallStatus, "Résultats:", results.map(r => r.statusCode));
      
      // Enregistrer les résultats des tests
      const testResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          environmentId: selectedEnvironment,
          authenticationId: selectedAuthentication,
          duration: results.reduce((total, result) => total + result.duration, 0),
          status: overallStatus,
          results
        })
      })

      if (!testResponse.ok) {
        console.error("Erreur lors de l'enregistrement des tests:", await testResponse.text())
        throw new Error("Erreur lors de l'enregistrement des tests")
      }

      // Récupérer l'ID du test créé
      const testData = await testResponse.json()
      
      // Afficher un message de succès
      toast({
        title: "Tests terminés",
        description: `${results.length} API(s) ont été testées.`,
      })

      // Fermer la boîte de dialogue
      setIsTestDialogOpen(false)
      
      // Rediriger vers la page d'historique des tests avec l'ID du test
      router.push(`/tests?testId=${testData.id}`)
      
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors des tests",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleTest() {
    if (apiToTest) {
      testApi(apiToTest.id)
    } else {
      testSelectedApis()
    }
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
            Sauvegarder l'ordre
          </Button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Utilisation des réponses entre les APIs</h3>
        <p className="text-sm text-blue-700 mb-2">
          Vous pouvez utiliser les données de la réponse d'une API précédente dans les tests suivants.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Syntaxe :</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">{"{{response.body.property}}"}</code> - Remplace par la valeur de la propriété dans la réponse précédente.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Exemple :</strong> Si l'API précédente renvoie <code className="bg-blue-100 px-1 py-0.5 rounded">{"{ \"id\": 123, \"name\": \"Test\" }"}</code>, 
          vous pouvez utiliser <code className="bg-blue-100 px-1 py-0.5 rounded">{"{{response.body.id}}"}</code> pour obtenir <code className="bg-blue-100 px-1 py-0.5 rounded">123</code>.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Note :</strong> Les APIs sont exécutées dans l'ordre affiché dans le tableau. Utilisez le glisser-déposer pour réorganiser l'ordre d'exécution.
        </p>
      </div>

      <div className="rounded-md border">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedApis.size === orderedApis.length && orderedApis.length > 0}
                    onCheckedChange={toggleAllApis}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <Droppable droppableId="apis">
              {(provided: DroppableProvided) => (
                <TableBody
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {orderedApis.map((api, index) => (
                    <Draggable key={api.id} draggableId={api.id} index={index}>
                      {(provided: DraggableProvided) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedApis.has(api.id)}
                              onCheckedChange={() => toggleApiSelection(api.id)}
                            />
                          </TableCell>
                          <TableCell {...provided.dragHandleProps}>
                            <div className="flex items-center justify-center text-gray-400">
                              <GripVertical className="h-5 w-5" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{api.name}</TableCell>
                          <TableCell>{api.url}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                api.method === 'POST' ? 'bg-green-100 text-green-700' :
                                api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                api.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {api.method}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(api.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Tester"
                                disabled={isLoading}
                                onClick={() => openTestDialog(api)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Éditer"
                                onClick={() => router.push(`/apis/${api.id}`)}
                              >
                                <Edit className="h-4 w-4" />
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
                  ))}
                  {provided.placeholder}
                  {orderedApis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        Aucune API n'a été créée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </div>

      <AlertDialog open={!!apiToDelete} onOpenChange={() => setApiToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'API
              {apiToDelete?.name && ` "${apiToDelete.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => apiToDelete && deleteApi(apiToDelete)}
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
              {apiToTest ? `Tester ${apiToTest.name}` : `Tester ${selectedApis.size} APIs`}
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

            {testResult && (
              <div className="space-y-4 mt-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium mb-2">Résultat</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={testResult.status >= 400 ? 'text-red-600' : 'text-green-600'}>
                        {testResult.status} {testResult.statusText}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Headers:</span>
                      <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(testResult.headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">Response:</span>
                      <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">
                        {typeof testResult.data === 'string' 
                          ? testResult.data 
                          : JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Fermer
            </Button>
            <Button 
              onClick={handleTest}
              disabled={isTestLoading}
            >
              {isTestLoading ? "Test en cours..." : "Tester"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 