'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  token: z.string().min(1, "Le token est requis"),
  apiKey: z.string().min(1, "La clé API est requise"),
})

type FormValues = z.infer<typeof formSchema>

type Authentication = {
  id: string
  name: string
  token: string
  apiKey: string
}

type AuthenticationFormProps = {
  applicationId: string
  authentication: Authentication | null
}

export function AuthenticationForm({ applicationId, authentication }: AuthenticationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: authentication?.name ?? "",
      token: authentication?.token ?? "",
      apiKey: authentication?.apiKey ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const url = authentication
        ? `/api/applications/${applicationId}/authentications/${authentication.id}`
        : `/api/applications/${applicationId}/authentications`

      const response = await fetch(url, {
        method: authentication ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Une erreur est survenue')
      }

      toast({
        title: authentication ? "Authentification modifiée" : "Authentification créée",
        description: `L'authentification a été ${authentication ? 'modifiée' : 'créée'} avec succès.`,
      })

      router.push('/authentications')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clé API</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {authentication ? 'Modifier' : 'Créer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/authentications')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
} 