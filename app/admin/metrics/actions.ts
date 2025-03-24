'use server'

import os from 'os'
import { prisma } from '@/lib/prisma'

export type ServerMetrics = {
  cpu: {
    usage: number
    cores: number
    model: string
  }
  memory: {
    total: number
    free: number
    used: number
  }
  disk: {
    total: number
    free: number
    used: number
  }
  uptime: number
  lastUpdate: Date
  activeUsers: number
  totalRequests: number
}

export async function getServerMetrics(): Promise<ServerMetrics> {
  // Calculer l'utilisation CPU
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100
  const cpuInfo = os.cpus()[0]

  // Calculer l'utilisation mémoire
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  // Obtenir le nombre total d'utilisateurs comme approximation
  const activeUsers = await prisma.user.count()

  // Obtenir le nombre total de requêtes API (à implémenter avec votre système de logging)
  const totalRequests = 0 // À remplacer par votre logique de comptage

  return {
    cpu: {
      usage: Math.round(cpuUsage * 100) / 100,
      cores: os.cpus().length,
      model: cpuInfo.model
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory
    },
    disk: {
      total: 0, // À implémenter avec diskusage ou autre librairie
      free: 0,
      used: 0
    },
    uptime: os.uptime(),
    lastUpdate: new Date(),
    activeUsers,
    totalRequests
  }
} 