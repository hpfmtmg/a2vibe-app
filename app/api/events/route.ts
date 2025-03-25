import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, date, location, description, imageUrl } = body

    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newEvent = await db.insert(events).values({
      title,
      date: new Date(date),
      location,
      description,
      imageUrl,
    }).returning()

    return NextResponse.json(newEvent[0])
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (eventId) {
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)

      if (!event.length) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(event[0])
    }

    const allEvents = await db.select().from(events)
    return NextResponse.json(allEvents)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, date, location, description, imageUrl } = body

    if (!id || !title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const updatedEvent = await db
      .update(events)
      .set({
        title,
        date: new Date(date),
        location,
        description,
        imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning()

    if (!updatedEvent.length) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedEvent[0])
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const deletedEvent = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning()

    if (!deletedEvent.length) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
} 