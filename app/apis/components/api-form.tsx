'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
})

type FormData = z.infer<typeof formSchema>

type Api = {
  id: string
  name: string
  url: string
  method: string
  createdAt: Date
}

type ApiFormProps = {
  api: Api | null
  applicationId: string
}

export function ApiForm({ api, applicationId }: ApiFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: api?.name ?? "",
      url: api?.url ?? "",
      method: (api?.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH") ?? "GET",
    },
  })

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch(
        api
          ? `/api/applications/${applicationId}/apis/${api.id}`
          : `/api/applications/${applicationId}/apis`,
        {
          method: api ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || "Une erreur est survenue")
      }

      toast({
        title: api ? "API modifiée" : "API créée",
        description: api
          ? `L'API "${data.name}" a été modifiée avec succès.`
          : `L'API "${data.name}" a été créée avec succès.`,
      })

      router.push("/apis")
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Méthode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une méthode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit">
            {api ? "Modifier" : "Créer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/apis")}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
} 