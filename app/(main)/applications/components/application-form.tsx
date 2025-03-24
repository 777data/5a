'use client'

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

const applicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  organizationId: z.string().optional().nullable(),
})

type ApplicationFormValues = z.infer<typeof applicationSchema>

type Organization = {
  id: string
  name: string
}

type Application = {
  id: string
  name: string
  organizationId?: string | null
  organization?: {
    id: string
    name: string
  } | null
}

type ApplicationFormProps = {
  application?: Application
}

export function ApplicationForm({ application }: ApplicationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: application?.name || "",
      organizationId: application?.organizationId || null,
    },
  })

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/organizations')
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des organisations')
        }
        const data = await response.json()
        setOrganizations(data)
      } catch (error) {
        console.error('Error:', error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les organisations",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [toast])

  async function onSubmit(data: ApplicationFormValues) {
    try {
      const url = application
        ? `/api/applications/${application.id}`
        : '/api/applications'
      const method = application ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Une erreur est survenue")
      }

      toast({
        title: application ? "Application modifiée" : "Application créée",
        description: application
          ? `L'application "${data.name}" a été modifiée avec succès.`
          : `L'application "${data.name}" a été créée avec succès.`,
      })

      router.push('/applications')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'application" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisation</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une organisation (optionnel)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">
                    Aucune organisation
                  </SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <Button type="submit">
            {application ? "Modifier" : "Créer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/applications')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
} 