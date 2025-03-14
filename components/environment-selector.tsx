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

type Environment = {
  id: string
  name: string
}

type EnvironmentSelectorProps = {
  environments: Environment[]
  selectedEnvironmentId?: string | null
}

export function EnvironmentSelector({ environments, selectedEnvironmentId }: EnvironmentSelectorProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleEnvironmentChange = async (environmentId: string) => {
    try {
      const response = await fetch('/api/active-environment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ environmentId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'environnement actif')
      }

      const environment = environments.find(env => env.id === environmentId)
      toast({
        title: "Environnement actif mis à jour",
        description: `L'environnement "${environment?.name}" est maintenant actif.`,
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
      value={selectedEnvironmentId || undefined}
      onValueChange={handleEnvironmentChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sélectionner un environnement" />
      </SelectTrigger>
      <SelectContent>
        {environments.map((environment) => (
          <SelectItem key={environment.id} value={environment.id}>
            {environment.name}
          </SelectItem>
        ))}
        {environments.length === 0 && (
          <SelectItem value="empty" disabled>
            Aucun environnement disponible
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
} 