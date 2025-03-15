'use client'

import { Environment } from "@prisma/client"
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
})

type FormValues = z.infer<typeof formSchema>

type EnvironmentFormProps = {
  environment: Environment | null
}

export function EnvironmentForm({ environment }: EnvironmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: environment?.name ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/environments${environment ? `/${environment.id}` : ''}`, {
        method: environment ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.error === "Un environnement avec ce nom existe déjà") {
          form.setError("name", {
            type: "manual",
            message: responseData.error,
          })
          return
        }
        throw new Error(responseData.error || 'Une erreur est survenue')
      }

      toast({
        title: environment ? "Environnement modifié" : "Environnement créé",
        description: `L'environnement "${data.name}" a été ${environment ? 'modifié' : 'créé'} avec succès.`,
      })

      router.push('/environments')
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
                <Input placeholder="Production, Staging, Development..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {environment ? 'Modifier' : 'Créer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/environments')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
} 