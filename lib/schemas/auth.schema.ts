import { z } from "zod"
import { containsForbiddenPassword, containsForbiddenSequence } from "@/lib/auth/password-rules"

// Schéma de base pour les champs communs
const baseSignUpSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial")
    .refine(
      (password) => !containsForbiddenPassword(password),
      "Ce mot de passe est trop simple ou trop courant"
    )
    .refine(
      (password) => !containsForbiddenSequence(password),
      "Ce mot de passe contient une séquence de caractères trop simple"
    ),
})

// Schéma complet avec confirmation du mot de passe
export const signUpSchema = baseSignUpSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

// Schéma pour l'API (sans confirmPassword)
export const signUpApiSchema = baseSignUpSchema

export type SignUpValues = z.infer<typeof signUpSchema>
export type SignUpApiValues = z.infer<typeof signUpApiSchema> 