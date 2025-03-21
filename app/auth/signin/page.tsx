'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
})

type SignInValues = z.infer<typeof signInSchema>

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case 'OAuthSignin':
      return "Une erreur est survenue lors de l'initialisation de la connexion."
    case 'OAuthCallback':
      return "Une erreur est survenue lors de la validation de vos informations."
    case 'OAuthCreateAccount':
      return "Une erreur est survenue lors de la création de votre compte."
    case 'EmailCreateAccount':
      return "Une erreur est survenue lors de la création de votre compte."
    case 'Callback':
      return "Une erreur est survenue lors de la validation de vos informations."
    case 'AccessDenied':
      return "L'accès a été refusé."
    case 'CredentialsSignin':
      return "Email ou mot de passe incorrect."
    default:
      return "Une erreur est survenue lors de la connexion. Veuillez réessayer."
  }
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const error = searchParams?.get('error')

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      })
      
      if (result?.error) {
        console.error('SignIn error:', result.error)
      }
    } catch (error) {
      console.error('SignIn catch error:', error)
    }
  }

  async function onSubmit(data: SignInValues) {
    try {
      setIsLoading(true)
      form.clearErrors()

      const callbackUrl = searchParams?.get("callbackUrl") || "/"
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        form.setError('email', {
          type: 'manual',
          message: "Email ou mot de passe incorrect"
        })
        return
      }

      if (result?.ok) {
        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé...",
        })
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error('Erreur inattendue:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="mt-2 text-gray-600">Connectez-vous pour accéder à l&apos;application</p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {getErrorMessage(error)}
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          Se connecter avec Google
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/signup" className="text-primary hover:underline">
            Pas encore de compte ? S&apos;inscrire
          </Link>
        </div>
      </div>
    </div>
  )
}