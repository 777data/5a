import { Metadata } from "next"
import { UsersTable } from "./components/users-table"
import { getUsers } from "./actions"

export const metadata: Metadata = {
  title: "Gestion des Utilisateurs",
  description: "Administration des utilisateurs - validation des emails, suppression et gestion des comptes",
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les utilisateurs, validez les emails et supprimez les comptes.
          </p>
        </div>
      </div>
      <UsersTable users={users} />
    </div>
  )
} 