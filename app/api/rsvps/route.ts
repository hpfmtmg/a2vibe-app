import { NextResponse } from "next/server"
import { getRsvps, addRsvp, deleteRsvp } from "@/lib/db"
import type { Rsvp } from "@/lib/types"

export async function GET() {
  try {
    const rsvps = await getRsvps()
    return NextResponse.json(rsvps)
  } catch (error) {
    console.error("Error fetching RSVPs:", error)
    return NextResponse.json({ error: "Failed to fetch RSVPs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const rsvp: Rsvp = await request.json()
    await addRsvp(rsvp)
    return NextResponse.json(rsvp, { status: 201 })
  } catch (error) {
    console.error("Error saving RSVP:", error)
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "RSVP ID is required" }, { status: 400 })
    }

    await deleteRsvp(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting RSVP:", error)
    return NextResponse.json({ error: "Failed to delete RSVP" }, { status: 500 })
  }
}

