import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "../components/application-form"

type Props = {
  params: {
    id: string
  }
}

export default async function EditApplicationPage({ params }: Props) {
  const application = await prisma.application.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!application) {
    notFound()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Modifier l&apos;application &quot;{application.name}&quot;
      </h1>
      <ApplicationForm application={application} />
    </div>
  )
} 