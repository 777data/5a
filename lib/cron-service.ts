import cron from 'node-cron'
import { prisma } from './prisma'

type ScheduledTest = {
  id: string
  cronExpression: string
  environmentId: string
  authenticationId?: string | null
  collections: Array<{
    id: string
    applicationId: string
  }>
}

class CronService {
  private tasks: Map<string, cron.ScheduledTask>

  constructor() {
    this.tasks = new Map()
  }

  async initializeAllTasks() {
    // Annuler toutes les tâches existantes
    this.stopAllTasks()

    // Récupérer tous les tests programmés actifs
    const scheduledTests = await prisma.scheduledTest.findMany({
      where: {
        isActive: true
      },
      include: {
        collections: true,
        environment: true,
        authentication: true
      }
    })

    // Programmer chaque test
    scheduledTests.forEach(test => {
      this.scheduleTest(test)
    })
  }

  scheduleTest(test: ScheduledTest) {
    // Arrêter la tâche existante si elle existe
    this.stopTask(test.id)

    // Créer une nouvelle tâche
    const task = cron.schedule(test.cronExpression, async () => {
      try {
        // Créer un nouveau test API
        const apiTest = await prisma.apiTest.create({
          data: {
            application: {
              connect: { id: test.collections[0].applicationId }
            },
            environment: {
              connect: { id: test.environmentId }
            },
            authentication: test.authenticationId ? {
              connect: { id: test.authenticationId }
            } : undefined,
            status: 'PENDING',
            startedAt: new Date(),
            duration: 0
          }
        })

        // Pour chaque API dans les collections
        for (const collection of test.collections) {
          const apis = await prisma.api.findMany({
            where: {
              collectionId: collection.id
            },
            orderBy: {
              order: 'asc'
            }
          })

          for (const api of apis) {
            try {
              const startTime = Date.now()
              const response = await fetch(api.url, {
                method: api.method,
                headers: api.headers as HeadersInit,
                body: api.method !== 'GET' ? JSON.stringify(api.body) : undefined
              })

              const duration = Date.now() - startTime
              const responseData = await response.json()

              await prisma.apiTestResult.create({
                data: {
                  apiTest: {
                    connect: { id: apiTest.id }
                  },
                  api: {
                    connect: { id: api.id }
                  },
                  statusCode: response.status,
                  duration,
                  response: responseData
                }
              })
            } catch (error) {
              await prisma.apiTestResult.create({
                data: {
                  apiTest: {
                    connect: { id: apiTest.id }
                  },
                  api: {
                    connect: { id: api.id }
                  },
                  statusCode: 500,
                  duration: 0,
                  error: error instanceof Error ? error.message : 'Une erreur est survenue',
                  response: {}
                }
              })
            }
          }
        }

        // Mettre à jour le statut du test
        await prisma.apiTest.update({
          where: { id: apiTest.id },
          data: {
            status: 'SUCCESS',
            duration: Date.now() - apiTest.startedAt.getTime()
          }
        })
      } catch (error) {
        console.error('Erreur lors de l\'exécution du test programmé:', error)
      }
    })

    // Sauvegarder la tâche
    this.tasks.set(test.id, task)
  }

  stopTask(testId: string) {
    const task = this.tasks.get(testId)
    if (task) {
      task.stop()
      this.tasks.delete(testId)
    }
  }

  stopAllTasks() {
    this.tasks.forEach(task => task.stop())
    this.tasks.clear()
  }
}

// Créer une instance singleton
export const cronService = new CronService() 