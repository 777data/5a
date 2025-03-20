'use client'

import { useState } from 'react'
import Cron from 'react-js-cron'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

// Définition du schéma de validation
const scheduledTestSchema = z.object({
  collectionId: z.array(z.string()).min(1, "Au moins une collection est requise"),
  environmentId: z.string().min(1, "L'environnement est requis"),
  authenticationId: z.string().optional(),
  cronExpression: z.string().min(1, "La périodicité est requise"),
})

type ScheduledTestFormData = z.infer<typeof scheduledTestSchema>

type Collection = {
  id: string
  name: string
  application: {
    name: string
  }
}

type Environment = {
  id: string
  name: string
}

type Authentication = {
  id: string
  name: string
}

type ScheduledTestFormProps = {
  collections: Collection[]
  environments: Environment[]
  authentications: Authentication[]
  initialData?: {
    collectionId: string[]
    environmentId: string
    authenticationId?: string
    cronExpression: string
  }
}

export function ScheduledTestForm({
  collections,
  environments,
  authentications,
  initialData,
}: ScheduledTestFormProps) {
  const { toast } = useToast()
  const [cronValue, setCronValue] = useState(initialData?.cronExpression || '0 0 * * *') // Par défaut : tous les jours à minuit

  const form = useForm<ScheduledTestFormData>({
    resolver: zodResolver(scheduledTestSchema),
    defaultValues: {
      collectionId: initialData?.collectionId || [],
      environmentId: initialData?.environmentId || '',
      authenticationId: initialData?.authenticationId || undefined,
      cronExpression: initialData?.cronExpression || cronValue,
    },
  })

  const onSubmit = async (data: ScheduledTestFormData) => {
    try {
      const response = await fetch('/api/scheduled-tests', {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(initialData ? 'Erreur lors de la modification du test programmé' : 'Erreur lors de la création du test programmé')
      }

      toast({
        title: initialData ? "Test programmé modifié" : "Test programmé créé",
        description: initialData ? "Le test a été modifié avec succès." : "Le test a été programmé avec succès.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="flex flex-col gap-6 rounded-lg border p-6 bg-card">
            <h2 className="text-lg font-semibold">Collections à tester</h2>
            <FormField
              control={form.control}
              name="collectionId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid gap-4">
                      {collections.map((collection) => (
                        <div key={collection.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                          <Checkbox
                            checked={Array.isArray(field.value) && field.value.includes(collection.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = Array.isArray(field.value) ? field.value : [];
                              if (checked) {
                                field.onChange([...currentValues, collection.id]);
                              } else {
                                field.onChange(currentValues.filter(v => v !== collection.id));
                              }
                            }}
                          />
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            {collection.application.name} - {collection.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-6 rounded-lg border p-6 bg-card">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <FormField
              control={form.control}
              name="environmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environnement</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un environnement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env.id} value={env.id}>
                          {env.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authenticationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentification</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une authentification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune authentification</SelectItem>
                      {authentications.map((auth) => (
                        <SelectItem key={auth.id} value={auth.id}>
                          {auth.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-6 rounded-lg border p-6 bg-card">
            <h2 className="text-lg font-semibold">Périodicité</h2>
            <FormField
              control={form.control}
              name="cronExpression"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-md border bg-background">
                      <Cron
                        value={cronValue}
                        setValue={(value: string) => {
                          setCronValue(value)
                          field.onChange(value)
                        }}
                        className="[&_.react-js-cron]:p-4 [&_.react-js-cron>div]:flex [&_.react-js-cron>div]:flex-row [&_.react-js-cron>div]:items-center [&_.react-js-cron>div]:gap-2 [&_.react-js-cron>div>span]:text-sm [&_.react-js-cron-field]:inline-flex [&_.react-js-cron-field]:items-center [&_.react-js-cron-custom-select]:h-9 [&_.react-js-cron-custom-select]:w-[120px] [&_.react-js-cron-custom-select]:px-3 [&_.react-js-cron-custom-select]:rounded-md [&_.react-js-cron-custom-select]:border [&_.react-js-cron-custom-select]:bg-background [&_.react-js-cron-custom-select]:text-sm [&_.react-js-cron-custom-select:focus]:outline-none [&_.react-js-cron-custom-select:focus]:ring-2 [&_.react-js-cron-custom-select:focus]:ring-ring [&_.react-js-cron-custom-select:focus]:ring-offset-2 [&_.react-js-cron-period]:mb-0 [&_.react-js-cron-clear-button]:px-3 [&_.react-js-cron-clear-button]:py-1 [&_.react-js-cron-clear-button]:rounded-md [&_.react-js-cron-clear-button]:bg-destructive [&_.react-js-cron-clear-button]:text-destructive-foreground [&_.react-js-cron-clear-button]:text-sm [&_.react-js-cron-clear-button:hover]:bg-destructive/90"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Programmer le test
        </Button>
      </form>
    </Form>
  )
} 