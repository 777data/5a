import { OrganizationForm } from "../components/organization-form"

export default function NewOrganizationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouvelle organisation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez une nouvelle organisation
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <OrganizationForm />
      </div>
    </div>
  )
} 