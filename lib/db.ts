import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma with detailed logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn', 'info'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Log database URL (without sensitive info)
console.log('Database: Connection URL:', process.env.DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Event operations
export async function createEvent(data: { name: string; date: Date }) {
  try {
    console.log('Database: Creating event with data:', data)
    
    // Validate input
    if (!data.name || !data.date) {
      throw new Error('Missing required fields: name and date are required')
    }

    // Ensure date is valid
    if (isNaN(data.date.getTime())) {
      throw new Error('Invalid date provided')
    }

    // Test database connection
    await prisma.$connect()
    console.log('Database: Connected successfully before creating event')

    const event = await prisma.event.create({ 
      data,
      include: { rsvps: true }
    })

    console.log('Database: Event created successfully:', event)
    return event
  } catch (error) {
    console.error('Database: Failed to create event:', error)
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

export async function getEvents() {
  try {
    console.log('Database: Starting to fetch events')
    
    // Test database connection with detailed logging
    try {
      console.log('Database: Attempting to connect to database...')
      await prisma.$connect()
      console.log('Database: Successfully connected to database')
      
      // Test a simple query to verify connection
      const testQuery = await prisma.$queryRaw`SELECT 1`
      console.log('Database: Test query successful:', testQuery)
    } catch (connectionError) {
      console.error('Database: Failed to connect to database:', connectionError)
      if (connectionError instanceof Error) {
        console.error('Database connection error details:', {
          message: connectionError.message,
          stack: connectionError.stack,
          name: connectionError.name,
          cause: connectionError.cause
        })
      }
      throw new Error('Database connection failed')
    }

    // Check if prisma is initialized
    if (!prisma) {
      console.error('Database: Prisma client is not initialized')
      throw new Error('Database client not initialized')
    }

    // Execute query with timeout
    console.log('Database: Executing events query...')
    const events = await Promise.race([
      prisma.event.findMany({
        include: { rsvps: true },
        orderBy: { date: 'asc' }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any

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
  } catch (error) {
    console.error('Database: Failed to fetch events:', error)
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
  try {
    console.log('Database: Starting to create RSVP:', {
      eventId,
      name,
      food,
      content,
      attendance
    })
    
    // Test database connection with detailed logging
    try {
      console.log('Database: Attempting to connect to database...')
      await prisma.$connect()
      console.log('Database: Successfully connected to database')
      
      // Test a simple query to verify connection
      const testQuery = await prisma.$queryRaw`SELECT 1`
      console.log('Database: Test query successful:', testQuery)
    } catch (connectionError) {
      console.error('Database: Failed to connect to database:', connectionError)
      if (connectionError instanceof Error) {
        console.error('Database connection error details:', {
          message: connectionError.message,
          stack: connectionError.stack,
          name: connectionError.name,
          cause: connectionError.cause
        })
      }
      throw new Error('Database connection failed')
    }

    // Check if prisma is initialized
    if (!prisma) {
      console.error('Database: Prisma client is not initialized')
      throw new Error('Database client not initialized')
    }

    // Check if event exists
    console.log('Database: Checking if event exists...')
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      console.error('Database: Event not found:', eventId)
      throw new Error('Event not found')
    }

    // Execute query with timeout
    console.log('Database: Creating RSVP...')
    const rsvp = await Promise.race([
      prisma.rsvp.create({
        data: {
          eventId,
          name,
          food,
          content,
          attendance
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any

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
  } catch (error) {
    console.error('Database: Failed to create RSVP:', error)
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

export async function getRsvps(eventId: string) {
  try {
    console.log('Database: Starting to fetch RSVPs for event:', eventId)
    
    // Test database connection with detailed logging
    try {
      console.log('Database: Attempting to connect to database...')
      await prisma.$connect()
      console.log('Database: Successfully connected to database')
      
      // Test a simple query to verify connection
      const testQuery = await prisma.$queryRaw`SELECT 1`
      console.log('Database: Test query successful:', testQuery)
    } catch (connectionError) {
      console.error('Database: Failed to connect to database:', connectionError)
      if (connectionError instanceof Error) {
        console.error('Database connection error details:', {
          message: connectionError.message,
          stack: connectionError.stack,
          name: connectionError.name,
          cause: connectionError.cause
        })
      }
      throw new Error('Database connection failed')
    }

    // Check if prisma is initialized
    if (!prisma) {
      console.error('Database: Prisma client is not initialized')
      throw new Error('Database client not initialized')
    }

    // Execute query with timeout
    console.log('Database: Executing RSVPs query...')
    const rsvps = await Promise.race([
      prisma.rsvp.findMany({
        where: eventId ? { eventId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: { event: true }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any

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
  } catch (error) {
    console.error('Database: Failed to fetch RSVPs:', error)
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
  try {
    console.log('Database: Starting to fetch recipes')
    
    // Test database connection with detailed logging
    try {
      console.log('Database: Attempting to connect to database...')
      await prisma.$connect()
      console.log('Database: Successfully connected to database')
      
      // Test a simple query to verify connection
      const testQuery = await prisma.$queryRaw`SELECT 1`
      console.log('Database: Test query successful:', testQuery)
    } catch (connectionError) {
      console.error('Database: Failed to connect to database:', connectionError)
      if (connectionError instanceof Error) {
        console.error('Database connection error details:', {
          message: connectionError.message,
          stack: connectionError.stack,
          name: connectionError.name,
          cause: connectionError.cause
        })
      }
      throw new Error('Database connection failed')
    }

    // Check if prisma is initialized
    if (!prisma) {
      console.error('Database: Prisma client is not initialized')
      throw new Error('Database client not initialized')
    }

    // Execute query with timeout
    console.log('Database: Executing recipes query...')
    const recipes = await Promise.race([
      prisma.recipe.findMany({
        orderBy: { uploadDate: 'desc' }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any

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
  } catch (error) {
    console.error('Database: Failed to fetch recipes:', error)
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

