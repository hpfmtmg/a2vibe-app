import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Event operations
export async function createEvent(data: { name: string; date: Date }) {
  return prisma.event.create({ 
    data,
    include: { rsvps: true }
  })
}

export async function getEvents() {
  return prisma.event.findMany({
    include: { rsvps: true },
    orderBy: { date: 'asc' }
  })
}

export async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: { rsvps: true }
  })
}

export async function updateEvent(id: string, data: { name?: string; date?: Date }) {
  return prisma.event.update({
    where: { id },
    data,
    include: { rsvps: true }
  })
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({
    where: { id }
  })
}

// RSVP operations
export async function createRsvp(data: {
  eventId: string
  name: string
  food?: string
  content?: string
  attendance: string
}) {
  return prisma.rsvp.create({ 
    data,
    include: { event: true }
  })
}

export async function getRsvps(eventId: string) {
  return prisma.rsvp.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    include: { event: true }
  })
}

export async function updateRsvp(id: string, data: {
  name?: string
  food?: string
  content?: string
  attendance?: string
}) {
  return prisma.rsvp.update({
    where: { id },
    data,
    include: { event: true }
  })
}

export async function deleteRsvp(id: string) {
  return prisma.rsvp.delete({
    where: { id }
  })
}

// Recipe operations
export async function createRecipe(data: {
  name: string
  fileName: string
  fileUrl: string
}) {
  return prisma.recipe.create({ data })
}

export async function getRecipes() {
  return prisma.recipe.findMany({
    orderBy: { uploadDate: 'desc' }
  })
}

export async function deleteRecipe(id: string) {
  return prisma.recipe.delete({
    where: { id }
  })
}

// SharedContent operations
export async function createSharedContent(data: {
  title: string
  description?: string
  fileName: string
  fileUrl: string
}) {
  return prisma.sharedContent.create({ data })
}

export async function getSharedContent() {
  return prisma.sharedContent.findMany({
    orderBy: { uploadDate: 'desc' }
  })
}

export async function deleteSharedContent(id: string) {
  return prisma.sharedContent.delete({
    where: { id }
  })
}

