import cron from 'node-cron'
import { prisma } from './prisma'
import { testMultipleApis, TestResults } from './api-test.service'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type ScheduledTest = {
  id: string
  cronExpression: string
  environmentId: string
  authenticationId?: string | null
  collections: Array<{
    id: string
    applicationId: string
  }>
  notificationEmails?: string[]
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

  private async sendTestReport(test: ScheduledTest, results: TestResults) {
    if (!test.notificationEmails?.length) return;

    const environment = await prisma.environment.findUnique({
      where: { id: test.environmentId }
    });

    const successCount = results.results.filter(r => r.statusCode < 400).length;
    const totalCount = results.results.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);

    const html = `
      <h1>Rapport d'exécution des tests</h1>
      <p>Session ID: ${results.id}</p>
      <p>Environnement: ${environment?.name}</p>
      <p>Date d'exécution: ${new Date().toLocaleString('fr-FR')}</p>
      
      <h2>Résumé</h2>
      <p>Tests réussis: ${successCount}/${totalCount} (${successRate}%)</p>
      <p>Statut global: ${results.status}</p>
      <p>Durée totale: ${results.duration}ms</p>
      
      <h2>Détails des tests</h2>
      <ul>
        ${results.results.map(result => `
          <li>
            <strong>${result.apiId}</strong>
            <br/>
            Statut: ${result.statusCode < 400 ? '✅ Succès' : '❌ Échec'} (${result.statusCode})
            ${result.error ? `<br/>Erreur: ${result.error}` : ''}
            <br/>Temps de réponse: ${result.duration}ms
          </li>
        `).join('')}
      </ul>
    `;

    try {
      await resend.emails.send({
        from: '5A Tests <no-reply@leonaar.com>',
        to: test.notificationEmails,
        subject: `Rapport de test - ${environment?.name} - ${new Date().toLocaleDateString('fr-FR')}`,
        html,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport:', error);
    }
  }

  scheduleTest(test: ScheduledTest) {
    // Arrêter la tâche existante si elle existe
    this.stopTask(test.id)

    // Créer une nouvelle tâche
    const task = cron.schedule(test.cronExpression, async () => {
      try {
        const allResults: TestResults = {
          id: randomUUID(), // Generate a new ID for the combined results
          status: "SUCCESS",
          duration: 0,
          results: []
        };

        // Pour chaque collection
        for (const collection of test.collections) {
          const collectionSessionId = randomUUID(); // Generate unique session ID for each collection

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
          const results = await testMultipleApis({
            applicationId: collection.applicationId,
            environmentId: test.environmentId,
            authenticationId: test.authenticationId,
            sessionId: collectionSessionId, // Use the unique session ID
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

          allResults.results.push(...results.results);
          allResults.duration += results.duration;
          
          // Mettre à jour le statut global
          if (results.status === "FAILED") {
            allResults.status = "FAILED";
          } else if (results.status === "PARTIAL" && allResults.status === "SUCCESS") {
            allResults.status = "PARTIAL";
          }
        }

        // Envoyer le rapport par email
        await this.sendTestReport(test, allResults);

        // Mettre à jour la date de dernière exécution
        await prisma.scheduledTest.update({
          where: { id: test.id },
          data: { lastRunAt: new Date() }
        });
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