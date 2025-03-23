'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const collectionSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Format de couleur invalide").optional(),
})

type CollectionFormValues = z.infer<typeof collectionSchema>

type CollectionFormProps = {
  collection?: {
    id: string
    name: string
    description: string | null
    color: string | null
  },
  applicationId: string
}

export function CollectionForm({ collection, applicationId }: CollectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || "",
      description: collection?.description || "",
      color: collection?.color || "#e5e7eb",
    },
  })

  async function onSubmit(data: CollectionFormValues) {
    setIsLoading(true)
    
    try {
      const url = collection
        ? `/api/collections/${collection.id}`
        : `/api/collections`
      
      const method = collection ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          applicationId: applicationId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Une erreur est survenue")
      }

      toast({
        title: collection ? "Collection mise à jour" : "Collection créée",
        description: collection
          ? `La collection "${data.name}" a été mise à jour avec succès.`
          : `La collection "${data.name}" a été créée avec succès.`,
      })

      router.push('/collections')
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la collection" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description de la collection (optionnel)" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input type="color" {...field} value={field.value || "#e5e7eb"} />
                </FormControl>
                <Input 
                  type="text" 
                  value={field.value || "#e5e7eb"} 
                  onChange={field.onChange}
                  className="w-32"
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/collections')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : collection ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 