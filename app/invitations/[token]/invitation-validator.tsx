'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface InvitationValidatorProps {
  error?: "invalid" | "expired" | "email_mismatch" | "process"
  success?: boolean
  organization?: string
}

const errorMessages = {
  invalid: "Cette invitation n'est pas valide ou a déjà été utilisée.",
  expired: "Cette invitation a expiré.",
  email_mismatch: "L'email de l'invitation ne correspond pas à votre compte.",
  process: "Une erreur est survenue lors du traitement de l'invitation."
}

export function InvitationValidator({ 
  error, 
  success, 
  organization
}: InvitationValidatorProps) {
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessages[error],
        duration: 5000,
      })
      router.push('/')
    } else if (success) {
      toast({
        title: "Invitation acceptée",
        description: `Vous avez rejoint ${organization} avec succès ! Vous pouvez maintenant accéder aux applications partagées.`,
        duration: 5000,
      })
      router.push('/applications')
    }
  }, [error, success, organization, toast, router])

  return null
} 