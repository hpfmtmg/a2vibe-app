import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const newEvent = await prisma.event.create({
      data: {
        name: title,
        date: new Date(date),
        location,
        description,
        imageUrl,
      },
    })

    return NextResponse.json(newEvent)
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
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: true,
        },
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(event)
    }

    const allEvents = await prisma.event.findMany({
      include: {
        rsvps: true,
      },
    })
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

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: title,
        date: new Date(date),
        location,
        description,
        imageUrl,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updatedEvent)
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

    console.log('Attempting to delete event:', eventId)

    // First check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      console.log('Event not found:', eventId)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('Found event, deleting with cascade')
    // Delete the event (RSVPs will be deleted automatically due to cascade)
    const deleteEventResult = await prisma.event.delete({
      where: { id: eventId },
    })
    console.log('Deleted event:', deleteEventResult)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    return NextResponse.json(
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 