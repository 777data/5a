import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ApplicationSelector } from "@/components/application-selector";
import Image from "next/image";
import { Select, SelectItem } from "@/components/ui/select";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "5A",
  description: "Application de test d'APIs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
    },
  });

  const cookieStore = await cookies();
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value;

  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-[#D6CFC1]">
            <div className="flex h-20 items-center justify-center bg-[#D6CFC1]">
              <Link href="/" className="flex flex-col items-center w-full">
                <div className="flex flex-col items-center w-full px-4 pt-4">
                  <Image 
                    src="/AAAAA.png" 
                    alt="AAAAA" 
                    width={200} 
                    height={100} 
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/collections"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Collections
              </Link>
              <Link
                href="/environments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
              <Link
                href="/authentications"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Authentifications
              </Link>
              <Link
                href="/tests"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Historique des tests
              </Link>
              <div className="mt-auto">
                <Link
                  href="/applications"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:text-gray-900 hover:bg-[#E0D9CB]"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Applications
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary">Advanced Automated API Auditing & Assessment</h1>
              <ApplicationSelector
                applications={applications}
                selectedApplicationId={activeApplicationId}
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
