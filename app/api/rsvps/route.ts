import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rsvps } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventId, name, email, attending } = body

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if RSVP already exists
    const existingRSVP = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.eventId, eventId))
      .where(eq(rsvps.email, email))
      .limit(1)

    if (existingRSVP.length > 0) {
      // Update existing RSVP
      await db
        .update(rsvps)
        .set({
          name,
          attending,
          updatedAt: new Date(),
        })
        .where(eq(rsvps.eventId, eventId))
        .where(eq(rsvps.email, email))
    } else {
      // Create new RSVP
      await db.insert(rsvps).values({
        eventId,
        name,
        email,
        attending,
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

    const eventRSVPs = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.eventId, eventId))

    return NextResponse.json(eventRSVPs)
  } catch (error) {
    console.error('Error fetching RSVPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    )
  }
} 