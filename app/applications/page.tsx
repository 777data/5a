import { prisma } from "@/lib/prisma"
import { ApplicationTable } from "./components/application-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          environments: true,
        },
      },
    },
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Button asChild>
          <Link href="/applications/new">Créer une application</Link>
        </Button>
      </div>

      <ApplicationTable applications={applications} />
    </div>
  )
} 