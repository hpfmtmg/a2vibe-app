"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Event, Rsvp, AttendanceStatus } from "@/lib/types"

interface RsvpFormProps {
  events: Event[]
  onAddRsvp: (rsvp: Rsvp) => void
  onUpdateRsvp: (rsvp: Rsvp) => void
  editingRsvp: Rsvp | null
  selectedEvent: Event | null
  setSelectedEvent: (event: Event | null) => void
  setEditingRsvp: (rsvp: Rsvp | null) => void
}

export function RsvpForm({ 
  events, 
  onAddRsvp, 
  onUpdateRsvp, 
  editingRsvp, 
  selectedEvent, 
  setSelectedEvent,
  setEditingRsvp 
}: RsvpFormProps) {
  const [name, setName] = useState("")
  const [food, setFood] = useState("")
  const [content, setContent] = useState("")
  const [attendance, setAttendance] = useState<AttendanceStatus>("yes")

  // Reset form when editing RSVP changes
  useEffect(() => {
    if (editingRsvp) {
      setName(editingRsvp.name)
      setFood(editingRsvp.food)
      setContent(editingRsvp.content)
      setAttendance(editingRsvp.attendance)
    } else {
      setName("")
      setFood("")
      setContent("")
      setAttendance("yes")
    }
  }, [editingRsvp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !selectedEvent) return

    const rsvp: Rsvp = {
      id: editingRsvp ? editingRsvp.id : crypto.randomUUID(),
      eventId: selectedEvent.id,
      name,
      food,
      content,
      attendance,
      createdAt: editingRsvp ? editingRsvp.createdAt : new Date().toISOString()
    }

    if (editingRsvp) {
      await onUpdateRsvp(rsvp)
      setEditingRsvp(null)
    } else {
      await onAddRsvp(rsvp)
    }

    // Reset form
    setName("")
    setFood("")
    setContent("")
    setAttendance("yes")
  }

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId) || null
    setSelectedEvent(event)
  }

  return (
    <Card className="border-scarlet">
      <CardHeader>
        <CardTitle>{editingRsvp ? "Edit RSVP" : "RSVP to Event"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="event-select">Select Event</Label>
              <Select value={selectedEvent?.id} onValueChange={handleEventChange} disabled={!!editingRsvp}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({new Date(event.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="food">Food Contribution</Label>
                  <Input
                    id="food"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="What food will you bring?"
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="content">Tech Content to Share</Label>
                  <Input
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Any tech content you'd like to share"
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label>Attendance</Label>
                  <RadioGroup
                    value={attendance}
                    onValueChange={(value) => setAttendance(value as AttendanceStatus)}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maybe" id="maybe" />
                      <Label htmlFor="maybe">Maybe</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {editingRsvp && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedEvent(null)
                setEditingRsvp(null)
              }}
              className="mr-2"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!selectedEvent} className="bg-scarlet text-grey">
            {editingRsvp ? "Update RSVP" : "Submit RSVP"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

