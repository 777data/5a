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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

const headerSchema = z.object({
  key: z.string().min(1, "La clé est requise"),
  value: z.string().min(1, "La valeur est requise"),
})

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.array(headerSchema).optional(),
  body: z.string().optional(),
  collectionId: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>
type HeaderData = z.infer<typeof headerSchema>

type Api = {
  id: string
  name: string
  url: string
  method: string
  headers: any
  body: any
  collectionId?: string | null
  createdAt: Date
}

type Collection = {
  id: string
  name: string
}

type ApiFormProps = {
  api: Api | null
  applicationId: string
  initialCollectionId?: string
}

export function ApiForm({ api, applicationId, initialCollectionId }: ApiFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [newHeader, setNewHeader] = useState<HeaderData>({ key: '', value: '' })
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoadingCollections(true)
      try {
        const response = await fetch(`/api/applications/${applicationId}/collections`)
        if (response.ok) {
          const data = await response.json()
          setCollections(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des collections:', error)
      } finally {
        setIsLoadingCollections(false)
      }
    }

    if (applicationId) {
      fetchCollections()
    }
  }, [applicationId])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: api?.name ?? "",
      url: api?.url ?? "",
      method: (api?.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH") ?? "GET",
      headers: api?.headers ? Object.entries(api.headers).map(([key, value]) => ({ key, value: value as string })) : [],
      body: api?.body ? JSON.stringify(api.body, null, 2) : "",
      collectionId: api?.collectionId || initialCollectionId || "none",
    },
  })

  const headers = form.watch('headers') || []
  const method = form.watch('method')
  const showBody = method === 'POST' || method === 'PUT'

  const addHeader = () => {
    if (newHeader.key && newHeader.value) {
      const currentHeaders = form.getValues('headers') || []
      form.setValue('headers', [...currentHeaders, newHeader])
      setNewHeader({ key: '', value: '' })
    }
  }

  const removeHeader = (index: number) => {
    const currentHeaders = form.getValues('headers') || []
    form.setValue('headers', currentHeaders.filter((_, i) => i !== index))
  }

  async function onSubmit(data: FormData) {
    try {
      // Convertir les headers en objet
      const headersObject = data.headers?.reduce((acc, { key, value }) => ({
        ...acc,
        [key]: value
      }), {})

      // Convertir le body en JSON si présent
      let bodyObject = undefined
      if (data.body) {
        try {
          bodyObject = JSON.parse(data.body)
        } catch (e) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le body n'est pas un JSON valide",
          })
          return
        }
      }

      const response = await fetch(
        api
          ? `/api/applications/${applicationId}/apis/${api.id}`
          : `/api/applications/${applicationId}/apis`,
        {
          method: api ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            headers: headersObject,
            body: bodyObject,
            collectionId: data.collectionId === "none" ? null : data.collectionId,
          }),
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

      // Rediriger vers la collection si l'API a été créée depuis une collection
      if (initialCollectionId && data.collectionId === initialCollectionId) {
        router.push(`/collections/${initialCollectionId}/view`)
      } else {
        router.push("/apis")
      }
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
              <Select onValueChange={(value) => {
                field.onChange(value)
                // Réinitialiser le body si on passe à une méthode qui ne l'utilise pas
                if (value !== 'POST' && value !== 'PUT') {
                  form.setValue('body', '')
                }
              }} defaultValue={field.value}>
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

        <FormField
          control={form.control}
          name="collectionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection (optionnel)</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoadingCollections}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une collection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucune collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Headers</FormLabel>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <Input
              placeholder="Clé"
              value={newHeader.key}
              onChange={(e) => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
            />
            <Input
              placeholder="Valeur"
              value={newHeader.value}
              onChange={(e) => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
            />
            <Button
              type="button"
              onClick={addHeader}
              disabled={!newHeader.key || !newHeader.value}
            >
              Ajouter
            </Button>
          </div>
          
          {headers.length > 0 && (
            <div className="border rounded-md p-4 space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <div className="text-sm font-medium">{header.key}</div>
                  <div className="text-sm text-gray-500">{header.value}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeHeader(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showBody && (
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Body (JSON)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="font-mono"
                    rows={10}
                    placeholder="{}"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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