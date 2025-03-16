import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { url, method, headers, body } = await request.json()

    console.log('[TEST_API]', url, method, headers, body)
    // Effectuer l'appel API avec les options CORS
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'Accept': '*/*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      },
      mode: 'cors',
      credentials: 'include',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

    // Préparer les headers de la réponse
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Déterminer le type de contenu de la réponse
    const contentType = response.headers.get('content-type')
    let data
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Retourner la réponse avec les headers CORS
    return new NextResponse(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    })
  } catch (error) {
    console.error('[TEST_API]', error)
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors du test de l'API",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      }
    )
  }
}

// Gérer les requêtes OPTIONS pour le preflight CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  })
} 