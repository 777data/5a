import { prisma } from "@/lib/prisma"
import { ApplicationTable } from "./components/application-table"
import Link from "next/link"
import { Plus } from "lucide-react"

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
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Link href="/applications/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="h-5 w-5" />
          Créer une application
        </Link>
      </div>

      <ApplicationTable applications={applications} />
    </div>
  )
} 