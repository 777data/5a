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
    
    console.log(`[API_TEST_SERVICE] Préparation de l'appel API pour ${api.name}:`, {
      url,
      method,
      headersCount: Object.keys(headers).length,
      hasBody: !!body
    });
    
    // Vérifier que l'URL est valide
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`[API_TEST_SERVICE] URL invalide: ${url}`);
      throw new Error(`URL invalide: ${url}`);
    }
    
    // Effectuer l'appel API directement (sans passer par le proxy)
    console.log(`[API_TEST_SERVICE] Appel direct à l'API pour ${api.name}`);
    
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Ajouter le body si nécessaire
    if (body && method !== "GET") {
      if (typeof body === "object") {
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }
    
    let response;
    try {
      response = await fetch(url, fetchOptions);
      console.log(`[API_TEST_SERVICE] Réponse reçue pour ${api.name} avec le statut ${response.status}`);
    } catch (error) {
      console.error(`[API_TEST_SERVICE] Erreur lors de l'appel à l'API ${api.name}:`, error);
      return {
        result: {
          apiId: api.id,
          statusCode: 0,
          duration: Date.now() - startTime,
          response: {
            headers: {},
            data: null
          },
          error: error instanceof Error ? error.message : "Erreur réseau"
        },
        responseData: null
      };
    }
    
    const duration = Date.now() - startTime;
    
    // Récupérer les headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Récupérer le body de la réponse
    let responseData;
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch (error) {
        console.warn(`[API_TEST_SERVICE] Erreur lors de la conversion du body en JSON:`, error);
        responseData = await response.text();
      }
    } else if (contentType?.includes("text/")) {
      responseData = await response.text();
    } else {
      // Pour les autres types de contenu, on renvoie le texte
      try {
        responseData = await response.text();
      } catch (error) {
        console.warn(`[API_TEST_SERVICE] Impossible de lire le body de la réponse:`, error);
        responseData = null;
      }
    }
    
    // Vérifier si le status est 0 et le remplacer par 500
    const statusCode = response.status === 0 ? 500 : response.status;
    if (response.status === 0) {
      console.warn(`[API_TEST_SERVICE] Status code 0 détecté pour ${api.name}, remplacé par 500`);
    }
    
    return {
      result: {
        apiId: api.id,
        statusCode,
        duration,
        response: {
          headers: responseHeaders,
          data: responseData
        },
        error: statusCode >= 400 ? response.statusText : null
      },
      responseData
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API_TEST_SERVICE] Erreur lors du test de l'API ${api.name}:`, error);
    
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
  console.log(`[API_TEST_SERVICE] Début du test de ${params.apis.length} API(s)`, {
    applicationId: params.applicationId,
    environmentId: params.environmentId,
    authenticationId: params.authenticationId,
    hasPreviousResponse: !!params.previousResponse
  });
  
  const startTime = Date.now();
  
  try {
    // Récupérer les variables d'environnement
    console.log(`[API_TEST_SERVICE] Récupération des variables d'environnement pour l'environnement ${params.environmentId}`);
    const variables = await getEnvironmentVariables(params.environmentId);
    console.log(`[API_TEST_SERVICE] ${variables.length} variables récupérées`);
    
    // Récupérer l'authentification
    console.log(`[API_TEST_SERVICE] Récupération de l'authentification ${params.authenticationId || 'aucune'}`);
    const authentication = await getAuthentication(params.authenticationId);
    console.log(`[API_TEST_SERVICE] Authentification récupérée:`, {
      hasApiKey: !!authentication?.apiKey,
      hasToken: !!authentication?.token
    });
    
    // Tester chaque API
    const results: ApiTestResult[] = [];
    let overallStatus = "SUCCESS";
    let previousResponseData = params.previousResponse;
    
    for (const api of params.apis) {
      console.log(`[API_TEST_SERVICE] Test de l'API ${api.name} (${api.id})`);
      
      try {
        const { result, responseData } = await testSingleApi(
          api,
          variables,
          authentication,
          previousResponseData
        );
        
        results.push(result);
        previousResponseData = responseData;
        
        // Mettre à jour le statut global
        if (result.statusCode >= 400 && overallStatus === "SUCCESS") {
          overallStatus = "PARTIAL";
        }
        
        console.log(`[API_TEST_SERVICE] Test de l'API ${api.name} terminé avec le statut ${result.statusCode}`);
      } catch (error) {
        console.error(`[API_TEST_SERVICE] Erreur lors du test de l'API ${api.name}:`, error);
        
        // Ajouter un résultat d'erreur
        results.push({
          apiId: api.id,
          statusCode: 500,
          duration: 0,
          response: {
            headers: {},
            data: null
          },
          error: error instanceof Error ? error.message : "Une erreur est survenue"
        });
        
        // Mettre à jour le statut global
        if (overallStatus === "SUCCESS") {
          overallStatus = "PARTIAL";
        }
      }
    }
    
    // Si tous les tests ont échoué, le statut global est "FAILED"
    if (results.every(result => result.statusCode >= 400)) {
      overallStatus = "FAILED";
    }
    
    const duration = Date.now() - startTime;
    
    // Enregistrer les résultats dans la base de données
    console.log(`[API_TEST_SERVICE] Enregistrement des résultats dans la base de données`);
    try {
      const test = await prisma.apiTest.create({
        data: {
          applicationId: params.applicationId,
          environmentId: params.environmentId,
          authenticationId: params.authenticationId,
          startedAt: new Date(startTime),
          duration,
          status: overallStatus,
          results: {
            create: results.map(result => ({
              apiId: result.apiId,
              statusCode: result.statusCode,
              duration: result.duration,
              response: {
                headers: result.response.headers,
                data: result.response.data
              },
              error: result.error
            }))
          }
        }
      });
      
      console.log(`[API_TEST_SERVICE] Résultats enregistrés avec l'ID ${test.id}`);
      
      return {
        id: test.id,
        status: overallStatus as "SUCCESS" | "PARTIAL" | "FAILED",
        duration,
        results
      };
    } catch (dbError) {
      console.error(`[API_TEST_SERVICE] Erreur lors de l'enregistrement des résultats:`, dbError);
      throw new Error("Erreur lors de l'enregistrement des résultats");
    }
  } catch (error) {
    console.error(`[API_TEST_SERVICE] Erreur lors du test des APIs:`, error);
    throw error;
  }
} 