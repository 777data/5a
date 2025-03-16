import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { testMultipleApis, ApiToTest } from "@/app/services/api-test.service"

// Fonction pour remplacer les variables dans une chaîne
function replaceVariables(text: string, variables: Record<string, string>): string {
  if (!text) return text
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim()
    return variables[trimmedName] !== undefined ? variables[trimmedName] : match
  })
}

// Types pour les modèles Prisma
type VariableValue = {
  name: string;
  value: string;
}

type Collection = {
  id: string;
  name: string;
  apis: Array<{
    id: string;
    name: string;
    url: string;
    method: string;
    headers: Record<string, string> | null;
    body: string | Record<string, any> | null;
  }>;
}

/**
 * Route API pour tester une collection d'APIs
 * Cette route permet de tester toutes les APIs d'une collection
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const data = await request.json()
    const { collectionId, environmentId, authenticationId, previousResponse } = data
    
    // Vérifier que les données requises sont présentes
    if (!collectionId) {
      return NextResponse.json(
        { error: "L'ID de la collection est requis" },
        { status: 400 }
      )
    }
    
    if (!environmentId) {
      return NextResponse.json(
        { error: "L'ID de l'environnement est requis" },
        { status: 400 }
      )
    }
    
    console.log(`[API_COLLECTIONS_TEST] Test de la collection ${collectionId}`)
    
    // Récupérer la collection et ses APIs
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
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
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      )
    }
    
    if (!collection.application) {
      return NextResponse.json(
        { error: "Application non trouvée" },
        { status: 404 }
      )
    }
    
    if (collection.apis.length === 0) {
      return NextResponse.json(
        { error: "La collection ne contient aucune API" },
        { status: 400 }
      )
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
      environmentId,
      authenticationId,
      apis,
      previousResponse
    })
    
    console.log(`[API_COLLECTIONS_TEST] Test terminé avec le statut ${results.status}`)
    
    // Renvoyer les résultats
    return NextResponse.json(results)
  } catch (error) {
    console.error(`[API_COLLECTIONS_TEST] Erreur lors du test de la collection:`, error)
    
    return NextResponse.json(
      { error: "Erreur lors du test de la collection" },
      { status: 500 }
    )
  }
} 