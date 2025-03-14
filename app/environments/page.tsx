import { prisma } from "@/lib/prisma"
import { EnvironmentTable } from "./components/environment-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EnvironmentsPage() {
  const environments = await prisma.environment.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          variableValues: true,
        },
      },
    },
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Environnements</h1>
        <Button asChild>
          <Link href="/environments/new">Créer un environnement</Link>
        </Button>
      </div>

      <EnvironmentTable environments={environments} />
    </div>
  )
} 