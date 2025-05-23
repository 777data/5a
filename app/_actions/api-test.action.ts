'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  ApiToTest,
  TestResults,
  testMultipleApis
} from '@/lib/api-test.service'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// Définir un type pour les données de réponse
type ApiResponseData = Record<string, unknown>;

// Map pour stocker temporairement les réponses précédentes par application
// Clé: ID d'application, Valeur: dernière réponse
const applicationResponses = new Map<string, ApiResponseData>()

/**
 * Stocke la dernière réponse pour l'application
 * @param applicationId ID de l'application
 * @param response Réponse à stocker
 */
function storeLastResponse(applicationId: string, response: ApiResponseData): void {
  applicationResponses.set(applicationId, response)
  console.log(`[API_TEST_ACTION] Réponse stockée pour l'application ${applicationId.substring(0, 8)}...`)
}

/**
 * Récupère la dernière réponse pour l'application
 * @param applicationId ID de l'application
 * @returns Dernière réponse ou null
 */
function getLastResponse(applicationId: string): ApiResponseData | null {
  const response = applicationResponses.get(applicationId)
  console.log(`[API_TEST_ACTION] Récupération de la réponse pour l'application ${applicationId.substring(0, 8)}...`, {
    exists: !!response,
    type: response ? typeof response : 'undefined'
  })
  return response || null
}

/**
 * Type pour les paramètres de test d'API
 */
type TestApiParams = {
  apis: ApiToTest[]
  environmentId: string
  authenticationId: string | null
  previousResponse?: ApiResponseData
  applicationId: string
}

/**
 * Type pour les paramètres de test de collection
 */
type TestCollectionParams = {
  collectionId: string
  environmentId: string
  authenticationId: string | null
  previousResponse?: ApiResponseData
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
  console.log(`[API_TEST_ACTION] Test de ${params.apis.length} API(s)`)
  
  try {
    // Générer un sessionId unique pour ce test
    const sessionId = randomUUID()

    // Tester les APIs
    const results = await testMultipleApis({
      applicationId: params.applicationId,
      environmentId: params.environmentId,
      authenticationId: params.authenticationId,
      apis: params.apis,
      previousResponse: params.previousResponse,
      sessionId
    })

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
    
    // Stocker la dernière réponse pour les tests suivants
    if (results.results.length > 0) {
      const lastResult = results.results[results.results.length - 1]
      storeLastResponse(params.applicationId, lastResult.response.data as ApiResponseData)
    }

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
 * @param previousResponse La réponse précédente (optionnel, utilisé seulement si fourni)
 * @param applicationId L'ID de l'application
 * @returns Les résultats du test
 */
export async function testSingleApi(
  api: ApiToTest, 
  environmentId: string, 
  authenticationId: string | null, 
  previousResponse: ApiResponseData | null,
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
    previousResponse: previousResponse || undefined,
    applicationId
  })
}

/**
 * Teste une collection d'APIs
 * @param params Les paramètres de test de collection
 * @returns Les résultats du test
 */
export async function testCollection(params: TestCollectionParams): Promise<TestActionResponse> {
  console.log(`[API_TEST_ACTION] Test de la collection ${params.collectionId}`)
  
  try {
    // Récupérer la collection avec ses APIs
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
      include: {
        application: true,
        apis: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!collection) {
      throw new Error("Collection introuvable")
    }

    // Récupérer la dernière réponse pour l'application
    const previousResponse = params.previousResponse || getLastResponse(collection.application.id)

    // Convertir les APIs de la collection au format attendu
    const apis = collection.apis.map(api => ({
      id: api.id,
      name: api.name,
      url: api.url,
      method: api.method,
      headers: api.headers as Record<string, string> | null,
      body: api.body,
      order: api.order
    }))

    // Générer un sessionId unique pour ce test
    const sessionId = randomUUID()

    // Tester les APIs
    const results = await testMultipleApis({
      applicationId: collection.application.id,
      environmentId: params.environmentId,
      authenticationId: params.authenticationId,
      apis,
      previousResponse,
      sessionId
    })

    console.log(`[API_TEST_ACTION] Test terminé avec le statut ${results.status}`)

    // Stocker la dernière réponse pour les tests suivants
    if (results.results.length > 0) {
      const lastResult = results.results[results.results.length - 1]
      storeLastResponse(collection.application.id, lastResult.response.data as ApiResponseData)
    }

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
 * Réinitialise la dernière réponse mémorisée pour l'application
 * @param applicationId ID de l'application
 */
export async function resetLastResponse(applicationId: string): Promise<void> {
  applicationResponses.delete(applicationId)
  console.log(`[API_TEST_ACTION] Réponse réinitialisée pour l'application ${applicationId.substring(0, 8)}...`)
}

/**
 * Redirige vers la page des résultats de test
 * @param testId L'ID du test
 */
export async function redirectToTestResults(testId: string): Promise<void> {
  redirect(`/tests?testId=${testId}`)
} 