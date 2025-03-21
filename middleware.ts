import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const middleware = withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export default middleware

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signin|auth/signup).*)'],
}