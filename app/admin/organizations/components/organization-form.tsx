'use client'

import { useState } from "react"
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

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Le nom est requis",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface OrganizationFormProps {
  organization?: {
    id: string
    name: string
  }
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true)

      const response = await fetch(
        organization
          ? `/api/admin/organizations/${organization.id}`
          : "/api/admin/organizations",
        {
          method: organization ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error("Une erreur est survenue")
      }

      toast({
        title: organization ? "Organisation modifiée" : "Organisation créée",
        description: organization
          ? "L'organisation a été modifiée avec succès"
          : "L'organisation a été créée avec succès",
      })

      router.push("/admin/organizations")
      router.refresh()
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
      })
    } finally {
      setIsLoading(false)
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
                <Input placeholder="Nom de l'organisation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  )
} 