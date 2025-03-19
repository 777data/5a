'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      })
    } catch (error) {
      console.error('Erreur de connexion:', error)
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
              Une erreur est survenue lors de la connexion. Veuillez réessayer.
            </p>
          )}
        </div>
        <div className="mt-8 space-y-6">
          <Button 
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
        </div>
      </div>
    </div>
  )
}