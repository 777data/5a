import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ApiToTest, TestResults } from '@/app/services/api-test.service'
import { 
  testApis as testApisAction, 
  testSingleApi as testSingleApiAction, 
  testCollection as testCollectionAction,
  resetLastResponse as resetLastResponseAction,
  redirectToTestResults
} from '@/app/actions/api-test.action'

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

  /**
   * Teste une ou plusieurs APIs
   */
  const testApis = async ({ 
    apis, 
    environmentId, 
    authenticationId, 
    previousResponse,
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
      let response;

      // Si un ID de collection est fourni, utiliser l'action de test de collection
      if (collectionId) {
        console.log(`[USE_API_TEST] Test de la collection ${collectionId}`, {
          environmentId,
          authenticationId,
          hasPreviousResponse: !!previousResponse
        })

        response = await testCollectionAction({
          collectionId,
          environmentId,
          authenticationId,
          previousResponse
        })
      } else {
        // Sinon, utiliser l'action de test d'APIs
        console.log(`[USE_API_TEST] Test de ${apis.length} API(s)`, {
          environmentId,
          authenticationId,
          hasPreviousResponse: !!previousResponse
        })

        response = await testApisAction({
          apis,
          environmentId,
          authenticationId,
          previousResponse,
          applicationId
        })
      }

      if (!response.success) {
        throw new Error(response.error || "Une erreur est survenue")
      }

      const results = response.results!
      setTestResults(results)

      // Afficher un message de succès
      toast({
        title: "Tests terminés",
        description: `${results.results.length} API(s) ont été testées.`,
      })

      // Rediriger vers la page d'historique des tests avec l'ID du test
      if (response.testId) {
        router.push(`/tests?testId=${response.testId}`)
      }

      // Retourner les résultats et l'ID du test
      return {
        results,
        testId: response.testId
      }
    } catch (error) {
      console.error('[USE_API_TEST] Erreur lors du test des APIs:', error)
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
    console.log(`[USE_API_TEST] Test de l'API ${api.name} (${api.id}):`, {
      environmentId,
      authenticationId,
      hasPreviousResponse: !!previousResponse
    })
    
    setIsLoading(true)
    
    try {
      const response = await testSingleApiAction(
        api, 
        environmentId, 
        authenticationId, 
        previousResponse,
        applicationId
      )
      
      if (!response.success) {
        throw new Error(response.error || "Une erreur est survenue")
      }
      
      const results = response.results!
      setTestResults(results)
      
      // Afficher un message de succès
      toast({
        title: "Test terminé",
        description: `L'API a été testée avec succès.`,
      })
      
      // Rediriger vers la page d'historique des tests avec l'ID du test
      if (response.testId) {
        router.push(`/tests?testId=${response.testId}`)
      }
      
      return results
    } catch (error) {
      console.error('[USE_API_TEST] Erreur lors du test de l\'API:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du test",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Teste une collection d'APIs
   */
  const testCollection = async (collectionId: string, environmentId: string, authenticationId: string | null, previousResponse?: any) => {
    console.log(`[USE_API_TEST] Test de la collection ${collectionId}:`, {
      environmentId,
      authenticationId,
      hasPreviousResponse: !!previousResponse
    })
    
    setIsLoading(true)
    
    try {
      // Appeler directement la Server Action pour tester la collection
      const response = await testCollectionAction({
        collectionId,
        environmentId,
        authenticationId,
        previousResponse
      })
      
      if (!response.success) {
        throw new Error(response.error || "Une erreur est survenue")
      }
      
      const results = response.results!
      setTestResults(results)
      
      // Afficher un message de succès
      toast({
        title: "Test terminé",
        description: `La collection a été testée avec succès.`,
      })
      
      // Rediriger vers la page d'historique des tests avec l'ID du test
      if (response.testId) {
        router.push(`/tests?testId=${response.testId}`)
      }
      
      // Retourner les résultats et l'ID du test
      return {
        results,
        testId: response.testId
      }
    } catch (error) {
      console.error('[USE_API_TEST] Erreur lors du test de la collection:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du test",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Réinitialise la dernière réponse mémorisée
   */
  const resetLastResponse = async () => {
    await resetLastResponseAction(applicationId)
    console.log("[USE_API_TEST] Dernière réponse réinitialisée")
  }

  return {
    isLoading,
    testResults,
    testApis,
    testSingleApi,
    testCollection,
    resetLastResponse
  }
} 