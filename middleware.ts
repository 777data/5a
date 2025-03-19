import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Fonction de middleware pour le mode production
const productionMiddleware = withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
)

// Fonction de middleware pour le mode développement
const developmentMiddleware = () => {
  return NextResponse.next()
}

// Export le middleware approprié selon l'environnement
const middleware = process.env.NODE_ENV === 'development' 
  ? developmentMiddleware 
  : productionMiddleware

export default middleware

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)'],
}