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
  deleteSharedContent
} from '@/lib/db'
import type { Event, Rsvp, AttendanceStatus } from '@/lib/types'

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
  fileUrl: z.string().url('Invalid file URL')
})

const createSharedContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL')
})

// Create actions
export const createEventAction = createSafeActionClient()
  .schema(createEventSchema)
  .action(async (data): Promise<ActionResponse<Event>> => {
    try {
      console.log('Creating event with data:', data.parsedInput)
      
      const event = await createEvent({
        name: data.parsedInput.name,
        date: data.parsedInput.date
      })
      
      // Transform the event to match the Event type
      const transformedEvent: Event = {
        id: event.id,
        name: event.name,
        date: event.date.toISOString()
      }
      
      console.log('Event created successfully:', transformedEvent)
      return { success: true, data: transformedEvent }
    } catch (error) {
      console.error('Failed to create event:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create event'
      }
    }
  })

export const createRsvpAction = createSafeActionClient()
  .schema(createRsvpSchema)
  .action(async (data): Promise<ActionResponse<Rsvp>> => {
    try {
      console.log('Creating RSVP with data:', data.parsedInput)
      
      const rsvp = await createRsvp(data.parsedInput)
      
      // Transform the RSVP to match our client-side type
      const transformedRsvp: Rsvp = {
        id: rsvp.id,
        eventId: rsvp.eventId,
        name: rsvp.name,
        food: rsvp.food || '',
        content: rsvp.content || '',
        attendance: rsvp.attendance as AttendanceStatus
      }
      
      console.log('RSVP created successfully:', transformedRsvp)
      return { success: true, data: transformedRsvp }
    } catch (error) {
      console.error('Failed to create RSVP:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create RSVP'
      }
    }
  })

export const createRecipeAction = createSafeActionClient()
  .schema(createRecipeSchema)
  .action(async (data) => {
    try {
      const recipe = await createRecipe(data.parsedInput)
      return { success: true, data: recipe }
    } catch (error) {
      console.error('Failed to create recipe:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create recipe'
      }
    }
  })

export const createSharedContentAction = createSafeActionClient()
  .schema(createSharedContentSchema)
  .action(async (data) => {
    try {
      const content = await createSharedContent(data.parsedInput)
      return { success: true, data: content }
    } catch (error) {
      console.error('Failed to create shared content:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create shared content'
      }
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
  .schema(z.object({ id: z.string().uuid() }))
  .action(async (data) => {
    try {
      await deleteRecipe(data.parsedInput.id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete recipe'
      }
    }
  })

export const deleteSharedContentAction = createSafeActionClient()
  .schema(z.object({ id: z.string().uuid() }))
  .action(async (data) => {
    try {
      await deleteSharedContent(data.parsedInput.id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete shared content:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete shared content'
      }
    }
  }) 