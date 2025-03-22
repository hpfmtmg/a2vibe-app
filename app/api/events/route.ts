import { NextResponse } from "next/server"
import type { Event } from "@/lib/types"
import { getEvents, addEvent, deleteEvent } from "@/lib/db" // Ensure deleteEvent is importe

export async function GET() {
  try {
    const events = await getEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const event: Event = await request.json()
    await addEvent(event)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await deleteEvent(id)
    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}

