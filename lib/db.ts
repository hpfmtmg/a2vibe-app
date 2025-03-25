import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma with detailed logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn', 'info'],
})

// Log database URL (without sensitive info)
console.log('Database: Connection URL:', process.env.DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

// Add connection error handler
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error) {
    console.error('Database: Error in Prisma Client operation:', error)
    if (error instanceof Error && error.message.includes('Connection')) {
      console.log('Database: Attempting to reconnect...')
      await prisma.$connect()
    }
    throw error
  }
})

// Ensure single instance in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to test database connection
async function testConnection() {
  try {
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Database: Connection test successful:', result)
    return true
  } catch (error) {
    console.error('Database: Connection test failed:', error)
    return false
  }
}

// Export the connection test function
export { testConnection }

// Wrapper function for database operations with retry logic
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test connection before operation
      const isConnected = await testConnection()
      if (!isConnected) {
        console.log(`Database: Reconnecting (attempt ${attempt}/${maxRetries})...`)
        await prisma.$connect()
      }
      
      // Execute operation
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Database: Operation failed (attempt ${attempt}/${maxRetries}):`, error)
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`Database: Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Operation failed after max retries')
}

// Event operations
export async function createEvent(data: { name: string; date: Date }) {
  return withRetry(async () => {
    console.log('Database: Creating event with data:', data)
    
    // Validate input
    if (!data.name || !data.date) {
      throw new Error('Missing required fields: name and date are required')
    }

    // Ensure date is valid
    if (isNaN(data.date.getTime())) {
      throw new Error('Invalid date provided')
    }

    const event = await prisma.event.create({ 
      data,
      include: { rsvps: true }
    })

    console.log('Database: Event created successfully:', event)
    return event
  })
}

export async function getEvents() {
  return withRetry(async () => {
    console.log('Database: Starting to fetch events')
    
    const events = await prisma.event.findMany({
      include: { rsvps: true },
      orderBy: { date: 'asc' }
    })

    console.log('Database: Successfully fetched events:', events)
    
    if (!events) {
      console.error('Database: No events returned from query')
      return []
    }

    // Validate the structure of each event
    events.forEach((event: any) => {
      if (!event.id || !event.name || !event.date) {
        console.error('Database: Invalid event structure:', event)
        throw new Error('Invalid event structure in database')
      }
      if (event.rsvps && !Array.isArray(event.rsvps)) {
        console.error('Database: Invalid RSVPs structure:', event.rsvps)
        throw new Error('Invalid RSVPs structure in database')
      }
    })

    return events
  })
}

export async function getEvent(id: string) {
  return withRetry(() => 
    prisma.event.findUnique({
      where: { id },
      include: { rsvps: true }
    })
  )
}

export async function updateEvent(id: string, data: { name?: string; date?: Date }) {
  return withRetry(() => 
    prisma.event.update({
      where: { id },
      data,
      include: { rsvps: true }
    })
  )
}

export async function deleteEvent(id: string) {
  return withRetry(() => 
    prisma.event.delete({
      where: { id }
    })
  )
}

// RSVP operations
export async function createRsvp({
  eventId,
  name,
  food,
  content,
  attendance
}: {
  eventId: string
  name: string
  food: string
  content: string
  attendance: 'yes' | 'no' | 'maybe'
}) {
  return withRetry(async () => {
    console.log('Database: Starting to create RSVP:', {
      eventId,
      name,
      food,
      content,
      attendance
    })

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      console.error('Database: Event not found:', eventId)
      throw new Error('Event not found')
    }

    const rsvp = await prisma.rsvp.create({
      data: {
        eventId,
        name,
        food,
        content,
        attendance
      }
    })

    console.log('Database: Successfully created RSVP:', rsvp)
    
    if (!rsvp) {
      console.error('Database: No RSVP returned from create query')
      throw new Error('Failed to create RSVP')
    }

    // Validate the structure of the RSVP
    if (!rsvp.id || !rsvp.eventId || !rsvp.name || !rsvp.attendance) {
      console.error('Database: Invalid RSVP structure:', rsvp)
      throw new Error('Invalid RSVP structure from database')
    }

    return rsvp
  })
}

export async function getRsvps(eventId: string) {
  return withRetry(async () => {
    console.log('Database: Starting to fetch RSVPs for event:', eventId)
    
    const rsvps = await prisma.rsvp.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { event: true }
    })

    console.log('Database: Successfully fetched RSVPs:', rsvps)
    
    if (!rsvps) {
      console.error('Database: No RSVPs returned from query')
      return []
    }

    // Validate the structure of each RSVP
    rsvps.forEach((rsvp: any) => {
      if (!rsvp.id || !rsvp.eventId || !rsvp.name) {
        console.error('Database: Invalid RSVP structure:', rsvp)
        throw new Error('Invalid RSVP structure in database')
      }
      if (!rsvp.event) {
        console.error('Database: RSVP missing event data:', rsvp)
        throw new Error('RSVP missing event data in database')
      }
    })

    return rsvps
  })
}

export async function updateRsvp(id: string, data: {
  name?: string
  food?: string
  content?: string
  attendance?: string
}) {
  return withRetry(() => 
    prisma.rsvp.update({
      where: { id },
      data,
      include: { event: true }
    })
  )
}

export async function deleteRsvp(id: string) {
  return withRetry(() => 
    prisma.rsvp.delete({
      where: { id }
    })
  )
}

// Recipe operations
export async function createRecipe(data: { name: string; fileName: string; fileUrl: string }) {
  try {
    console.log('Database: Creating recipe with data:', data)
    
    // Validate input
    if (!data.name || !data.fileName || !data.fileUrl) {
      throw new Error('Missing required fields: name, fileName, and fileUrl are required')
    }

    // Test database connection
    await prisma.$connect()
    console.log('Database: Connected successfully before creating recipe')

    const recipe = await prisma.recipe.create({ 
      data
    })

    console.log('Database: Recipe created successfully:', recipe)
    return recipe
  } catch (error) {
    console.error('Database: Failed to create recipe:', error)
    if (error instanceof Error) {
      console.error('Database error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
    }
    throw error // Re-throw to be handled by the action
  }
}

export async function getRecipes() {
  return withRetry(async () => {
    console.log('Database: Starting to fetch recipes')
    
    const recipes = await prisma.recipe.findMany({
      orderBy: { uploadDate: 'desc' }
    })

    console.log('Database: Successfully fetched recipes:', recipes)
    
    if (!recipes) {
      console.error('Database: No recipes returned from query')
      return []
    }

    // Validate the structure of each recipe
    recipes.forEach((recipe: any) => {
      if (!recipe.id || !recipe.name || !recipe.fileName || !recipe.fileUrl) {
        console.error('Database: Invalid recipe structure:', recipe)
        throw new Error('Invalid recipe structure in database')
      }
    })

    return recipes
  })
}

export async function deleteRecipe(id: string) {
  try {
    console.log('Database: Deleting recipe with id:', id)
    
    // Validate input
    if (!id) {
      throw new Error('Recipe ID is required')
    }

    // Test database connection
    await prisma.$connect()
    console.log('Database: Connected successfully before deleting recipe')

    const recipe = await prisma.recipe.delete({ 
      where: { id }
    })

    console.log('Database: Recipe deleted successfully:', recipe)
    return recipe
  } catch (error) {
    console.error('Database: Failed to delete recipe:', error)
    if (error instanceof Error) {
      console.error('Database error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
    }
    throw error // Re-throw to be handled by the action
  }
}

// Shared Content operations
export async function createSharedContent(data: { title: string; description?: string; fileName: string; fileUrl: string }) {
  try {
    console.log('Database: Creating shared content with data:', data)
    
    // Validate input
    if (!data.title || !data.fileName || !data.fileUrl) {
      throw new Error('Missing required fields: title, fileName, and fileUrl are required')
    }

    // Test database connection
    await prisma.$connect()
    console.log('Database: Connected successfully before creating shared content')

    const content = await prisma.sharedContent.create({ 
      data
    })

    console.log('Database: Shared content created successfully:', content)
    return content
  } catch (error) {
    console.error('Database: Failed to create shared content:', error)
    if (error instanceof Error) {
      console.error('Database error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
    }
    throw error // Re-throw to be handled by the action
  }
}

export async function getSharedContent() {
  return withRetry(async () => {
    console.log('Database: Starting to fetch shared content')
    
    const content = await prisma.sharedContent.findMany({
      orderBy: { uploadDate: 'desc' }
    })

    console.log('Database: Successfully fetched shared content:', content)
    
    if (!content) {
      console.error('Database: No shared content returned from query')
      return []
    }

    // Validate the structure of each shared content item
    content.forEach((item: any) => {
      if (!item.id || !item.title || !item.fileName || !item.fileUrl) {
        console.error('Database: Invalid shared content structure:', item)
        throw new Error('Invalid shared content structure in database')
      }
    })

    return content
  })
}

export async function deleteSharedContent(id: string) {
  try {
    console.log('Database: Deleting shared content with id:', id)
    
    // Validate input
    if (!id) {
      throw new Error('Content ID is required')
    }

    // Test database connection
    await prisma.$connect()
    console.log('Database: Connected successfully before deleting shared content')

    const content = await prisma.sharedContent.delete({ 
      where: { id }
    })

    console.log('Database: Shared content deleted successfully:', content)
    return content
  } catch (error) {
    console.error('Database: Failed to delete shared content:', error)
    if (error instanceof Error) {
      console.error('Database error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
    }
    throw error // Re-throw to be handled by the action
  }
}

