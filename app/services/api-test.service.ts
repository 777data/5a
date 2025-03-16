import { prisma } from "@/lib/prisma"

/**
 * Type pour une API à tester
 */
export type ApiToTest = {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string> | null
  body: any
  order?: number
}

/**
 * Type pour les variables d'environnement
 */
export type EnvironmentVariable = {
  name: string
  value: string
}

/**
 * Type pour l'authentification
 */
export type Authentication = {
  apiKey?: string | null
  token?: string | null
}

/**
 * Type pour les résultats de test
 */
export type ApiTestResult = {
  apiId: string
  statusCode: number
  duration: number
  response: {
    headers: Record<string, string>
    data: any
  }
  error: string | null
}

/**
 * Type pour les paramètres de test
 */
export type TestParams = {
  applicationId: string
  environmentId: string
  authenticationId?: string | null
  apis: ApiToTest[]
  previousResponse?: any
}

/**
 * Type pour les résultats de test complets
 */
export type TestResults = {
  id: string
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  duration: number
  results: ApiTestResult[]
}

/**
 * Remplace les variables dans une chaîne de caractères
 * @param template La chaîne de caractères contenant les variables à remplacer
 * @param variables Les variables à remplacer
 * @returns La chaîne de caractères avec les variables remplacées
 */
function replaceVariables(template: string, variables: EnvironmentVariable[]): string {
  if (!template) return template;
  
  let result = template;
  
  // Remplacer les variables standard
  variables.forEach(variable => {
    const pattern = new RegExp(`{{${variable.name}}}`, 'g');
    result = result.replace(pattern, variable.value);
  });
  
  return result;
}

/**
 * Remplace les variables de type response.body.xxx dans une chaîne de caractères
 * @param template La chaîne de caractères contenant les variables à remplacer
 * @param previousResponse La réponse précédente
 * @returns La chaîne de caractères avec les variables remplacées
 */
function replaceResponseVariables(template: string, previousResponse: any): string {
  if (!template || !previousResponse) return template;
  
  let result = template;
  
  // Trouver toutes les occurrences de {{response.body.xxx}}
  const responsePattern = /{{response\.body\.([\w\.]+)}}/g;
  let match;
  
  while ((match = responsePattern.exec(template)) !== null) {
    const fullMatch = match[0];
    const path = match[1].split('.');
    
    // Extraire la valeur du chemin dans la réponse
    let value = previousResponse;
    try {
      for (const key of path) {
        value = value[key];
        if (value === undefined) break;
      }
      
      // Remplacer la variable par la valeur si elle existe
      if (value !== undefined) {
        // Convertir en chaîne si nécessaire
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        result = result.replace(fullMatch, stringValue);
      }
    } catch (error) {
      console.warn(`[API_TEST_SERVICE] Impossible d'accéder au chemin ${path.join('.')} dans la réponse précédente`, error);
    }
  }
  
  return result;
}

/**
 * Récupère les variables d'environnement
 * @param environmentId ID de l'environnement
 * @returns Les variables d'environnement
 */
export async function getEnvironmentVariables(environmentId: string): Promise<EnvironmentVariable[]> {
  try {
    const variables = await prisma.variableValue.findMany({
      where: { environmentId },
      select: {
        name: true,
        value: true
      }
    });
    
    return variables;
  } catch (error) {
    console.error(`[API_TEST_SERVICE] Erreur lors de la récupération des variables:`, error);
    throw new Error("Impossible de récupérer les variables d'environnement");
  }
}

/**
 * Récupère l'authentification
 * @param authenticationId ID de l'authentification
 * @returns L'authentification
 */
export async function getAuthentication(authenticationId?: string | null): Promise<Authentication | null> {
  if (!authenticationId) return null;
  
  try {
    const authentication = await prisma.authentication.findUnique({
      where: { id: authenticationId },
      select: {
        apiKey: true,
        token: true
      }
    });
    
    return authentication;
  } catch (error) {
    console.error(`[API_TEST_SERVICE] Erreur lors de la récupération de l'authentification:`, error);
    throw new Error("Impossible de récupérer l'authentification");
  }
}

/**
 * Prépare les données pour l'appel API
 * @param api L'API à tester
 * @param variables Les variables d'environnement
 * @param authentication L'authentification
 * @param previousResponse La réponse précédente
 * @returns Les données préparées pour l'appel API
 */
export function prepareApiCallData(
  api: ApiToTest,
  variables: EnvironmentVariable[],
  authentication: Authentication | null,
  previousResponse?: any
) {
  // Remplacer les variables dans l'URL
  let url = api.url;
  if (variables.length > 0) {
    url = replaceVariables(url, variables);
  }
  if (previousResponse) {
    url = replaceResponseVariables(url, previousResponse);
  }
  
  // Préparer les headers avec les variables remplacées et l'authentification
  const headers: Record<string, string> = {};
  
  // Ajouter les informations d'authentification
  if (authentication) {
    if (authentication.apiKey) headers['apiKey'] = authentication.apiKey;
    if (authentication.token) headers['token'] = authentication.token;
  }
  
  // Ajouter les headers personnalisés de l'API
  if (api.headers) {
    Object.entries(api.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        let processedValue = value;
        if (variables.length > 0) {
          processedValue = replaceVariables(processedValue, variables);
        }
        if (previousResponse) {
          processedValue = replaceResponseVariables(processedValue, previousResponse);
        }
        headers[key] = processedValue;
      }
    });
  }
  
  // Préparer le body avec les variables remplacées si nécessaire
  let body = undefined;
  if (api.body) {
    if (typeof api.body === 'string') {
      let processedBody = api.body;
      if (variables.length > 0) {
        processedBody = replaceVariables(processedBody, variables);
      }
      if (previousResponse) {
        processedBody = replaceResponseVariables(processedBody, previousResponse);
      }
      body = processedBody;
    } else {
      // Si le body est un objet, on remplace les variables dans chaque valeur
      const bodyObj = { ...api.body };
      
      // Convertir en chaîne pour remplacer les variables
      let bodyString = JSON.stringify(bodyObj);
      if (variables.length > 0) {
        bodyString = replaceVariables(bodyString, variables);
      }
      if (previousResponse) {
        bodyString = replaceResponseVariables(bodyString, previousResponse);
      }
      
      // Reconvertir en objet
      try {
        body = JSON.parse(bodyString);
      } catch (error) {
        console.warn(`[API_TEST_SERVICE] Erreur lors de la conversion du body:`, error);
        body = bodyString;
      }
    }
  }
  
  return { url, method: api.method, headers, body };
}

/**
 * Teste une API
 * @param api L'API à tester
 * @param variables Les variables d'environnement
 * @param authentication L'authentification
 * @param previousResponse La réponse précédente
 * @returns Le résultat du test
 */
export async function testSingleApi(
  api: ApiToTest,
  variables: EnvironmentVariable[],
  authentication: Authentication | null,
  previousResponse?: any
): Promise<{ result: ApiTestResult, responseData: any }> {
  const startTime = Date.now();
  
  try {
    const { url, method, headers, body } = prepareApiCallData(api, variables, authentication, previousResponse);
    
    // Effectuer l'appel API via notre proxy
    const apiResponse = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method,
        headers,
        body
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!apiResponse.ok) {
      throw new Error(`Erreur HTTP: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const result = await apiResponse.json();
    
    // Vérifier si le status est 0 et le remplacer par 500
    const statusCode = result.status === 0 ? 500 : result.status;
    
    return {
      result: {
        apiId: api.id,
        statusCode,
        duration,
        response: {
          headers: result.headers,
          data: result.data
        },
        error: statusCode >= 400 ? result.statusText : null
      },
      responseData: result.data
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      result: {
        apiId: api.id,
        statusCode: 500,
        duration,
        response: {
          headers: {},
          data: null
        },
        error: error instanceof Error ? error.message : "Une erreur est survenue"
      },
      responseData: null
    };
  }
}

/**
 * Teste plusieurs APIs
 * @param params Les paramètres de test
 * @returns Les résultats des tests
 */
export async function testMultipleApis(params: TestParams): Promise<TestResults> {
  const { applicationId, environmentId, authenticationId, apis } = params;
  
  // Récupérer les variables d'environnement
  const variables = await getEnvironmentVariables(environmentId);
  
  // Récupérer l'authentification
  const authentication = await getAuthentication(authenticationId);
  
  // Trier les APIs par ordre si disponible
  const sortedApis = [...apis].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });
  
  // Tester chaque API dans l'ordre
  const results: ApiTestResult[] = [];
  let previousResponse = params.previousResponse;
  let totalDuration = 0;
  
  for (const api of sortedApis) {
    const { result, responseData } = await testSingleApi(api, variables, authentication, previousResponse);
    
    results.push(result);
    totalDuration += result.duration;
    
    // Stocker la réponse pour l'utiliser dans les tests suivants
    previousResponse = responseData;
  }
  
  // Déterminer le statut global
  let status: "SUCCESS" | "PARTIAL" | "FAILED" = "SUCCESS";
  
  // Si au moins une API a échoué avec un code 401, 403, 404 ou 5xx, c'est un échec
  const hasAuthErrors = results.some(result => 
    result.statusCode === 401 || 
    result.statusCode === 403 || 
    result.statusCode === 404 || 
    result.statusCode >= 500
  );
  
  // Si toutes les APIs ont échoué, c'est un échec
  const allFailed = results.every(result => result.statusCode >= 400);
  
  // Si au moins une API a échoué mais pas toutes, c'est partiel
  const someFailedButNotAll = results.some(result => result.statusCode >= 400) && !allFailed;
  
  // Forcer le statut à FAILED si au moins une API a retourné une erreur 401
  if (results.some(result => result.statusCode === 401)) {
    status = "FAILED";
  } else if (hasAuthErrors || allFailed) {
    status = "FAILED";
  } else if (someFailedButNotAll) {
    status = "PARTIAL";
  }
  
  // Enregistrer les résultats des tests
  const testData = await prisma.apiTest.create({
    data: {
      applicationId,
      environmentId,
      authenticationId,
      duration: totalDuration,
      status,
      results: {
        create: results.map(result => ({
          apiId: result.apiId,
          statusCode: result.statusCode,
          duration: result.duration,
          response: result.response,
          error: result.error
        }))
      }
    },
    select: {
      id: true
    }
  });
  
  return {
    id: testData.id,
    status,
    duration: totalDuration,
    results
  };
} 