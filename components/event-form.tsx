"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Event } from "@/lib/types"

interface EventFormProps {
  onAddEvent: (event: Event) => void
}

export function EventForm({ onAddEvent }: EventFormProps) {
  const [eventDate, setEventDate] = useState("")
  const [eventName, setEventName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventDate || !eventName) return

    // Format the date to ISO string
    const formattedDate = new Date(eventDate).toISOString()

    onAddEvent({
      name: eventName,
      date: formattedDate
    })

    setEventDate("")
    setEventName("")
  }

  return (
    <Card className="border-scarlet">
      <CardHeader>
        <CardTitle>Add New Event</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="bg-scarlet text-grey">
            Add Event
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

