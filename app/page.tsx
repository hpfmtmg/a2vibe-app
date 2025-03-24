"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventForm } from "@/components/event-form"
import { RsvpForm } from "@/components/rsvp-form"
import { EventList } from "@/components/event-list"
import { RecipeUpload } from "@/components/recipe-upload"
import { SharedContentUpload } from "@/components/shared-content-upload"
import type { Event, Rsvp, Recipe, SharedContent } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { CalendarWidget } from "@/components/calendar-widget"
import { createEventAction, createRsvpAction } from '@/app/actions/actions'
import type { SafeActionResult } from 'next-safe-action'

type ActionResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingRsvp, setEditingRsvp] = useState<Rsvp | null>(null)
  const [loading, setLoading] = useState({
    events: true,
    rsvps: true,
    recipes: true,
    sharedContent: true,
  })
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsRes = await fetch("/api/events")
        if (!eventsRes.ok) {
          throw new Error(`Events API error: ${eventsRes.status}`)
        }
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
        setLoading((prev) => ({ ...prev, events: false }))

        // Fetch RSVPs
        const rsvpsRes = await fetch("/api/rsvps")
        if (!rsvpsRes.ok) {
          throw new Error(`RSVPs API error: ${rsvpsRes.status}`)
        }
        const rsvpsData = await rsvpsRes.json()
        setRsvps(rsvpsData)
        setLoading((prev) => ({ ...prev, rsvps: false }))

        // Fetch recipes
        const recipesRes = await fetch("/api/recipes")
        if (!recipesRes.ok) {
          throw new Error(`Recipes API error: ${recipesRes.status}`)
        }
        const recipesData = await recipesRes.json()
        setRecipes(recipesData)
        setLoading((prev) => ({ ...prev, recipes: false }))

        // Fetch shared content
        const contentRes = await fetch("/api/shared-content")
        if (!contentRes.ok) {
          throw new Error(`Shared Content API error: ${contentRes.status}`)
        }
        const contentData = await contentRes.json()
        setSharedContent(contentData)
        setLoading((prev) => ({ ...prev, sharedContent: false }))
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
        setLoading({ events: false, rsvps: false, recipes: false, sharedContent: false })
      }
    }

    fetchData()
  }, [])

  const handleAddEvent = async (event: Event) => {
    try {
      const result = await createEventAction({
        name: event.name,
        date: event.date
      }) as ActionResponse<Event>

      if (!result?.success) {
        throw new Error('Failed to create event')
      }

      const newEvent = result.data
      setEvents(prevEvents => [...prevEvents, newEvent])
    } catch (error) {
      console.error("Error adding event:", error)
      alert(error instanceof Error ? error.message : "Failed to save event. Please try again.")
    }
  }

  const handleAddRsvp = async (rsvp: Rsvp) => {
    try {
      console.log('Submitting RSVP:', rsvp)
      
      const result = await createRsvpAction({
        eventId: rsvp.eventId,
        name: rsvp.name,
        food: rsvp.food,
        content: rsvp.content,
        attendance: rsvp.attendance
      }) as ActionResponse<Rsvp>

      console.log('Server response:', result)

      if (!result?.success || !result?.data) {
        throw new Error('Failed to create RSVP')
      }

      const newRsvp = result.data

      // Update the global RSVPs state
      setRsvps(prevRsvps => {
        if (editingRsvp) {
          return prevRsvps.map(r => r.id === editingRsvp.id ? newRsvp : r)
        }
        return [...prevRsvps, newRsvp]
      })

      // Update the selected event's RSVPs
      setSelectedEvent(prevEvent => {
        if (!prevEvent) return null
        const currentRsvps = prevEvent.rsvps || []
        return {
          ...prevEvent,
          rsvps: editingRsvp 
            ? currentRsvps.map(r => r.id === editingRsvp.id ? newRsvp : r)
            : [...currentRsvps, newRsvp]
        }
      })

      // Clear editing state
      setEditingRsvp(null)
    } catch (error) {
      console.error("Error adding RSVP:", error)
      alert(error instanceof Error ? error.message : "Failed to save RSVP. Please try again.")
    }
  }

  const handleEditRsvp = (rsvp: Rsvp) => {
    setEditingRsvp(rsvp)
    setSelectedEvent(events.find((e) => e.id === rsvp.eventId) || null)
  }

  const handleDeleteRsvp = async (id: string) => {
    try {
      const response = await fetch(`/api/rsvps?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      setRsvps(rsvps.filter((rsvp) => rsvp.id !== id))
    } catch (error) {
      console.error("Error deleting RSVP:", error)
      alert("Failed to delete RSVP. Please try again.")
    }
  }

  const handleAddRecipe = async (recipe: Recipe) => {
    setRecipes([...recipes, recipe])
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      setRecipes(recipes.filter((recipe) => recipe.id !== id))
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe. Please try again.")
    }
  }

  const handleAddSharedContent = async (content: SharedContent) => {
    setSharedContent([...sharedContent, content])
  }

  const handleDeleteSharedContent = async (id: string) => {
    try {
      const response = await fetch(`/api/shared-content?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      setSharedContent(sharedContent.filter((content) => content.id !== id))
    } catch (error) {
      console.error("Error deleting shared content:", error)
      alert("Failed to delete shared content. Please try again.")
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Update the events state immediately since we know the deletion was successful
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
      // Only show the alert if it's not a 204 response
      if (error instanceof Error && !error.message.includes('204')) {
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Ann Arbor Food and Tech Vibe Group</h1>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="shared">Content</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <div>
            <EventForm onAddEvent={handleAddEvent} />
          </div>

          {events.length > 0 && (
            <div>
              <RsvpForm
                events={events}
                onAddRsvp={handleAddRsvp}
                editingRsvp={editingRsvp}
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
              />
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-4">Event Entries</h2>
            {loading.events || loading.rsvps ? (
              <p className="text-center">Loading...</p>
            ) : (
              <EventList events={events} rsvps={rsvps} onEditRsvp={handleEditRsvp} onDeleteRsvp={handleDeleteRsvp} onDeleteEvent={handleDeleteEvent} />
            )}
          </div>
        </TabsContent>
        <TabsContent value="recipes">
          {loading.recipes ? (
            <p className="text-center">Loading...</p>
          ) : (
            <RecipeUpload recipes={recipes} onAddRecipe={handleAddRecipe} onDeleteRecipe={handleDeleteRecipe} />
          )}
        </TabsContent>
        <TabsContent value="shared">
          {loading.sharedContent ? (
            <p className="text-center">Loading...</p>
          ) : (
            <SharedContentUpload
              sharedContent={sharedContent}
              onAddContent={handleAddSharedContent}
              onDeleteContent={handleDeleteSharedContent}
            />
          )}
        </TabsContent>
        <TabsContent value="calendar" className="h-[calc(100vh-4rem)]">
          <CalendarWidget events={events} />
        </TabsContent>
      </Tabs>
    </main>
  )
}

