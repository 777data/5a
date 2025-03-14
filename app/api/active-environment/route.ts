import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const { environmentId } = await request.json()
    
    // Stocke l'ID de l'environnement actif dans un cookie
    cookies().set('activeEnvironmentId', environmentId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'environnement actif:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de l'environnement actif" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const activeEnvironmentId = cookies().get('activeEnvironmentId')

    return NextResponse.json({ environmentId: activeEnvironmentId?.value || null })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'environnement actif:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de l'environnement actif" },
      { status: 500 }
    )
  }
} 