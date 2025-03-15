import { ApplicationForm } from "../components/application-form"

export default function NewApplicationPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Nouvelle application
      </h1>
      <ApplicationForm />
    </div>
  )
} 