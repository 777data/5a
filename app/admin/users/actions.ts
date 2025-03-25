'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      password: true,
      createdAt: true,
      lastLogin: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return users
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: {
      id: userId
    }
  })

  revalidatePath('/admin/users')
}

export async function validateUserEmail(userId: string) {
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      emailVerified: new Date()
    }
  })

  revalidatePath('/admin/users')
} 