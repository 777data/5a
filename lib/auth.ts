import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth/next";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }

  interface JWT {
    role?: string;
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            emailVerified: true,
          }
        });

        if (!user || !user.password) {
          throw new Error('Utilisateur non trouvé');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Mot de passe incorrect');
        }

        if (!user.emailVerified) {
          throw new Error('Veuillez vérifier votre email avant de vous connecter');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string || 'USER';
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || 'USER';
      }
      return token;
    },
    async signIn({ user, account }) {
      try {
        if (!user.email) {
          return false;
        }

        // Vérifier si un utilisateur existe déjà avec cet email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }
        });

        if (existingUser) {
          // Mettre à jour lastLogin pour l'utilisateur existant
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() }
          });

          // Si l'utilisateur existe déjà mais n'a pas de compte Google lié
          if (!existingUser.accounts.some(acc => acc.provider === 'google')) {
            // Lier le compte Google à l'utilisateur existant
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account?.type || 'oauth',
                provider: 'google',
                providerAccountId: account?.providerAccountId || '',
                access_token: account?.access_token,
                token_type: account?.token_type,
                scope: account?.scope,
                id_token: account?.id_token,
              }
            });
          }
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // Autoriser les chemins relatifs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Autoriser les redirections vers l'URL de base
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Par défaut, rediriger vers la page d'accueil
      return baseUrl;
    },
  },
  debug: isDevelopment,
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Non autorisé");
  }

  return user;
} 