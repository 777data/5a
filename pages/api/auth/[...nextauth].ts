import NextAuth, { NextAuthOptions, Session, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: user.id,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Assurez-vous que baseUrl utilise HTTPS
      if (baseUrl.startsWith('http://')) {
        baseUrl = baseUrl.replace('http://', 'https://');
      }
      
      // Autoriser les redirections vers l'URL de base
      if (url.startsWith(baseUrl) || url.startsWith('https://5a.leonaar.com')) {
        return url;
      }
      
      // Autoriser les chemins relatifs
      if (url.startsWith('/')) {
        const finalUrl = new URL(url, baseUrl).toString();
        console.log('Returning relative URL:', finalUrl);
        return finalUrl;
      }
      
      // Par défaut, rediriger vers l'URL de base
      return baseUrl;
    },
    async signIn({ user }: { user: User }) {
      try {
        // Vérifier que l'email se termine par @agendize.com
        if (!user.email?.endsWith('@agendize.com')) {
          console.log('Unauthorized email domain:', user.email);
          return false;
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: true,
};

export default NextAuth(authOptions); 