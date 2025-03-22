import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { Providers } from './providers';
import { getServerSession } from "next-auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "5A",
  description: "Application de test d'APIs",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
