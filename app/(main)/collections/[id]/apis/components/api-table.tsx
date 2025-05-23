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
import { Edit, Play, Trash2 } from "lucide-react"

type Api = {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
  order?: number
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
  collectionId: string
  environments?: Environment[]
  authentications?: Authentication[]
  onTestSelected?: (selectedIds: string[]) => void
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

export function ApiTable({ 
  apis, 
  applicationId, 
  collectionId,
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
  
  // Utiliser notre hook de test d'API
  const { 
    isLoading: isTestLoading, 
    testSingleApi, 
    testApis 
  } = useApiTest({ applicationId })

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
    setApiToTest(api || null)
    setIsTestDialogOpen(true)
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
      
      console.log(`[API_TABLE] Test de l'API ${apiToTest.name}`)
      // Utiliser le hook qui appelle maintenant la Server Action
      await testSingleApi(apiToTestData, environmentId, authenticationId)
      
      // Notifier le parent si la fonction de callback est disponible
      if (onTestSelected) {
        onTestSelected([apiToTest.id]);
      }
    } else if (selectedApis.size > 0) {
      // Tester plusieurs APIs sélectionnées
      const selectedApisList = apis
        .filter(api => selectedApis.has(api.id))
        .map(api => ({
          id: api.id,
          name: api.name,
          url: api.url,
          method: api.method,
          headers: api.headers,
          body: api.body,
          order: api.order
        }))
      
      console.log(`[API_TABLE] Test de ${selectedApisList.length} APIs sélectionnées`)
      // Utiliser le hook qui appelle maintenant la Server Action
      await testApis({
        apis: selectedApisList,
        environmentId,
        authenticationId
      })
      
      // Notifier le parent si la fonction de callback est disponible
      if (onTestSelected) {
        onTestSelected(Array.from(selectedApis));
      }
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
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedApis.size === apis.length && apis.length > 0}
                  onCheckedChange={toggleAllApis}
                  aria-label="Sélectionner toutes les APIs"
                />
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucune API trouvée
                </TableCell>
              </TableRow>
            ) : (
              apis.map((api) => (
                <TableRow key={api.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedApis.has(api.id)}
                      onCheckedChange={() => toggleApiSelection(api.id)}
                      aria-label={`Sélectionner ${api.name}`}
                    />
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
                        onClick={() => router.push(`/collections/${collectionId}/apis/${api.id}`)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              onClick={() => apiToDelete && deleteApi(apiToDelete)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boîte de dialogue de test */}
      <ApiTestDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        title={apiToTest ? `Tester l&apos;API &quot;${apiToTest.name}&quot;` : `Tester ${selectedApis.size} API(s)`}
        environments={environments}
        authentications={authentications}
        onTest={handleTest}
        isLoading={isTestLoading}
      />
    </>
  )
} 