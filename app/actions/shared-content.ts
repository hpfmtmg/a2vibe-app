'use server'

import { prisma } from '@/lib/db'
import type { SharedContent } from '@/lib/types'

export async function getSharedContent(): Promise<SharedContent[]> {
  try {
    const content = await prisma.sharedContent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return content
  } catch (error) {
    console.error('Error fetching shared content:', error)
    throw new Error('Failed to fetch shared content')
  }
}

export async function deleteSharedContent(id: string): Promise<void> {
  try {
    await prisma.sharedContent.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Error deleting shared content:', error)
    throw new Error('Failed to delete shared content')
  }
} 