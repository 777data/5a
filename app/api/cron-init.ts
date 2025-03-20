import { cronService } from '@/lib/cron-service'

// Initialiser les tâches CRON au démarrage
cronService.initializeAllTasks().catch(error => {
  console.error('Erreur lors de l\'initialisation des tâches CRON:', error)
}) 