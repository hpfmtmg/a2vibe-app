import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventId, name, email, attending, food, content } = body

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if RSVP already exists
    const existingRSVP = await prisma.rsvp.findFirst({
      where: {
        eventId,
        email,
      },
    })

    if (existingRSVP) {
      // Update existing RSVP
      await prisma.rsvp.update({
        where: {
          id: existingRSVP.id,
        },
        data: {
          name,
          food,
          content,
          attendance: attending,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new RSVP
      await prisma.rsvp.create({
        data: {
          eventId,
          name,
          email,
          food,
          content,
          attendance: attending,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving RSVP:', error)
    return NextResponse.json(
      { error: 'Failed to save RSVP' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const eventRSVPs = await prisma.rsvp.findMany({
      where: {
        eventId,
      },
    })

    return NextResponse.json(eventRSVPs)
  } catch (error) {
    console.error('Error fetching RSVPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rsvpId = searchParams.get('id')

    if (!rsvpId) {
      return NextResponse.json(
        { error: 'RSVP ID is required' },
        { status: 400 }
      )
    }

    console.log('Attempting to delete RSVP:', rsvpId)

    // First check if the RSVP exists
    const rsvp = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
    })

    if (!rsvp) {
      console.log('RSVP not found:', rsvpId)
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      )
    }

    console.log('Found RSVP, deleting')
    // Delete the RSVP
    await prisma.rsvp.delete({
      where: { id: rsvpId },
    })
    console.log('Deleted RSVP:', rsvpId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting RSVP:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    return NextResponse.json(
      { error: 'Failed to delete RSVP', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 