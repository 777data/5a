// Liste des mots de passe interdits
export const FORBIDDEN_PASSWORDS = [
  "password",
  "admin",
  "letmein",
] as const;

// Liste des séquences de caractères interdites
export const FORBIDDEN_SEQUENCES = [
  "123456",
  "abcdef",
  "qwerty",
  "azerty",
] as const;

// Fonction pour vérifier si un mot de passe contient un mot interdit
export function containsForbiddenPassword(password: string): boolean {
  return FORBIDDEN_PASSWORDS.some(forbidden => 
    password.toLowerCase().includes(forbidden.toLowerCase())
  );
}

// Fonction pour vérifier si un mot de passe contient une séquence interdite
export function containsForbiddenSequence(password: string): boolean {
  return FORBIDDEN_SEQUENCES.some(sequence => 
    password.toLowerCase().includes(sequence.toLowerCase())
  );
} 