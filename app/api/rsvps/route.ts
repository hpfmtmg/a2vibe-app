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