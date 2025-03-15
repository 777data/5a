import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

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

export async function POST(request: NextRequest) {
  try {
    const { collectionIds, environmentId, authenticationId, applicationId } = await request.json()

    if (!collectionIds || !Array.isArray(collectionIds) || collectionIds.length === 0) {
      return NextResponse.json({ error: "Aucune collection sélectionnée" }, { status: 400 })
    }

    if (!environmentId) {
      return NextResponse.json({ error: "Environnement non spécifié" }, { status: 400 })
    }

    if (!authenticationId) {
      return NextResponse.json({ error: "Authentification non spécifiée" }, { status: 400 })
    }

    // Récupérer les variables de l'environnement
    const variablesResponse = await prisma.variableValue.findMany({
      where: { environmentId },
      select: {
        name: true,
        value: true
      }
    })

    const variables: Record<string, string> = {}
    variablesResponse.forEach((varValue: VariableValue) => {
      variables[varValue.name] = varValue.value
    })

    // Récupérer l'authentification
    const auth = await prisma.authentication.findUnique({
      where: { id: authenticationId },
      select: {
        apiKey: true,
        token: true
      }
    })

    if (!auth) {
      return NextResponse.json({ error: "Authentification non trouvée" }, { status: 404 })
    }

    // Récupérer toutes les APIs des collections sélectionnées
    const collections = await prisma.collection.findMany({
      where: { 
        id: { in: collectionIds },
        applicationId
      },
      include: {
        apis: true
      }
    })

    if (!collections || collections.length === 0) {
      return NextResponse.json({ error: "Aucune collection trouvée" }, { status: 404 })
    }

    // Extraire toutes les APIs des collections
    const apis = collections.flatMap((collection: Collection) => collection.apis || [])

    if (apis.length === 0) {
      return NextResponse.json({ error: "Aucune API trouvée dans les collections sélectionnées" }, { status: 404 })
    }

    // Préparer les résultats
    const results: Array<{
      apiId: string;
      apiName: string;
      status: string;
      statusCode: number;
      duration: number;
      response: any;
    }> = []
    let totalDuration = 0
    let overallStatus = "SUCCESS"
    
    // Obtenir l'URL de base de l'application
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    // Tester chaque API
    for (const api of apis) {
      try {
        // Remplacer les variables dans l'URL
        const url = replaceVariables(api.url, variables)

        // Préparer les headers avec les variables remplacées et l'authentification
        const apiHeaders: Record<string, string> = {
          'apiKey': auth.apiKey || '',
          'token': auth.token || ''
        }
        
        // Ajouter les headers personnalisés de l'API
        if (api.headers) {
          Object.entries(api.headers as Record<string, string>).forEach(([key, value]) => {
            apiHeaders[key] = replaceVariables(value, variables)
          })
        }

        // Préparer le body avec les variables remplacées si nécessaire
        let body = undefined
        if (api.body) {
          if (typeof api.body === 'string') {
            body = replaceVariables(api.body, variables)
          } else {
            // Si le body est un objet, on remplace les variables dans chaque valeur
            body = JSON.stringify(
              Object.entries(api.body as Record<string, any>).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: typeof value === 'string' ? replaceVariables(value, variables) : value
              }), {})
            )
          }
        }

        const startTime = Date.now()

        // Effectuer l'appel API via notre proxy
        const apiResponse = await fetch(`${baseUrl}/api/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            method: api.method,
            headers: apiHeaders,
            body
          })
        })

        const duration = Date.now() - startTime
        totalDuration += duration

        const result = await apiResponse.json()

        // Ajouter le résultat à la liste
        results.push({
          apiId: api.id,
          apiName: api.name,
          status: apiResponse.ok ? "SUCCESS" : "FAILURE",
          statusCode: result.status || 0,
          duration,
          response: result
        })

        // Mettre à jour le statut global si nécessaire
        if (!apiResponse.ok && overallStatus === "SUCCESS") {
          overallStatus = "FAILURE"
        }
      } catch (error) {
        console.error(`Erreur lors du test de l'API ${api.name}:`, error)
        
        // Ajouter l'erreur aux résultats
        results.push({
          apiId: api.id,
          apiName: api.name,
          status: "ERROR",
          statusCode: 0,
          duration: 0,
          response: { error: error instanceof Error ? error.message : "Erreur inconnue" }
        })
        
        // Mettre à jour le statut global
        overallStatus = "FAILURE"
      }
    }

    // Créer les résultats de test individuels
    const apiTestResults = results.map(result => ({
      statusCode: result.statusCode || 0,
      duration: result.duration,
      response: result.response,
      error: result.status === "ERROR" ? (result.response.error || "Erreur inconnue") : null,
      apiId: result.apiId
    }));

    // Enregistrer les résultats du test dans la base de données
    const testData = await prisma.apiTest.create({
      data: {
        applicationId,
        environmentId,
        authenticationId,
        duration: totalDuration,
        status: overallStatus,
        results: {
          create: apiTestResults
        }
      },
      select: {
        id: true
      }
    })

    return NextResponse.json({ id: testData.id, status: overallStatus })
  } catch (error) {
    console.error("Erreur lors du test des collections:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Une erreur est survenue" },
      { status: 500 }
    )
  }
} 