import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const updateApplicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("applications") + 1];
    
    const json = await request.json()
    const body = updateApplicationSchema.parse(json)

    const application = await prisma.application.update({
      where: {
        id: id,
      },
      data: body,
    })

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[APPLICATIONS_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'application" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("applications") + 1];
    
    // Vérifier si l'application existe
    const application = await prisma.application.findUnique({
      where: { id: id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application non trouvée" },
        { status: 404 }
      )
    }

    // Utiliser une transaction pour supprimer toutes les entités liées
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les résultats de tests d'API
      await tx.apiTestResult.deleteMany({
        where: {
          apiTest: {
            applicationId: id
          }
        }
      })

      // 2. Supprimer les tests d'API
      await tx.apiTest.deleteMany({
        where: { applicationId: id }
      })

      // 3. Supprimer les valeurs de variables d'environnement
      await tx.variableValue.deleteMany({
        where: {
          environment: {
            applicationId: id
          }
        }
      })

      // 4. Supprimer les environnements
      await tx.environment.deleteMany({
        where: { applicationId: id }
      })

      // 5. Supprimer les authentifications
      await tx.authentication.deleteMany({
        where: { applicationId: id }
      })

      // 6. Supprimer les APIs via les collections
      await tx.api.deleteMany({
        where: {
          collection: {
            applicationId: id
          }
        }
      })

      // 7. Supprimer les collections
      await tx.collection.deleteMany({
        where: { applicationId: id }
      })

      // 8. Finalement, supprimer l'application
      await tx.application.delete({
        where: { id }
      })
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[APPLICATIONS_DELETE]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'application" },
      { status: 500 }
    )
  }
} 