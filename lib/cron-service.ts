import cron from 'node-cron'
import { prisma } from './prisma'
import { testMultipleApis } from './api-test.service'
import { randomUUID } from 'crypto'

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

    const sessionId = randomUUID()

    // Créer une nouvelle tâche
    const task = cron.schedule(test.cronExpression, async () => {
      try {
        // Pour chaque collection
        for (const collection of test.collections) {
          // Récupérer toutes les APIs de la collection
          const apis = await prisma.api.findMany({
            where: {
              collectionId: collection.id
            },
            orderBy: {
              order: 'asc'
            },
            select: {
              id: true,
              name: true,
              url: true,
              method: true,
              headers: true,
              body: true,
              order: true
            }
          })

          // Utiliser testMultipleApis pour exécuter les tests
          await testMultipleApis({
            applicationId: collection.applicationId,
            environmentId: test.environmentId,
            authenticationId: test.authenticationId,
            sessionId,
            apis: apis.map(api => ({
              id: api.id,
              name: api.name,
              url: api.url,
              method: api.method,
              headers: api.headers as Record<string, string> | null,
              body: api.body,
              order: api.order
            }))
          })
        }
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