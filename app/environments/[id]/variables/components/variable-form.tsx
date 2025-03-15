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
  name: z.string().min(1, "Le nom de la variable est requis"),
  value: z.string().min(1, "La valeur est requise"),
})

type FormValues = z.infer<typeof formSchema>

type Variable = {
  id: string
  name: string
}

type VariableValue = {
  id: string
  value: string
  variable: Variable
}

type VariableFormProps = {
  environmentId: string
  variableValue: VariableValue | null
}

export function VariableForm({ environmentId, variableValue }: VariableFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: variableValue?.variable.name ?? "",
      value: variableValue?.value ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const url = variableValue
        ? `/api/environments/${environmentId}/variables/${variableValue.id}`
        : `/api/environments/${environmentId}/variables`

      const response = await fetch(url, {
        method: variableValue ? 'PUT' : 'POST',
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
        title: variableValue ? "Variable modifiée" : "Variable créée",
        description: `La variable a été ${variableValue ? 'modifiée' : 'créée'} avec succès.`,
      })

      router.push(`/environments/${environmentId}/variables`)
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
              <FormLabel>Nom de la variable</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valeur</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {variableValue ? 'Modifier' : 'Créer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/environments/${environmentId}/variables`)}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
} 