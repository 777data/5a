import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createVariableValueSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const environmentId = segments[segments.indexOf("environments") + 1];

    // Récupérer toutes les variables de l'environnement
    const variables = await prisma.variableValue.findMany({
      where: {
        environmentId: environmentId
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(variables)
  } catch (error) {
    console.error('[GET_VARIABLES]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des variables" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const environmentId = segments[segments.indexOf("environments") + 1];
    
    const json = await request.json()
    const body = createVariableValueSchema.parse(json)

    // Vérifier si l'environnement existe
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
    })

    if (!environment) {
      return NextResponse.json(
        { error: "Environnement non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si une variable avec ce nom existe déjà dans cet environnement
    const existingValue = await prisma.variableValue.findUnique({
      where: {
        name_environmentId: {
          name: body.name,
          environmentId: environmentId,
        },
      },
    })

    if (existingValue) {
      return NextResponse.json(
        { error: "Cette variable existe déjà dans cet environnement" },
        { status: 400 }
      )
    }

    // Créer la valeur de la variable
    const variableValue = await prisma.variableValue.create({
      data: {
        name: body.name,
        value: body.value,
        environmentId: environmentId,
      },
    })

    return NextResponse.json(variableValue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error('[CREATE_VARIABLE_VALUE]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la variable" },
      { status: 500 }
    )
  }
} 