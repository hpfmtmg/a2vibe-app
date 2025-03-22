"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import type { Event, Rsvp } from "@/lib/types"

interface EventListProps {
  events: Event[]
  rsvps: Rsvp[]
  onEditRsvp: (rsvp: Rsvp) => void
  onDeleteRsvp: (id: string) => void
  onDeleteEvent: (id: string) => void
}

export function EventList({ events, rsvps, onEditRsvp, onDeleteRsvp, onDeleteEvent }: EventListProps) {
  // Group RSVPs by event date
  const groupedRsvps = useMemo(() => {
    const grouped: Record<string, { event: Event; rsvps: Rsvp[] }> = {}

    events.forEach((event) => {
      const eventRsvps = rsvps.filter((rsvp) => rsvp.eventId === event.id)
      if (eventRsvps.length > 0 || true) {
        // Include all events, even with no RSVPs
        grouped[event.id] = {
          event,
          rsvps: eventRsvps,
        }
      }
    })

    // Sort by date
    return Object.values(grouped).sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())
  }, [events, rsvps])

  if (events.length === 0) {
    return <p className="text-center text-muted-foreground">No events created yet.</p>
  }

  if (groupedRsvps.length === 0) {
    return <p className="text-center text-muted-foreground">No events with RSVPs yet.</p>
  }

  const getAttendanceBadge = (status: string) => {
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

  return (
    <div className="space-y-6">
      {groupedRsvps.map(({ event, rsvps }) => {
        // Calculate totals
        const totalEntries = rsvps.length
        const totalYes = rsvps.filter((rsvp) => rsvp.attendance === "yes").length
        const totalUnsure = rsvps.filter((rsvp) => rsvp.attendance === "unsure").length

        return (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle className="flex justify-between items-center">
                <span>{event.name}</span>
                <span className="text-sm font-normal">{new Date(event.date).toLocaleDateString()}</span>
                <Button variant="ghost" size="icon" onClick={() => onDeleteEvent(event.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
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
                              <Button variant="ghost" size="icon" onClick={() => onEditRsvp(rsvp)} className="h-8 w-8">
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
      })}
    </div>
  )
}

