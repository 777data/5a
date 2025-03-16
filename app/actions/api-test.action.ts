'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  ApiToTest, 
  TestResults, 
  testMultipleApis 
} from '@/app/services/api-test.service'
import { prisma } from '@/lib/prisma'

/**
 * Type pour les paramètres de test d'API
 */
type TestApiParams = {
  apis: ApiToTest[]
  environmentId: string
  authenticationId: string | null
  previousResponse?: any
  applicationId: string
}

/**
 * Type pour les paramètres de test de collection
 */
type TestCollectionParams = {
  collectionId: string
  environmentId: string
  authenticationId: string | null
  previousResponse?: any
}

/**
 * Type pour la réponse de l'action de test
 */
type TestActionResponse = {
  success: boolean
  message: string
  results?: TestResults
  error?: string
  testId?: string
}

/**
 * Teste une ou plusieurs APIs
 * @param params Les paramètres de test
 * @returns Les résultats du test
 */
export async function testApis(params: TestApiParams): Promise<TestActionResponse> {
  console.log(`[API_TEST_ACTION] Début du test de ${params.apis.length} API(s)`, {
    applicationId: params.applicationId,
    environmentId: params.environmentId,
    authenticationId: params.authenticationId,
    hasPreviousResponse: !!params.previousResponse
  })

  try {
    // Vérifier que les données requises sont présentes
    if (!params.environmentId) {
      return {
        success: false,
        message: "Veuillez sélectionner un environnement",
        error: "L'ID de l'environnement est requis"
      }
    }

    if (!params.applicationId) {
      return {
        success: false,
        message: "L'ID de l'application est requis",
        error: "L'ID de l'application est requis"
      }
    }

    if (params.apis.length === 0) {
      return {
        success: false,
        message: "Aucune API à tester",
        error: "Au moins une API est requise"
      }
    }

    // Tester les APIs
    const results = await testMultipleApis({
      applicationId: params.applicationId,
      environmentId: params.environmentId,
      authenticationId: params.authenticationId,
      apis: params.apis,
      previousResponse: params.previousResponse
    })

    console.log(`[API_TEST_ACTION] Test terminé avec le statut ${results.status}`)

    // Revalider le chemin des tests pour mettre à jour l'interface
    revalidatePath('/tests')

    return {
      success: true,
      message: `${results.results.length} API(s) ont été testées avec succès`,
      results,
      testId: results.id
    }
  } catch (error) {
    console.error(`[API_TEST_ACTION] Erreur lors du test des APIs:`, error)
    
    return {
      success: false,
      message: "Une erreur est survenue lors des tests",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }
  }
}

/**
 * Teste une seule API
 * @param api L'API à tester
 * @param environmentId L'ID de l'environnement
 * @param authenticationId L'ID de l'authentification
 * @param previousResponse La réponse précédente
 * @param applicationId L'ID de l'application
 * @returns Les résultats du test
 */
export async function testSingleApi(
  api: ApiToTest, 
  environmentId: string, 
  authenticationId: string | null, 
  previousResponse: any | null,
  applicationId: string
): Promise<TestActionResponse> {
  console.log(`[API_TEST_ACTION] Test de l'API ${api.name} (${api.id})`, {
    environmentId,
    authenticationId,
    hasPreviousResponse: !!previousResponse
  })

  return testApis({
    apis: [api],
    environmentId,
    authenticationId,
    previousResponse,
    applicationId
  })
}

/**
 * Teste une collection d'APIs
 * @param params Les paramètres de test de collection
 * @returns Les résultats du test
 */
export async function testCollection(params: TestCollectionParams): Promise<TestActionResponse> {
  console.log(`[API_TEST_ACTION] Test de la collection ${params.collectionId}`, {
    environmentId: params.environmentId,
    authenticationId: params.authenticationId,
    hasPreviousResponse: !!params.previousResponse
  })

  try {
    // Vérifier que les données requises sont présentes
    if (!params.environmentId) {
      return {
        success: false,
        message: "Veuillez sélectionner un environnement",
        error: "L'ID de l'environnement est requis"
      }
    }

    if (!params.collectionId) {
      return {
        success: false,
        message: "L'ID de la collection est requis",
        error: "L'ID de la collection est requis"
      }
    }

    // Récupérer la collection et ses APIs
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
      include: {
        apis: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            url: true,
            method: true,
            headers: true,
            body: true,
            order: true
          }
        },
        application: {
          select: {
            id: true
          }
        }
      }
    })

    if (!collection) {
      return {
        success: false,
        message: "Collection non trouvée",
        error: "Collection non trouvée"
      }
    }

    if (!collection.application) {
      return {
        success: false,
        message: "Application non trouvée",
        error: "Application non trouvée"
      }
    }

    if (collection.apis.length === 0) {
      return {
        success: false,
        message: "La collection ne contient aucune API",
        error: "La collection ne contient aucune API"
      }
    }

    // Préparer les APIs pour le test
    const apis: ApiToTest[] = collection.apis.map(api => ({
      id: api.id,
      name: api.name,
      url: api.url,
      method: api.method,
      headers: api.headers as Record<string, string> | null,
      body: api.body,
      order: api.order
    }))

    // Tester les APIs
    const results = await testMultipleApis({
      applicationId: collection.application.id,
      environmentId: params.environmentId,
      authenticationId: params.authenticationId,
      apis,
      previousResponse: params.previousResponse
    })

    console.log(`[API_TEST_ACTION] Test terminé avec le statut ${results.status}`)

    // Revalider le chemin des tests pour mettre à jour l'interface
    revalidatePath('/tests')

    return {
      success: true,
      message: `${results.results.length} API(s) ont été testées avec succès`,
      results,
      testId: results.id
    }
  } catch (error) {
    console.error(`[API_TEST_ACTION] Erreur lors du test de la collection:`, error)
    
    return {
      success: false,
      message: "Une erreur est survenue lors des tests",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }
  }
}

/**
 * Redirige vers la page des résultats de test
 * @param testId L'ID du test
 */
export async function redirectToTestResults(testId: string): Promise<void> {
  redirect(`/tests?testId=${testId}`)
} 