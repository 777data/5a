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
import { useRouter } from "next/navigation"

const cronLocalization = {
  everyText: "chaque",
  emptyMonths: "tous les mois",
  emptyMonthDays: "tous les jours du mois",
  emptyMonthDaysShort: "tous les jours",
  emptyWeekDays: "tous les jours de la semaine",
  emptyWeekDaysShort: "tous les jours",
  emptyHours: "toutes les heures",
  emptyMinutes: "toutes les minutes",
  emptyMinutesForHourPeriod: "toutes",
  yearOption: "année",
  monthOption: "mois",
  weekOption: "semaine",
  dayOption: "jour",
  hourOption: "heure",
  minuteOption: "minute",
  rebootOption: "redémarrage",
  prefixPeriod: "chaque",
  prefixMonths: "en",
  prefixMonthDays: "le",
  prefixWeekDays: "le",
  prefixWeekDaysForMonthAndYearPeriod: "le",
  prefixHours: "à",
  prefixMinutes: ":",
  prefixMinutesForHourPeriod: "à",
  suffixMinutesForHourPeriod: "minutes",
  errorInvalidCron: "Expression Cron invalide",
  clearButtonText: "Effacer",
  weekDays: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi"
  ],
  months: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
  ],
  altWeekDays: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi"
  ],
  altMonths: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
  ]
}

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
    id: string
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
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ScheduledTestFormData>({
    resolver: zodResolver(scheduledTestSchema),
    defaultValues: {
      collectionId: initialData?.collectionId ?? [],
      environmentId: initialData?.environmentId ?? '',
      authenticationId: initialData?.authenticationId ?? '',
      cronExpression: initialData?.cronExpression ?? '* * * * *',
    },
  })

  const onSubmit = async (data: ScheduledTestFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(initialData?.id ? `/api/tests/scheduled/${initialData.id}` : '/api/tests/scheduled', {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      let errorMessage: string | undefined;
      
      try {
        const responseData = await response.json();
        if (!response.ok) {
          errorMessage = responseData.error || (initialData ? 'Erreur lors de la modification du test programmé' : 'Erreur lors de la création du test programmé');
          if (responseData.details) {
            errorMessage += '\n' + JSON.stringify(responseData.details);
          }
          throw new Error(errorMessage);
        }

        toast({
          title: initialData ? "Test programmé modifié" : "Test programmé créé",
          description: initialData ? "Le test a été modifié avec succès." : "Le test a été programmé avec succès.",
        })

        router.push('/scheduler')
        router.refresh()
      } catch (parseError) {
        // Si on ne peut pas parser la réponse comme du JSON
        if (!response.ok) {
          throw new Error('Une erreur est survenue lors de la communication avec le serveur');
        }
        throw parseError;
      }
    } catch (error) {
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
                        value={form.watch('cronExpression')}
                        setValue={(value: string) => {
                          field.onChange(value)
                        }}
                        locale={cronLocalization}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          Programmer le test
        </Button>
      </form>
    </Form>
  )
} 