'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Play } from "lucide-react"
import Link from "next/link"
import { ApiTable } from "./api-table"

type Api = {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
  order?: number
  createdAt: Date
}

type Environment = {
  id: string
  name: string
}

type Authentication = {
  id: string
  name: string
}

type ApisClientProps = {
  applicationName: string
  apis: Api[]
  applicationId: string
  environments: Environment[]
  authentications: Authentication[]
  collectionId: string
}

export function ApisClient({
  applicationName,
  apis,
  applicationId,
  environments,
  authentications,
  collectionId,
}: ApisClientProps) {
  const [selectedApiIds, setSelectedApiIds] = useState<string[]>([])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">APIs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {applicationName}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedApiIds.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                // La logique de test sera implémentée plus tard
              }}
            >
              <Play className="h-4 w-4" />
              Tester la sélection
            </Button>
          )}
          <Button asChild>
            <Link href="/apis/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Link>
          </Button>
        </div>
      </div>

      <ApiTable 
        apis={apis} 
        applicationId={applicationId} 
        environments={environments}
        authentications={authentications}
        onTestSelected={setSelectedApiIds}
        collectionId={collectionId}
      />
    </div>
  )
} 