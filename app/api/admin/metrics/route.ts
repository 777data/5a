import { NextResponse } from "next/server"
import { getServerMetrics } from "@/app/admin/metrics/actions"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const metrics = await getServerMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    )
  }
} 