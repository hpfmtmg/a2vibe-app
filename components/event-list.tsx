"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import type { Event, Rsvp, AttendanceStatus } from "@/lib/types"
import { format } from "date-fns"

interface EventListProps {
  events: Event[]
  rsvps: Rsvp[]
  onEditRsvp: (rsvp: Rsvp) => void
  onDeleteRsvp: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function EventList({ events, rsvps, onEditRsvp, onDeleteRsvp, onDeleteEvent }: EventListProps) {
  // Group RSVPs by event date and separate into upcoming and past events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date()
    const upcoming: Record<string, { event: Event; rsvps: Rsvp[] }> = {}
    const past: Record<string, { event: Event; rsvps: Rsvp[] }> = {}

    events.forEach((event) => {
      const eventDate = new Date(event.date)
      const eventRsvps = rsvps.filter((rsvp) => rsvp.eventId === event.id)
      const eventGroup = {
        event,
        rsvps: eventRsvps,
      }

      if (eventDate >= now) {
        upcoming[event.id] = eventGroup
      } else {
        past[event.id] = eventGroup
      }
    })

    // Sort upcoming events by date (ascending)
    const sortedUpcoming = Object.values(upcoming).sort(
      (a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
    )

    // Sort past events by date (descending)
    const sortedPast = Object.values(past).sort(
      (a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime()
    )

    return {
      upcomingEvents: sortedUpcoming,
      pastEvents: sortedPast,
    }
  }, [events, rsvps])

  if (events.length === 0) {
    return <p className="text-center text-muted-foreground">No events created yet.</p>
  }

  const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "yes":
        return <Badge className="bg-green-500">Attending</Badge>
      case "no":
        return <Badge variant="destructive">Not Attending</Badge>
      case "unsure":
        return <Badge variant="outline">Unsure</Badge>
      default:
        return null
    }
  }

  const renderEventCard = ({ event, rsvps }: { event: Event; rsvps: Rsvp[] }) => {
    const totalEntries = rsvps.length
    const totalYes = rsvps.filter((rsvp) => rsvp.attendance === "yes").length
    const totalUnsure = rsvps.filter((rsvp) => rsvp.attendance === "unsure").length

    return (
      <Card key={event.id} className="overflow-hidden border-scarlet">
        <CardHeader className="bg-muted">
          <CardTitle className="flex justify-between items-center">
            <span>{event.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">
                {format(new Date(event.date), "MMM dd, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteEvent(event.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {rsvps.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No RSVPs for this event yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-center py-2 px-4 font-medium">Name</th>
                    <th className="text-center py-2 px-4 font-medium">Food</th>
                    <th className="text-center py-2 px-4 font-medium">Content</th>
                    <th className="text-center py-2 px-4 font-medium">Attendance</th>
                    <th className="py-2 px-4 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b last:border-0">
                      <td className="text-center py-3 px-4">{rsvp.name}</td>
                      <td className="text-center py-3 px-4">{rsvp.food || "-"}</td>
                      <td className="text-center py-3 px-4">{rsvp.content || "-"}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex justify-center">{getAttendanceBadge(rsvp.attendance)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditRsvp(rsvp)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteRsvp(rsvp.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td className="text-center py-3 px-4 font-medium">Total: {totalEntries}</td>
                    <td className="text-center py-3 px-4"></td>
                    <td className="text-center py-3 px-4"></td>
                    <td className="text-center py-3 px-4 font-medium">
                      <span className="mr-4">Yes: {totalYes}</span>
                      <span>Unsure: {totalUnsure}</span>
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-6">
            {upcomingEvents.map(renderEventCard)}
          </div>
        </div>
      )}

      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
          <div className="space-y-6">
            {pastEvents.map(renderEventCard)}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 && (
        <p className="text-center text-muted-foreground">No events with RSVPs yet.</p>
      )}
    </div>
  )
}

