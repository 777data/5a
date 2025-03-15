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
import { Edit, Play, Trash2 } from "lucide-react"
import { prisma } from "@/lib/prisma"

type Api = {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  body: any
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

type ApiTableProps = {
  apis: Api[]
  applicationId: string
  environments?: Environment[]
  authentications?: Authentication[]
  onTestSelected?: (selectedIds: string[]) => void
}

type TestResult = {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
}

const STORAGE_KEY = 'api-test-preferences'

// Fonction utilitaire pour remplacer les variables
function replaceVariables(template: string, variables: Array<{ name: string, value: string }>): string {
  let result = template
  variables.forEach(variable => {
    const pattern = new RegExp(`{{${variable.name}}}`, 'g')
    result = result.replace(pattern, variable.value)
  })
  return result
}

export function ApiTable({ 
  apis, 
  applicationId, 
  environments = [], 
  authentications = [],
  onTestSelected
}: ApiTableProps) {
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
  const [testResult, setTestResult] = useState<TestResult | null>(null)

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
    if (selectedApis.size === apis.length) {
      setSelectedApis(new Set())
    } else {
      setSelectedApis(new Set(apis.map(api => api.id)))
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
      const selectedApi = apis.find(api => api.id === apiId)
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
      const url = replaceVariables(selectedApi.url, variables)

      // Préparer les headers avec les variables remplacées et l'authentification
      const headers: Record<string, string> = {
        'apiKey': auth.apiKey,
        'token': auth.token
      }
      
      // Ajouter les headers personnalisés de l'API
      if (selectedApi.headers) {
        Object.entries(selectedApi.headers).forEach(([key, value]) => {
          headers[key] = replaceVariables(value, variables)
        })
      }

      // Préparer le body avec les variables remplacées si nécessaire
      let body = undefined
      if (selectedApi.body) {
        if (typeof selectedApi.body === 'string') {
          body = replaceVariables(selectedApi.body, variables)
        } else {
          // Si le body est un objet, on remplace les variables dans chaque valeur
          body = JSON.stringify(
            Object.entries(selectedApi.body).reduce((acc, [key, value]) => ({
              ...acc,
              [key]: typeof value === 'string' ? replaceVariables(value, variables) : value
            }), {})
          )
        }
      }

      // Log de la requête finale (en masquant les valeurs sensibles)
      console.log('Requête finale:', {
        url,
        method: selectedApi.method,
        headers: {
          ...headers
        },
        body
      })

      // Effectuer l'appel API
      const apiResponse = await fetch(url, {
        method: selectedApi.method,
        headers,
        body,
      })

      // Préparer les headers de la réponse
      const responseHeaders: Record<string, string> = {}
      apiResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // Déterminer le type de contenu de la réponse
      const contentType = apiResponse.headers.get('content-type')
      let data
      if (contentType?.includes('application/json')) {
        data = await apiResponse.json()
      } else {
        data = await apiResponse.text()
      }

      // Mettre à jour le résultat du test
      setTestResult({
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: responseHeaders,
        data
      })

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
    setIsTestLoading(true)
    try {
      // Récupérer les variables de l'environnement
      const response = await fetch(`/api/environments/${selectedEnvironment}/variables`)
      if (!response.ok) {
        throw new Error("Impossible de récupérer les variables")
      }
      const variables = await response.json()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors des tests",
      })
    } finally {
      setIsTestLoading(false)
      setIsTestDialogOpen(false)
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedApis.size === apis.length && apis.length > 0}
                  onCheckedChange={toggleAllApis}
                />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apis.map((api) => (
              <TableRow key={api.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedApis.has(api.id)}
                    onCheckedChange={() => toggleApiSelection(api.id)}
                  />
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
            ))}
            {apis.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  Aucune API n'a été créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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