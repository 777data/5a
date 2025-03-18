import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Si l'utilisateur n'est pas connecté, il sera redirigé vers la page de connexion
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)'],
}