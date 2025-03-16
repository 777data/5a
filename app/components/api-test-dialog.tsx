'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ApiToTest } from "@/app/services/api-test.service"

const STORAGE_KEY = 'api-test-preferences'

type Environment = {
  id: string
  name: string
}

type Authentication = {
  id: string
  name: string
}

type ApiTestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  environments: Environment[]
  authentications: Authentication[]
  onTest: (environmentId: string, authenticationId: string | null) => Promise<void>
  isLoading: boolean
}

export function ApiTestDialog({
  open,
  onOpenChange,
  title,
  environments,
  authentications,
  onTest,
  isLoading
}: ApiTestDialogProps) {
  const { toast } = useToast()
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('')
  const [selectedAuthentication, setSelectedAuthentication] = useState<string>('')

  // Charger les préférences depuis le localStorage
  useEffect(() => {
    const preferences = localStorage.getItem(STORAGE_KEY)
    if (preferences) {
      try {
        const { environmentId, authenticationId } = JSON.parse(preferences)
        setSelectedEnvironment(environmentId || '')
        setSelectedAuthentication(authenticationId || '')
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error)
      }
    }
    
    // Si aucune préférence n'est définie mais qu'il y a des environnements disponibles,
    // sélectionner le premier par défaut
    if (!selectedEnvironment && environments.length > 0) {
      setSelectedEnvironment(environments[0].id)
    }
  }, [environments, selectedEnvironment])

  // Sauvegarder les préférences dans le localStorage
  useEffect(() => {
    if (selectedEnvironment) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        environmentId: selectedEnvironment,
        authenticationId: selectedAuthentication,
      }))
    }
  }, [selectedEnvironment, selectedAuthentication])

  const handleTest = async () => {
    if (!selectedEnvironment) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un environnement",
      })
      return
    }

    await onTest(selectedEnvironment, selectedAuthentication || null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="environment" className="text-sm font-medium">
                Environnement
              </label>
              <Select
                value={selectedEnvironment}
                onValueChange={setSelectedEnvironment}
              >
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Sélectionner un environnement" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="authentication" className="text-sm font-medium">
                Authentification
              </label>
              <Select
                value={selectedAuthentication}
                onValueChange={setSelectedAuthentication}
              >
                <SelectTrigger id="authentication">
                  <SelectValue placeholder="Sélectionner une authentification" />
                </SelectTrigger>
                <SelectContent>
                  {authentications.map((auth) => (
                    <SelectItem key={auth.id} value={auth.id}>
                      {auth.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? "Test en cours..." : "Tester"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 