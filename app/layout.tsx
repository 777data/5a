import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EnvironmentSelector } from "@/components/environment-selector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "API Tester",
  description: "Application de test d'APIs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const environments = await prisma.environment.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
    },
  });

  const activeEnvironmentId = cookies().get('activeEnvironmentId')?.value;

  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="text-xl font-bold">
                API Tester
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                href="/apis"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 hover:bg-gray-100"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                APIs
              </Link>
              <Link
                href="/environments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 hover:bg-gray-100"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Environnements
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 border-b bg-white px-6 flex items-center justify-end">
              <EnvironmentSelector
                environments={environments}
                selectedEnvironmentId={activeEnvironmentId}
              />
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
