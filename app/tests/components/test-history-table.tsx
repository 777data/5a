import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

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
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Environnement</TableHead>
            <TableHead>Authentification</TableHead>
            <TableHead>Durée totale</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>APIs testées</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell>
                {formatDistanceToNow(test.startedAt, { 
                  addSuffix: true,
                  locale: fr 
                })}
              </TableCell>
              <TableCell>{test.environment.name}</TableCell>
              <TableCell>{test.authentication?.name || "-"}</TableCell>
              <TableCell>{(test.duration / 1000).toFixed(2)}s</TableCell>
              <TableCell>
                <Badge
                  variant={
                    test.status === "SUCCESS" ? "success" :
                    test.status === "PARTIAL" ? "warning" :
                    "destructive"
                  }
                >
                  {test.status === "SUCCESS" ? "Succès" :
                   test.status === "PARTIAL" ? "Partiel" :
                   "Échec"}
                </Badge>
              </TableCell>
              <TableCell>
                <Accordion type="single" collapsible>
                  <AccordionItem value="results">
                    <AccordionTrigger className="text-sm">
                      {test._count.results} API{test._count.results > 1 ? "s" : ""}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 p-2">
                        {test.results.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between text-sm"
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
                              <span>{result.api.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{(result.duration / 1000).toFixed(2)}s</span>
                              <Badge
                                variant={result.statusCode < 400 ? "success" : "destructive"}
                              >
                                {result.statusCode}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TableCell>
            </TableRow>
          ))}
          {tests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                Aucun test n'a été effectué
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 