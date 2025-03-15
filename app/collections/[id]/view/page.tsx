import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ApiTable } from "@/app/apis/components/api-table"
import { ApiOrderManager } from "@/app/collections/components/api-order-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, List, SortAsc } from "lucide-react"

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const collectionId = params.id
  
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      application: {
        select: {
          id: true,
          name: true,
        }
      },
      apis: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!collection) {
    return notFound()
  }

  // Récupérer les environnements et authentifications pour le test des APIs
  const environments = await prisma.environment.findMany({
    where: { applicationId: collection.application.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const authentications = await prisma.authentication.findMany({
    where: { applicationId: collection.application.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {collection.application.name}
          </p>
          {collection.description && (
            <p className="mt-2">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/collections/${collection.id}/edit`}>
              Modifier
            </Link>
          </Button>
          <Button asChild>
            <Link 
              href={`/apis/new?collectionId=${collection.id}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une API
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste des APIs
          </TabsTrigger>
          <TabsTrigger value="order" className="flex items-center gap-2">
            <SortAsc className="h-4 w-4" />
            Ordre d'exécution
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="apis" className="mt-0">
          <ApiTable 
            apis={collection.apis} 
            applicationId={collection.application.id}
            environments={environments}
            authentications={authentications}
          />
        </TabsContent>
        
        <TabsContent value="order" className="mt-0">
          <ApiOrderManager 
            apis={collection.apis} 
            collectionId={collection.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 