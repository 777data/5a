/**
 * Type pour les paramètres de page dans Next.js 15
 */
export type PageParams<T = {}> = {
  params: Promise<T>
  searchParams: Promise<Record<string, string | string[]>>
}

/**
 * Type pour les paramètres de layout dans Next.js 15
 */
export type LayoutParams<T = {}> = {
  params: Promise<T>
  children: React.ReactNode
} 