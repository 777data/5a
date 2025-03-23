'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from "@/components/ui/input"
import { Separator } from '@/components/ui/separator'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState(searchParams?.get('email') || '')
  const [password, setPassword] = useState('')
  const [showVerification, setShowVerification] = useState(searchParams?.get('showVerification') === 'true')
  const [error, setError] = useState<string | null>(searchParams?.get('error') || null)

  const handleEmailVerification = useCallback(async (token: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la vérification")
      }

      // Si la vérification est réussie
      toast({
        title: "Email vérifié",
        description: "Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.",
      })

      // On met à jour l'email si il est retourné par l'API
      if (data.user?.email) {
        setEmail(data.user.email)
      }

      // On nettoie l'URL
      router.replace('/auth/signin')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la vérification de l'email",
        duration: 10000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, router, setEmail])

  // Vérifier si nous avons un token de vérification dans l'URL
  useEffect(() => {
    const callbackUrl = searchParams?.get('callbackUrl')
    if (!callbackUrl) return

    const verifyMatch = callbackUrl.match(/\/auth\/verify\?token=([^&]+)/)
    if (!verifyMatch) return

    const token = decodeURIComponent(verifyMatch[1])
    handleEmailVerification(token)
  }, [searchParams, handleEmailVerification])

  const handleResendVerification = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: "Email envoyé",
        description: "Un nouvel email de vérification a été envoyé à votre adresse.",
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'Veuillez vérifier votre email avant de vous connecter') {
          setShowVerification(true)
          toast({
            title: "Vérification requise",
            description: "Veuillez vérifier votre email avant de vous connecter.",
            duration: 10000,
          })
        } else {
          setError(result.error === "Utilisateur non trouvé" || result.error === "Mot de passe incorrect" 
            ? "Email ou mot de passe incorrect" 
            : result.error)
        }
        return
      }

      if (result?.ok) {
        router.push('/')
      }
    } catch (error) {
      setError("Une erreur est survenue lors de la connexion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connexion
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez vos identifiants pour vous connecter
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {showVerification && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-800">
              Un email de vérification vous a été envoyé. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.
            </p>
            <Button
              variant="link"
              className="px-0 text-blue-800 underline"
              onClick={handleResendVerification}
              disabled={isLoading}
            >
              Renvoyer l&apos;email de vérification
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

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

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignInForm />
    </Suspense>
  )
}