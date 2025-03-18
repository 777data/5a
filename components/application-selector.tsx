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
import { useEffect, useRef, useCallback } from "react"

type Application = {
  id: string
  name: string
}

type ApplicationSelectorProps = {
  applications: Application[]
  selectedApplicationId?: string | null
}

const LOCAL_STORAGE_KEY = 'selectedApplicationId'

export function ApplicationSelector({ applications, selectedApplicationId: initialSelectedApplicationId }: ApplicationSelectorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const hasShownToast = useRef(false)

  const handleApplicationChange = useCallback(async (applicationId: string) => {
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

      // Sauvegarder dans le localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, applicationId)

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
  }, [applications, router, toast])

  // Effet pour charger l'application depuis le localStorage au démarrage
  useEffect(() => {
    // Ne s'exécute qu'une seule fois au montage du composant
    if (!initialSelectedApplicationId && applications.length > 0) {
      const savedApplicationId = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (savedApplicationId && applications.some(app => app.id === savedApplicationId)) {
        handleApplicationChange(savedApplicationId)
      } else if (!hasShownToast.current) {
        hasShownToast.current = true
        toast({
          variant: "destructive",
          title: "Sélection requise",
          description: "Veuillez sélectionner une application pour continuer.",
        })
      }
    }
  }, [initialSelectedApplicationId, applications, toast, handleApplicationChange])

  return (
    <Select
      value={initialSelectedApplicationId || undefined}
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