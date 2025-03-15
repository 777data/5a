import { prisma } from "@/lib/prisma"
import { CollectionForm } from "../../components/collection-form"
import { notFound } from "next/navigation"

export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const collectionId = params.id
  
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })

  if (!collection) {
    return notFound()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Modifier la collection</h1>
      <CollectionForm collection={collection} />
    </div>
  )
} 