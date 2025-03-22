'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Fragment } from "react"
import { ChevronDown, ChevronRight, Eye } from "lucide-react"

type ApiResult = {
  id: string
  statusCode: number
  duration: number
  api: {
    name: string
    method: string
  }
  error?: string | null
}

type CollectionTest = {
  id: string
  name: string
  startedAt: Date
  duration: number
  status: string
  results: ApiResult[]
  _count: {
    results: number
  }
}

type TestSession = {
  id: string
  startedAt: Date
  duration: number
  environment: {
    name: string
  }
  authentication: {
    name: string
  } | null
  collections: CollectionTest[]
  _count: {
    collections: number
    totalResults: number
  }
}

type TestHistoryTableProps = {
  tests: TestSession[]
}

export function TestHistoryTable({ tests }: TestHistoryTableProps) {
  const searchParams = useSearchParams()
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())

  console.log('tests:', tests)

  // Fonction pour afficher la table vide
  const EmptyTable = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
        Aucun test n&apos;a été effectué
      </TableCell>
    </TableRow>
  )

  // Recalculer le statut des collections en fonction des résultats
  const calculateStatus = (results: ApiResult[]) => {
    const hasAuthErrors = results.some(result => 
      result.statusCode === 401 || 
      result.statusCode === 403 || 
      result.statusCode === 404 || 
      result.statusCode >= 500
    )
    
    const allFailed = results.every(result => result.statusCode >= 400)
    const someFailedButNotAll = results.some(result => result.statusCode >= 400) && !allFailed
    
    if (hasAuthErrors || allFailed) return "FAILED"
    if (someFailedButNotAll) return "PARTIAL"
    return "SUCCESS"
  }

  // Recalculer le statut de la session en fonction des collections
  const calculateSessionStatus = (collections: CollectionTest[] | undefined) => {
    if (!collections || collections.length === 0) return "FAILED"
    
    const collectionStatuses = collections.map(collection => 
      calculateStatus(collection.results)
    )
    
    if (collectionStatuses.every(status => status === "SUCCESS")) return "SUCCESS"
    if (collectionStatuses.every(status => status === "FAILED")) return "FAILED"
    return "PARTIAL"
  }

  // Vérifier si un testId est spécifié dans l'URL et déployer ce test
  useEffect(() => {
    const testId = searchParams?.get('testId')
    if (testId) {
      setExpandedSession(testId)
      
      setTimeout(() => {
        const testElement = document.getElementById(`test-${testId}`)
        if (testElement) {
          testElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  const getStatusBadge = (status: 'SUCCESS' | 'PARTIAL' | 'FAILED') => {
    const styles = {
      SUCCESS: 'bg-green-100 text-green-700',
      PARTIAL: 'bg-yellow-100 text-yellow-700',
      FAILED: 'bg-red-100 text-red-700'
    } as const

    const labels = {
      SUCCESS: 'Succès',
      PARTIAL: 'Partiel',
      FAILED: 'Échec'
    } as const

    return (
      <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-3">Date</TableHead>
            <TableHead className="px-4 py-3">Environnement</TableHead>
            <TableHead className="px-4 py-3">Authentification</TableHead>
            <TableHead className="px-4 py-3">Durée totale</TableHead>
            <TableHead className="px-4 py-3">Statut</TableHead>
            <TableHead className="px-4 py-3 w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!tests || tests.length === 0) ? (
            <EmptyTable />
          ) : (
            tests.map((session) => (
              <Fragment key={session?.id || 'unknown'}>
                {/* Ligne principale de la session */}
                <TableRow
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => session?.id && toggleSession(session.id)}
                >
                  <TableCell className="px-4 py-3">
                    {session?.startedAt && (
                      <>
                        {new Date(session.startedAt).toLocaleDateString()} {new Date(session.startedAt).toLocaleTimeString()}
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(session.startedAt, { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </div>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium">{session?.environment?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3">{session?.authentication?.name || "-"}</TableCell>
                  <TableCell className="px-4 py-3">{((session?.duration || 0) / 1000).toFixed(2)}s</TableCell>
                  <TableCell className="px-4 py-3">
                    {getStatusBadge(calculateSessionStatus(session.collections))}
                    <div className="text-xs text-gray-500 mt-1">
                      {session._count?.collections || 0} collection{(session._count?.collections || 0) > 1 ? "s" : ""} •{" "}
                      {session._count?.totalResults || 0} API{(session._count?.totalResults || 0) > 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 w-[140px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSession(session.id)
                      }}
                    >
                      {expandedSession === session.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Détails de la session */}
                {expandedSession === session.id && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-4 bg-gray-50">
                      <div className="space-y-4">
                        {Array.isArray(session?.collections) && session.collections.map((collection) => (
                          <div key={collection?.id || 'unknown'} className="rounded-md border bg-white">
                            {/* En-tête de la collection */}
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleCollection(collection.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCollection(collection.id)
                                  }}
                                >
                                  {expandedCollections.has(collection.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <span className="font-medium">{collection.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  {(collection.duration / 1000).toFixed(2)}s
                                </span>
                                {getStatusBadge(calculateStatus(collection.results))}
                              </div>
                            </div>

                            {/* Résultats de la collection */}
                            {expandedCollections.has(collection.id) && (
                              <div className="border-t">
                                <div className="p-3 space-y-2">
                                  {Array.isArray(collection?.results) && collection.results.map((result) => (
                                    <div
                                      key={result?.id || 'unknown'}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                                          ${result?.api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                            result?.api.method === 'POST' ? 'bg-green-100 text-green-700' :
                                            result?.api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                            result?.api.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {result?.api.method}
                                        </span>
                                        <span className="font-medium">{result?.api.name}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">
                                          {(result?.duration / 1000).toFixed(2)}s
                                        </span>
                                        <Badge
                                          className={`px-2 py-1 rounded-full text-xs font-medium
                                            ${result?.statusCode < 400 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                          {result?.statusCode}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 