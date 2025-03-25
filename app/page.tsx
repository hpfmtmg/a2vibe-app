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
import { createEventAction, createRsvpAction, deleteRsvpAction, getEventsAction, getRsvpsAction, getRecipesAction, getSharedContentAction } from '@/app/actions/actions'
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
        console.log('Client: Starting to fetch data')
        setLoading({
          events: true,
          rsvps: true,
          recipes: true,
          sharedContent: true,
        })
        setError(null)

        // Fetch events
        console.log('Client: Fetching events...')
        const eventsResult = await getEventsAction()
        console.log('Client: Received events result:', eventsResult)
        
        if (!eventsResult?.data?.success) {
          console.error('Client: Failed to fetch events:', eventsResult?.data)
          throw new Error('Failed to fetch events')
        }
        setEvents(eventsResult.data.data)

        // Fetch RSVPs
        console.log('Client: Fetching RSVPs...')
        const rsvpsResult = await getRsvpsAction()
        console.log('Client: Received RSVPs result:', rsvpsResult)
        
        if (!rsvpsResult?.data?.success) {
          console.error('Client: Failed to fetch RSVPs:', rsvpsResult?.data)
          throw new Error('Failed to fetch RSVPs')
        }
        setRsvps(rsvpsResult.data.data)

        // Fetch recipes
        console.log('Client: Fetching recipes...')
        const recipesResult = await getRecipesAction()
        console.log('Client: Received recipes result:', recipesResult)
        
        if (!recipesResult?.data?.success) {
          console.error('Client: Failed to fetch recipes:', recipesResult?.data)
          throw new Error('Failed to fetch recipes')
        }
        setRecipes(recipesResult.data.data)

        // Fetch shared content
        console.log('Client: Fetching shared content...')
        const sharedContentResult = await getSharedContentAction()
        console.log('Client: Received shared content result:', sharedContentResult)
        
        if (!sharedContentResult?.data?.success) {
          console.error('Client: Failed to fetch shared content:', sharedContentResult?.data)
          throw new Error('Failed to fetch shared content')
        }
        setSharedContent(sharedContentResult.data.data)

        console.log('Client: Successfully fetched all data')
      } catch (error) {
        console.error('Client: Error fetching data:', error)
        if (error instanceof Error) {
          console.error('Client error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause
          })
        }
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading({
          events: false,
          rsvps: false,
          recipes: false,
          sharedContent: false,
        })
      }
    }

    fetchData()
  }, [])

  const handleAddEvent = async (event: Event) => {
    try {
      const result = await createEventAction({
        name: event.name,
        date: new Date(event.date)
      })

      if (!result?.data?.success) {
        console.error('Client: Failed to create event:', result?.data)
        throw new Error('Failed to create event')
      }

      const newEvent = result.data.data
      setEvents(prev => [...prev, newEvent])
    } catch (error) {
      console.error('Client: Error creating event:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to create event')
    }
  }

  const handleAddRsvp = async (rsvp: Rsvp) => {
    try {
      const result = await createRsvpAction({
        eventId: rsvp.eventId,
        name: rsvp.name,
        food: rsvp.food,
        content: rsvp.content,
        attendance: rsvp.attendance as 'yes' | 'no' | 'maybe'
      })

      if (!result?.data?.success) {
        console.error('Client: Failed to create RSVP:', result?.data)
        throw new Error('Failed to create RSVP')
      }

      const newRsvp = result.data.data
      setRsvps(prev => [...prev, newRsvp])
    } catch (error) {
      console.error('Client: Error creating RSVP:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to create RSVP')
    }
  }

  const handleEditRsvp = (rsvp: Rsvp) => {
    setEditingRsvp(rsvp)
    setSelectedEvent(events.find((e) => e.id === rsvp.eventId) || null)
  }

  const handleDeleteRsvp = async (id: string) => {
    try {
      const result = await deleteRsvpAction({ id }) as ActionResponse<void>

      if (!result?.success) {
        throw new Error('Failed to delete RSVP')
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

