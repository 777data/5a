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

type ApiTest = {
  id: string
  startedAt: Date
  duration: number
  status: string
  environment: {
    name: string
  }
  authentication: {
    name: string
  } | null
  results: Array<{
    id: string
    statusCode: number
    duration: number
    api: {
      name: string
      method: string
    }
    error?: string | null
  }>
  _count: {
    results: number
  }
}

type TestHistoryTableProps = {
  tests: ApiTest[]
}

export function TestHistoryTable({ tests }: TestHistoryTableProps) {
  const searchParams = useSearchParams()
  const [expandedTest, setExpandedTest] = useState<string | null>(null)

  // Recalculer le statut des tests en fonction des résultats
  const testsWithRecalculatedStatus = tests.map(test => {
    // Si au moins un résultat a un code 401, 403, 404 ou 5xx, le statut est FAILED
    const hasAuthErrors = test.results.some(result => 
      result.statusCode === 401 || 
      result.statusCode === 403 || 
      result.statusCode === 404 || 
      result.statusCode >= 500
    )
    
    // Si tous les résultats ont échoué, le statut est FAILED
    const allFailed = test.results.every(result => result.statusCode >= 400)
    
    // Si au moins un résultat a échoué mais pas tous, le statut est PARTIAL
    const someFailedButNotAll = test.results.some(result => result.statusCode >= 400) && !allFailed
    
    let recalculatedStatus = test.status
    
    if (hasAuthErrors || allFailed) {
      recalculatedStatus = "FAILED"
    } else if (someFailedButNotAll) {
      recalculatedStatus = "PARTIAL"
    }
    
    return {
      ...test,
      recalculatedStatus
    }
  })

  // Vérifier si un testId est spécifié dans l'URL et déployer ce test
  useEffect(() => {
    const testId = searchParams?.get('testId')
    if (testId) {
      setExpandedTest(testId)
      
      // Faire défiler jusqu'au test après un court délai pour laisser le temps au DOM de se mettre à jour
      setTimeout(() => {
        const testElement = document.getElementById(`test-${testId}`)
        if (testElement) {
          testElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      
      // Nettoyer l'URL après avoir déployé le test
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const toggleExpand = (testId: string) => {
    setExpandedTest(expandedTest === testId ? null : testId)
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
          {testsWithRecalculatedStatus.map((test) => (
            <Fragment key={test.id}>
              <TableRow
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(test.id)}
              >
                <TableCell className="px-4 py-3">
                  {new Date(test.startedAt).toLocaleDateString()} {new Date(test.startedAt).toLocaleTimeString()}
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(test.startedAt, { 
                      addSuffix: true,
                      locale: fr 
                    })}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 font-medium">{test.environment.name}</TableCell>
                <TableCell className="px-4 py-3">{test.authentication?.name || "-"}</TableCell>
                <TableCell className="px-4 py-3">{(test.duration / 1000).toFixed(2)}s</TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    className={`px-2 py-1 rounded-full text-xs font-medium
                      ${test.recalculatedStatus === "SUCCESS" ? 'bg-green-100 text-green-700' :
                        test.recalculatedStatus === "PARTIAL" ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}
                  >
                    {test.recalculatedStatus === "SUCCESS" ? "Succès" :
                     test.recalculatedStatus === "PARTIAL" ? "Partiel" :
                     "Échec"}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {test._count.results} API{test._count.results > 1 ? "s" : ""}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 w-[140px]">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Voir les détails"
                      onClick={() => toggleExpand(test.id)}
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedTest === test.id && (
                <TableRow>
                  <TableCell colSpan={6} className="p-4 bg-gray-50">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Résultats des tests</h3>
                      <div className="space-y-2">
                        {test.results.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 bg-white rounded-md border"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${result.api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                  result.api.method === 'POST' ? 'bg-green-100 text-green-700' :
                                  result.api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                  result.api.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {result.api.method}
                              </span>
                              <span className="font-medium">{result.api.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{(result.duration / 1000).toFixed(2)}s</span>
                            <Badge
                              className={`px-2 py-1 rounded-full text-xs font-medium
                                ${result.statusCode < 400 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {result.statusCode}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
          {tests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                Aucun test n&apos;a été effectué
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 