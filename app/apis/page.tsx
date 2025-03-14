import { prisma } from "@/lib/prisma"
import { ApiTable } from "./components/api-table"
import { Button } from "@/components/ui/button"

export default async function ApisPage() {
  const apis = await prisma.api.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Liste des APIs</h1>
        <Button className="flex items-center gap-2">
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
          Nouvelle API
        </Button>
      </div>
      <ApiTable apis={apis} />
    </div>
  )
} 