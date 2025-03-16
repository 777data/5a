import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ApiToTest, TestResults } from '@/app/services/api-test.service'

type ApiTestHookParams = {
  applicationId: string
}

type TestApiParams = {
  apis: ApiToTest[]
  environmentId: string
  authenticationId: string | null
  previousResponse?: any
  collectionId?: string
}

export function useApiTest({ applicationId }: ApiTestHookParams) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [lastResponse, setLastResponse] = useState<any>(null)

  /**
   * Teste une ou plusieurs APIs
   */
  const testApis = async ({ 
    apis, 
    environmentId, 
    authenticationId, 
    previousResponse = lastResponse,
    collectionId
  }: TestApiParams) => {
    if (!environmentId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un environnement",
      })
      return null
    }

    // Vérifier si nous avons des APIs à tester ou un ID de collection
    if (apis.length === 0 && !collectionId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune API à tester",
      })
      return null
    }

    setIsLoading(true)
    setTestResults(null)

    try {
      // Déterminer l'endpoint à utiliser
      let endpoint = '/api/tests'
      let requestBody: any = {
        applicationId,
        environmentId,
        authenticationId,
        apis,
        previousResponse
      }

      // Si un ID de collection est fourni, utiliser l'endpoint de test de collection
      if (collectionId) {
        endpoint = '/api/collections/test'
        requestBody = {
          collectionId,
          environmentId,
          authenticationId,
          previousResponse
        }
      }

      console.log(`Envoi de la requête de test à ${endpoint}:`, {
        environmentId,
        authenticationId,
        apisCount: apis.length,
        collectionId,
        hasPreviousResponse: !!previousResponse
      })

      // Effectuer la requête
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Erreur lors du test des APIs:`, errorText)
        throw new Error("Erreur lors du test des APIs")
      }

      // Récupérer les résultats
      const results: TestResults = await response.json()
      setTestResults(results)

      // Stocker la dernière réponse pour les tests suivants
      if (results.results.length > 0) {
        const lastResult = results.results[results.results.length - 1]
        setLastResponse(lastResult.response.data)
        console.log("Dernière réponse mémorisée:", lastResult.response.data)
      }

      // Afficher un message de succès
      toast({
        title: "Tests terminés",
        description: `${results.results.length} API(s) ont été testées.`,
      })

      // Rediriger vers la page d'historique des tests avec l'ID du test
      router.push(`/tests?testId=${results.id}`)

      return results
    } catch (error) {
      console.error('Erreur lors du test des APIs:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors des tests",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Teste une seule API
   */
  const testSingleApi = async (api: ApiToTest, environmentId: string, authenticationId: string | null, previousResponse?: any) => {
    console.log(`Test de l'API ${api.name} (${api.id}):`, {
      environmentId,
      authenticationId,
      hasPreviousResponse: !!previousResponse
    })
    
    return testApis({
      apis: [api],
      environmentId,
      authenticationId,
      previousResponse: previousResponse || lastResponse
    })
  }

  /**
   * Teste une collection d'APIs
   */
  const testCollection = async (collectionId: string, environmentId: string, authenticationId: string | null, previousResponse?: any) => {
    console.log(`Test de la collection ${collectionId}:`, {
      environmentId,
      authenticationId,
      hasPreviousResponse: !!previousResponse
    })
    
    return testApis({
      apis: [],
      environmentId,
      authenticationId,
      previousResponse: previousResponse || lastResponse,
      collectionId
    })
  }

  /**
   * Réinitialise la dernière réponse mémorisée
   */
  const resetLastResponse = () => {
    setLastResponse(null)
    console.log("Dernière réponse réinitialisée")
  }

  return {
    isLoading,
    testResults,
    lastResponse,
    testApis,
    testSingleApi,
    testCollection,
    resetLastResponse
  }
} 