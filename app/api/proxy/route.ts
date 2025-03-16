import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy pour les appels API externes
 * Cette route permet d'effectuer des appels API externes depuis le client
 * en contournant les restrictions CORS
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const { url, method, headers, body } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: "L'URL est requise" },
        { status: 400 }
      );
    }
    
    // Vérifier que la méthode est valide
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const requestMethod = method?.toUpperCase() || "GET";
    
    if (!validMethods.includes(requestMethod)) {
      return NextResponse.json(
        { error: "Méthode HTTP non valide" },
        { status: 400 }
      );
    }
    
    console.log(`[API_PROXY] Appel API: ${requestMethod} ${url}`);
    
    // Préparer les options de la requête
    const fetchOptions: RequestInit = {
      method: requestMethod,
      headers: headers || {},
    };
    
    // Ajouter le body si nécessaire
    if (body && requestMethod !== "GET") {
      if (typeof body === "object") {
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }
    
    // Effectuer l'appel API
    const startTime = Date.now();
    let response;
    
    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      console.error(`[API_PROXY] Erreur lors de l'appel API:`, error);
      
      return NextResponse.json(
        {
          status: 0,
          statusText: error instanceof Error ? error.message : "Erreur réseau",
          headers: {},
          data: null
        },
        { status: 200 } // On renvoie 200 pour que le client puisse traiter l'erreur
      );
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
        console.warn(`[API_PROXY] Erreur lors de la conversion du body en JSON:`, error);
        responseData = await response.text();
      }
    } else if (contentType?.includes("text/")) {
      responseData = await response.text();
    } else {
      // Pour les autres types de contenu, on renvoie le texte
      try {
        responseData = await response.text();
      } catch (error) {
        console.warn(`[API_PROXY] Impossible de lire le body de la réponse:`, error);
        responseData = null;
      }
    }
    
    console.log(`[API_PROXY] Réponse API: ${response.status} (${duration}ms)`);
    
    // Renvoyer la réponse
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData
    });
  } catch (error) {
    console.error(`[API_PROXY] Erreur lors du traitement de la requête:`, error);
    
    return NextResponse.json(
      { error: "Erreur lors du traitement de la requête" },
      { status: 500 }
    );
  }
} 