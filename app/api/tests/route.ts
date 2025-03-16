import { NextRequest, NextResponse } from "next/server";
import { testMultipleApis, ApiToTest, TestParams } from "@/app/services/api-test.service";

/**
 * Route API pour tester des APIs
 * Cette route permet de tester une ou plusieurs APIs
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const data = await request.json();
    const { applicationId, environmentId, authenticationId, apis, previousResponse } = data;
    
    // Vérifier que les données requises sont présentes
    if (!applicationId) {
      return NextResponse.json(
        { error: "L'ID de l'application est requis" },
        { status: 400 }
      );
    }
    
    if (!environmentId) {
      return NextResponse.json(
        { error: "L'ID de l'environnement est requis" },
        { status: 400 }
      );
    }
    
    if (!apis || !Array.isArray(apis) || apis.length === 0) {
      return NextResponse.json(
        { error: "Au moins une API est requise" },
        { status: 400 }
      );
    }
    
    // Vérifier que chaque API a les propriétés requises
    for (const api of apis) {
      if (!api.id || !api.url || !api.method) {
        return NextResponse.json(
          { error: "Chaque API doit avoir un ID, une URL et une méthode" },
          { status: 400 }
        );
      }
    }
    
    console.log(`[API_TESTS] Test de ${apis.length} API(s) pour l'application ${applicationId}`);
    
    // Préparer les paramètres de test
    const testParams: TestParams = {
      applicationId,
      environmentId,
      authenticationId,
      apis: apis as ApiToTest[],
      previousResponse
    };
    
    // Tester les APIs
    const results = await testMultipleApis(testParams);
    
    console.log(`[API_TESTS] Test terminé avec le statut ${results.status}`);
    
    // Renvoyer les résultats
    return NextResponse.json(results);
  } catch (error) {
    console.error(`[API_TESTS] Erreur lors du test des APIs:`, error);
    
    return NextResponse.json(
      { error: "Erreur lors du test des APIs" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tests = await prisma.apiTest.findMany({
      include: {
        environment: true,
        authentication: true,
        results: {
          include: {
            api: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('[GET_TESTS]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des tests" },
      { status: 500 }
    )
  }
} 