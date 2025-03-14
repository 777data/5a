import { prisma } from "@/lib/prisma"
import { EnvironmentTable } from "./components/environment-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EnvironmentsPage() {
  const environments = await prisma.environment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          variableValues: true
        }
      }
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Liste des Environnements</h1>
        <Button asChild>
          <Link href="/environments/new" className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouvel Environnement
          </Link>
        </Button>
      </div>
      <EnvironmentTable environments={environments} />
    </div>
  )
} 