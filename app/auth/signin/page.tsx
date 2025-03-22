'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from "@/components/ui/input"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState(searchParams?.get('email') || '')
  const [password, setPassword] = useState('')
  const [showVerification, setShowVerification] = useState(searchParams?.get('showVerification') === 'true')

  // Vérifier si nous avons un token de vérification dans l'URL
  useEffect(() => {
    const callbackUrl = searchParams?.get('callbackUrl')
    if (!callbackUrl) return

    const verifyMatch = callbackUrl.match(/\/auth\/verify\?token=([^&]+)/)
    if (!verifyMatch) return

    const token = decodeURIComponent(verifyMatch[1])
    handleEmailVerification(token)
  }, [])

  const handleEmailVerification = async (token: string) => {
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
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
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
          toast({
            variant: "destructive",
            title: "Erreur",
            description: result.error,
          })
        }
        return
      }

      if (result?.ok) {
        router.push('/')
      }
    } catch (error) {
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
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connexion
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez vos identifiants pour vous connecter
          </p>
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
              Renvoyer l'email de vérification
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

        <div className="text-center text-sm">
          <Link href="/auth/signup" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}