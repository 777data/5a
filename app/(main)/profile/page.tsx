import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Gérez vos informations personnelles
        </p>
      </div>
      <div className="space-y-6">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <ProfileForm user={session.user} />
        </div>
      </div>
    </div>
  )
} 