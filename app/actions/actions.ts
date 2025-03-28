'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { 
  createEvent, 
  createRsvp, 
  createRecipe, 
  createSharedContent,
  deleteEvent,
  deleteRsvp,
  deleteRecipe,
  deleteSharedContent,
  getEvents,
  getRsvps,
  getRecipes,
  getSharedContent,
  testConnection
} from '@/lib/db'
import type { Event, Rsvp, AttendanceStatus, Recipe, SharedContent } from '@/lib/types'

type ActionResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
}

// Event schemas
const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
      path: ["date"]
    })
    .transform((str) => new Date(str))
})

const createRsvpSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  food: z.string().optional(),
  content: z.string().optional(),
  attendance: z.enum(['yes', 'no', 'unsure'], {
    required_error: 'Attendance status is required',
    invalid_type_error: 'Invalid attendance status',
  })
})

const createRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileData: z.any().refine((val) => {
    console.log('Server Action: Validating fileData:', {
      type: typeof val,
      isUint8Array: val instanceof Uint8Array,
      isArray: Array.isArray(val),
      hasLength: val?.length !== undefined,
      constructor: val?.constructor?.name,
      value: val
    })
    return val instanceof Uint8Array || Array.isArray(val)
  }, {
    message: 'File data must be a Uint8Array or Array',
    path: ['fileData']
  }).transform((val) => {
    try {
      if (val instanceof Uint8Array) return val
      if (Array.isArray(val)) {
        const uint8Array = new Uint8Array(val)
        console.log('Server Action: Transformed array to Uint8Array:', {
          originalLength: val.length,
          transformedLength: uint8Array.length,
          isUint8Array: uint8Array instanceof Uint8Array
        })
        return uint8Array
      }
      throw new Error('Invalid file data format')
    } catch (error) {
      console.error('Server Action: Error transforming file data:', error)
      throw error
    }
  })
})

const createSharedContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileData: z.any().refine((val) => {
    console.log('Server Action: Validating shared content fileData:', {
      type: typeof val,
      isUint8Array: val instanceof Uint8Array,
      isArray: Array.isArray(val),
      hasLength: val?.length !== undefined,
      constructor: val?.constructor?.name,
      value: val
    })
    return val instanceof Uint8Array || Array.isArray(val)
  }, {
    message: 'File data must be a Uint8Array or Array',
    path: ['fileData']
  }).transform((val) => {
    try {
      if (val instanceof Uint8Array) return val
      if (Array.isArray(val)) {
        const uint8Array = new Uint8Array(val)
        console.log('Server Action: Transformed array to Uint8Array:', {
          originalLength: val.length,
          transformedLength: uint8Array.length,
          isUint8Array: uint8Array instanceof Uint8Array
        })
        return uint8Array
      }
      throw new Error('Invalid file data format')
    } catch (error) {
      console.error('Server Action: Error transforming file data:', error)
      throw error
    }
  })
})

// Create actions
export const createEventAction = createSafeActionClient()
  .schema(z.object({
    name: z.string().min(1, "Name is required"),
    date: z.date()
  }))
  .action(async (data): Promise<ActionResponse<Event>> => {
    try {
      console.log('Server Action: Starting createEventAction with input:', data.parsedInput)
      
      // Validate input
      if (!data.parsedInput.name || !data.parsedInput.date) {
        console.error('Server Action: Missing required fields:', data.parsedInput)
        return { success: false, error: 'Missing required fields' }
      }

      // Create event in database
      const event = await createEvent({
        name: data.parsedInput.name,
        date: data.parsedInput.date
      })
      console.log('Server Action: Event created successfully:', event)

      // Transform the event to match the Event type
      const transformedEvent: Event = {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        rsvps: event.rsvps?.map(rsvp => ({
          id: rsvp.id,
          eventId: rsvp.eventId,
          name: rsvp.name,
          food: rsvp.food || '',
          content: rsvp.content || '',
          attendance: rsvp.attendance as AttendanceStatus,
          createdAt: rsvp.createdAt.toISOString()
        })) || []
      }

      console.log('Server Action: Transformed event:', transformedEvent)
      return { success: true, data: transformedEvent }
    } catch (error) {
      console.error('Server Action: Failed to create event:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create event'
      }
    }
  })

export const createRsvpAction = createSafeActionClient()
  .schema(
    z.object({
      eventId: z.string(),
      name: z.string(),
      food: z.string(),
      content: z.string(),
      attendance: z.enum(['yes', 'no', 'maybe'] as const)
    })
  )
  .action(async (data): Promise<ActionResponse<Rsvp>> => {
    try {
      console.log('Server Action: Starting createRsvpAction with input:', {
        eventId: data.parsedInput.eventId,
        name: data.parsedInput.name,
        food: data.parsedInput.food,
        content: data.parsedInput.content,
        attendance: data.parsedInput.attendance
      })

      // Validate input
      if (!data.parsedInput.eventId || !data.parsedInput.name || !data.parsedInput.attendance) {
        console.error('Server Action: Missing required fields')
        return { success: false, error: 'Missing required fields' }
      }

      // Create RSVP in database
      console.log('Server Action: Creating RSVP in database...')
      const rsvp = await createRsvp({
        eventId: data.parsedInput.eventId,
        name: data.parsedInput.name,
        food: data.parsedInput.food || '',
        content: data.parsedInput.content || '',
        attendance: data.parsedInput.attendance
      })
      console.log('Server Action: Raw RSVP from database:', rsvp)

      if (!rsvp) {
        console.error('Server Action: Failed to create RSVP in database')
        return { success: false, error: 'Failed to create RSVP' }
      }

      // Transform the RSVP to match the Rsvp type
      const transformedRsvp: Rsvp = {
        id: rsvp.id,
        eventId: rsvp.eventId,
        name: rsvp.name,
        food: rsvp.food || '',
        content: rsvp.content || '',
        attendance: rsvp.attendance,
        createdAt: rsvp.createdAt.toISOString()
      }

      console.log('Server Action: Transformed RSVP:', transformedRsvp)
      return { success: true, data: transformedRsvp }
    } catch (error) {
      console.error('Server Action: Error creating RSVP:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create RSVP' }
    }
  })

export const createRecipeAction = createSafeActionClient()
  .schema(createRecipeSchema)
  .action(async (data): Promise<ActionResponse<Recipe>> => {
    try {
      console.log('Server Action: Starting createRecipeAction with input:', { 
        name: data.parsedInput.name,
        fileName: data.parsedInput.fileName,
        fileDataLength: data.parsedInput.fileData?.length,
        fileDataType: typeof data.parsedInput.fileData,
        isUint8Array: data.parsedInput.fileData instanceof Uint8Array,
        constructor: data.parsedInput.fileData?.constructor?.name
      })
      
      // Validate input
      if (!data.parsedInput.name || !data.parsedInput.fileName || !data.parsedInput.fileData) {
        console.error('Server Action: Missing required fields:', data.parsedInput)
        return { success: false, error: 'Missing required fields' }
      }

      // Test database connection
      console.log('Server Action: Testing database connection...')
      const isConnected = await testConnection()
      if (!isConnected) {
        console.error('Server Action: Database connection failed')
        return { 
          success: false, 
          error: 'Database connection failed. Please check your database configuration and try again.'
        }
      }
      console.log('Server Action: Database connection successful')

      // Create recipe in database
      console.log('Server Action: Creating recipe in database...')
      const recipe = await createRecipe({
        name: data.parsedInput.name,
        fileName: data.parsedInput.fileName,
        fileData: data.parsedInput.fileData
      })

      if (!recipe) {
        console.error('Server Action: Failed to create recipe in database')
        return { 
          success: false, 
          error: 'Failed to create recipe in database. Please try again.'
        }
      }

      console.log('Server Action: Recipe created successfully:', recipe)

      // Transform the recipe to match the Recipe type
      const transformedRecipe: Recipe = {
        id: recipe.id,
        name: recipe.name,
        fileName: recipe.fileName,
        fileData: recipe.fileData,
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString()
      }

      console.log('Server Action: Transformed recipe:', transformedRecipe)
      return { success: true, data: transformedRecipe }
    } catch (error) {
      console.error('Server Action: Error in createRecipeAction:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
        // Check if it's a database connection error
        if (error.message.includes('Can\'t reach database server')) {
          return { 
            success: false, 
            error: 'Database connection failed. Please check your database configuration and try again.'
          }
        }
        return { success: false, error: error.message }
      }
      return { 
        success: false, 
        error: 'An unexpected error occurred while creating the recipe. Please try again.'
      }
    }
  })

export const createSharedContentAction = createSafeActionClient()
  .schema(createSharedContentSchema)
  .action(async (data): Promise<ActionResponse<SharedContent>> => {
    try {
      console.log('Server Action: Starting createSharedContentAction with input:', { 
        title: data.parsedInput.title,
        description: data.parsedInput.description,
        fileName: data.parsedInput.fileName,
        fileDataLength: data.parsedInput.fileData?.length,
        fileDataType: typeof data.parsedInput.fileData,
        isUint8Array: data.parsedInput.fileData instanceof Uint8Array,
        constructor: data.parsedInput.fileData?.constructor?.name
      })
      
      // Validate input
      if (!data.parsedInput.title || !data.parsedInput.fileName || !data.parsedInput.fileData) {
        console.error('Server Action: Missing required fields:', data.parsedInput)
        return { success: false, error: 'Missing required fields' }
      }

      // Test database connection
      console.log('Server Action: Testing database connection...')
      const isConnected = await testConnection()
      if (!isConnected) {
        console.error('Server Action: Database connection failed')
        return { success: false, error: 'Database connection failed' }
      }
      console.log('Server Action: Database connection successful')

      // Create shared content in database
      console.log('Server Action: Creating shared content in database...')
      const content = await createSharedContent({
        title: data.parsedInput.title,
        description: data.parsedInput.description || '',
        fileName: data.parsedInput.fileName,
        fileData: data.parsedInput.fileData
      })

      if (!content) {
        console.error('Server Action: Failed to create shared content in database')
        return { success: false, error: 'Failed to create shared content in database' }
      }

      console.log('Server Action: Shared content created successfully:', content)

      // Transform the content to match the SharedContent type
      const transformedContent: SharedContent = {
        id: content.id,
        title: content.title,
        description: content.description || '',
        fileName: content.fileName,
        fileData: content.fileData,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString()
      }

      console.log('Server Action: Transformed content:', transformedContent)
      return { success: true, data: transformedContent }
    } catch (error) {
      console.error('Server Action: Error in createSharedContentAction:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to create shared content' }
    }
  })

// Delete actions
export const deleteEventAction = createSafeActionClient()
  .schema(z.object({ id: z.string().uuid() }))
  .action(async (data) => {
    try {
      await deleteEvent(data.parsedInput.id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete event:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }
    }
  })

export const deleteRsvpAction = createSafeActionClient()
  .schema(z.object({ id: z.string().uuid() }))
  .action(async (data) => {
    try {
      await deleteRsvp(data.parsedInput.id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete RSVP:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete RSVP'
      }
    }
  })

export const deleteRecipeAction = createSafeActionClient()
  .schema(z.object({ id: z.string() }))
  .action(async (data): Promise<ActionResponse<void>> => {
    try {
      console.log('Server Action: Starting deleteRecipeAction with id:', data.parsedInput.id)
      
      // Test database connection
      console.log('Server Action: Testing database connection...')
      const isConnected = await testConnection()
      if (!isConnected) {
        console.error('Server Action: Database connection failed')
        return { 
          success: false, 
          error: 'Database connection failed. Please check your database configuration and try again.'
        }
      }
      console.log('Server Action: Database connection successful')

      // Delete recipe from database
      console.log('Server Action: Deleting recipe from database...')
      await deleteRecipe(data.parsedInput.id)
      console.log('Server Action: Recipe deleted successfully')

      return { success: true, data: undefined }
    } catch (error) {
      console.error('Server Action: Error in deleteRecipeAction:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
        return { success: false, error: error.message }
      }
      return { 
        success: false, 
        error: 'An unexpected error occurred while deleting the recipe. Please try again.'
      }
    }
  })

export const deleteSharedContentAction = createSafeActionClient()
  .schema(z.object({
    id: z.string().min(1, "Content ID is required")
  }))
  .action(async (data): Promise<ActionResponse<void>> => {
    try {
      console.log('Server Action: Starting deleteSharedContentAction with input:', data.parsedInput)
      
      // Validate input
      if (!data.parsedInput.id) {
        console.error('Server Action: Missing content ID:', data.parsedInput)
        return { success: false, error: 'Content ID is required' }
      }

      // Delete shared content from database
      await deleteSharedContent(data.parsedInput.id)
      console.log('Server Action: Shared content deleted successfully')

      return { success: true, data: undefined }
    } catch (error) {
      console.error('Server Action: Failed to delete shared content:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete shared content'
      }
    }
  })

// Get actions
export const getEventsAction = createSafeActionClient()
  .action(async (): Promise<ActionResponse<Event[]>> => {
    try {
      console.log('Server Action: Starting getEventsAction')
      
      const events = await getEvents()
      console.log('Server Action: Raw events from database:', events)
      
      if (!events) {
        console.error('Server Action: No events returned from database')
        return { success: false, error: 'No events found in database' }
      }

      if (!Array.isArray(events)) {
        console.error('Server Action: Events is not an array:', events)
        return { success: false, error: 'Invalid events data received from database' }
      }

      if (events.length === 0) {
        console.log('Server Action: No events found in database')
        return { success: true, data: [] }
      }

      const transformedEvents: Event[] = events.map(event => {
        try {
          console.log('Server Action: Transforming event:', event)
          
          // Validate required fields
          if (!event.id || !event.name || !event.date) {
            console.error('Server Action: Event missing required fields:', event)
            throw new Error('Event missing required fields')
          }

          const transformed = {
            id: event.id,
            name: event.name,
            date: event.date.toISOString(),
            rsvps: (event.rsvps || []).map((rsvp: { 
              id: string;
              eventId: string;
              name: string;
              food?: string;
              content?: string;
              attendance: AttendanceStatus;
              createdAt: Date;
            }) => {
              if (!rsvp.id || !rsvp.eventId || !rsvp.name) {
                console.error('Server Action: RSVP missing required fields:', rsvp)
                throw new Error('RSVP missing required fields')
              }
              return {
                id: rsvp.id,
                eventId: rsvp.eventId,
                name: rsvp.name,
                food: rsvp.food || '',
                content: rsvp.content || '',
                attendance: rsvp.attendance as AttendanceStatus,
                createdAt: rsvp.createdAt.toISOString()
              }
            })
          }
          
          console.log('Server Action: Transformed event:', transformed)
          return transformed
        } catch (transformError) {
          console.error('Server Action: Error transforming event:', event, transformError)
          throw transformError
        }
      })
      
      console.log('Server Action: Successfully transformed all events:', transformedEvents)
      return { success: true, data: transformedEvents }
    } catch (error) {
      console.error('Server Action: Failed to fetch events:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch events'
      }
    }
  })

export const getRsvpsAction = createSafeActionClient()
  .action(async (): Promise<ActionResponse<Rsvp[]>> => {
    try {
      console.log('Server Action: Starting getRsvpsAction')
      const rsvps = await getRsvps('') // Pass empty string to get all RSVPs
      console.log('Server Action: Raw RSVPs from database:', rsvps)

      if (!rsvps) {
        console.error('Server Action: No RSVPs returned from database')
        return { success: false, error: 'No RSVPs found in database' }
      }

      if (!Array.isArray(rsvps)) {
        console.error('Server Action: RSVPs is not an array:', rsvps)
        return { success: false, error: 'Invalid RSVPs data received from database' }
      }

      const transformedRsvps: Rsvp[] = rsvps.map(rsvp => {
        try {
          console.log('Server Action: Transforming RSVP:', rsvp)
          
          // Validate required fields
          if (!rsvp.id || !rsvp.eventId || !rsvp.name) {
            console.error('Server Action: RSVP missing required fields:', rsvp)
            throw new Error('RSVP missing required fields')
          }

          const transformed = {
            id: rsvp.id,
            eventId: rsvp.eventId,
            name: rsvp.name,
            food: rsvp.food || '',
            content: rsvp.content || '',
            attendance: rsvp.attendance as AttendanceStatus,
            createdAt: rsvp.createdAt.toISOString()
          }
          
          console.log('Server Action: Transformed RSVP:', transformed)
          return transformed
        } catch (transformError) {
          console.error('Server Action: Error transforming RSVP:', rsvp, transformError)
          throw transformError
        }
      })
      
      console.log('Server Action: Successfully transformed all RSVPs:', transformedRsvps)
      return { success: true, data: transformedRsvps }
    } catch (error) {
      console.error('Server Action: Failed to fetch RSVPs:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch RSVPs'
      }
    }
  })

export const getRecipesAction = createSafeActionClient()
  .action(async (): Promise<ActionResponse<Recipe[]>> => {
    try {
      console.log('Server Action: Starting getRecipesAction')
      
      const recipes = await getRecipes()
      console.log('Server Action: Raw recipes from database:', recipes)
      
      if (!recipes) {
        console.error('Server Action: No recipes returned from database')
        return { success: false, error: 'No recipes found in database' }
      }

      if (!Array.isArray(recipes)) {
        console.error('Server Action: Recipes is not an array:', recipes)
        return { success: false, error: 'Invalid recipes data received from database' }
      }

      const transformedRecipes: Recipe[] = recipes.map(recipe => {
        try {
          console.log('Server Action: Transforming recipe:', recipe)
          
          // Validate required fields
          if (!recipe.id || !recipe.name || !recipe.fileName || !recipe.fileData) {
            console.error('Server Action: Recipe missing required fields:', recipe)
            throw new Error('Recipe missing required fields')
          }

          const transformed = {
            id: recipe.id,
            name: recipe.name,
            fileName: recipe.fileName,
            fileData: recipe.fileData,
            createdAt: recipe.createdAt.toISOString(),
            updatedAt: recipe.updatedAt.toISOString()
          }
          
          console.log('Server Action: Transformed recipe:', transformed)
          return transformed
        } catch (transformError) {
          console.error('Server Action: Error transforming recipe:', recipe, transformError)
          throw transformError
        }
      })
      
      console.log('Server Action: Successfully transformed all recipes:', transformedRecipes)
      return { success: true, data: transformedRecipes }
    } catch (error) {
      console.error('Server Action: Failed to fetch recipes:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recipes'
      }
    }
  })

export const getSharedContentAction = createSafeActionClient()
  .action(async (): Promise<ActionResponse<SharedContent[]>> => {
    try {
      console.log('Server Action: Starting getSharedContentAction')
      
      const content = await getSharedContent()
      console.log('Server Action: Raw content from database:', content)
      
      if (!content) {
        console.error('Server Action: No content returned from database')
        return { success: false, error: 'No content found in database' }
      }

      if (!Array.isArray(content)) {
        console.error('Server Action: Content is not an array:', content)
        return { success: false, error: 'Invalid content data received from database' }
      }

      const transformedContent: SharedContent[] = content.map(item => {
        try {
          console.log('Server Action: Transforming content:', item)
          
          // Validate required fields
          if (!item.id || !item.title || !item.fileName || !item.fileData) {
            console.error('Server Action: Content missing required fields:', item)
            throw new Error('Content missing required fields')
          }

          const transformed = {
            id: item.id,
            title: item.title,
            description: item.description || '',
            fileName: item.fileName,
            fileData: item.fileData,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString()
          }
          
          console.log('Server Action: Transformed content:', transformed)
          return transformed
        } catch (transformError) {
          console.error('Server Action: Error transforming content:', item, transformError)
          throw transformError
        }
      })
      
      console.log('Server Action: Successfully transformed all content:', transformedContent)
      return { success: true, data: transformedContent }
    } catch (error) {
      console.error('Server Action: Failed to fetch shared content:', error)
      if (error instanceof Error) {
        console.error('Server Action error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch shared content'
      }
    }
  }) 