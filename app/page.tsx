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
import { createEventAction, createRsvpAction, deleteRsvpAction, getEventsAction, getRsvpsAction, getRecipesAction, getSharedContentAction, createRecipeAction, deleteRecipeAction, createSharedContentAction, deleteSharedContentAction } from '@/app/actions/actions'
import type { SafeActionResult } from 'next-safe-action'
import { toast } from "@/components/ui/use-toast"

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
      const response = await fetch(`/api/rsvps?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the local state immediately
      setRsvps(prevRsvps => prevRsvps.filter(rsvp => rsvp.id !== id));

      // Show success message
      toast({
        title: "Success",
        description: "RSVP deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting RSVP:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete RSVP",
        variant: "destructive",
      });
    }
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    try {
      const result = await createRecipeAction({
        name: recipe.name,
        fileName: recipe.fileName,
        fileUrl: recipe.fileUrl
      })

      if (!result?.data?.success) {
        console.error('Client: Failed to create recipe:', result?.data)
        throw new Error('Failed to create recipe')
      }

      const newRecipe = result.data.data
      setRecipes(prev => [...prev, newRecipe])
    } catch (error) {
      console.error('Client: Error creating recipe:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to create recipe')
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const result = await deleteRecipeAction({ id }) as ActionResponse<void>

      if (!result?.success) {
        throw new Error('Failed to delete recipe')
      }

      setRecipes(recipes.filter((recipe) => recipe.id !== id))
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe. Please try again.")
    }
  }

  const handleAddSharedContent = async (content: SharedContent) => {
    try {
      const result = await createSharedContentAction({
        title: content.title,
        description: content.description,
        fileName: content.fileName,
        fileUrl: content.fileUrl
      })

      if (!result?.data?.success) {
        console.error('Client: Failed to create shared content:', result?.data)
        throw new Error('Failed to create shared content')
      }

      const newContent = result.data.data
      setSharedContent(prev => [...prev, newContent])
    } catch (error) {
      console.error('Client: Error creating shared content:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to create shared content')
    }
  }

  const handleDeleteSharedContent = async (id: string) => {
    try {
      const result = await deleteSharedContentAction({ id }) as ActionResponse<void>

      if (!result?.success) {
        throw new Error('Failed to delete shared content')
      }

      setSharedContent(sharedContent.filter((content) => content.id !== id))
    } catch (error) {
      console.error("Error deleting shared content:", error)
      alert("Failed to delete shared content. Please try again.")
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events?eventId=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh the events list
      const eventsResponse = await fetch("/api/events");
      if (!eventsResponse.ok) {
        throw new Error(`API error: ${eventsResponse.status}`);
      }
      const eventsData = await eventsResponse.json();
      setEvents(eventsData);

      // Show success message
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="shared">Content</TabsTrigger>
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
      </Tabs>
    </main>
  )
}

