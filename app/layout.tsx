import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ApplicationSelector } from "@/components/application-selector";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";
import { Footer } from '@/app/components/footer';

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
        <div className="flex flex-col h-screen">
          <div className="flex flex-1 min-h-0">
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
              <MainNav />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
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
          {/* Footer */}
          <Footer />
          <Toaster />
        </div>
      </body>
    </html>
  );
}
