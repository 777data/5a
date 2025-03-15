'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type Application = {
  id: string
  name: string
}

type ApplicationSelectorProps = {
  applications: Application[]
  selectedApplicationId?: string | null
}

export function ApplicationSelector({ applications, selectedApplicationId }: ApplicationSelectorProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleApplicationChange = async (applicationId: string) => {
    try {
      const response = await fetch('/api/active-application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'application active')
      }

      const application = applications.find(app => app.id === applicationId)
      toast({
        title: "Application active mise à jour",
        description: `L'application "${application?.name}" est maintenant active.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    }
  }

  return (
    <Select
      value={selectedApplicationId || undefined}
      onValueChange={handleApplicationChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sélectionner une application" />
      </SelectTrigger>
      <SelectContent>
        {applications.map((application) => (
          <SelectItem key={application.id} value={application.id}>
            {application.name}
          </SelectItem>
        ))}
        {applications.length === 0 && (
          <SelectItem value="empty" disabled>
            Aucune application disponible
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
} 