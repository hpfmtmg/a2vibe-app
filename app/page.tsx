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
import { createEventAction, createRsvpAction, deleteRsvpAction, getEventsAction, getRsvpsAction, getRecipesAction, getSharedContentAction, createRecipeAction, deleteRecipeAction, createSharedContentAction, deleteSharedContentAction, updateRSVPAction } from '@/app/actions/actions'
import { testDatabaseConnection } from '@/app/server-test'
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

  useEffect(() => {
    // Test database connection
    testDatabaseConnection().then(result => {
      if (!result.success) {
        console.error('Client: Database connection failed:', result.error)
        setError(result.error || 'Failed to connect to database')
      }
    })

    // Fetch initial data
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

  const handleEditRSVP = async (rsvp: Rsvp) => {
    try {
      console.log('Client: Starting RSVP edit:', rsvp)
      const result = await updateRSVPAction({
        id: rsvp.id,
        name: rsvp.name,
        food: rsvp.food || '',
        content: rsvp.content || '',
        attendance: rsvp.attendance
      })
      console.log('Client: RSVP edit result:', result)

      if (!result?.data?.success) {
        console.error('Client: Server returned error:', result?.data)
        toast({
          title: "Error",
          description: result?.data?.error || "Failed to update RSVP",
          variant: "destructive",
        })
        return
      }

      // Update the existing RSVP in the list
      setRsvps(prevRsvps => 
        prevRsvps.map(r => 
          r.id === rsvp.id ? {
            ...r,
            name: rsvp.name,
            food: rsvp.food || '',
            content: rsvp.content || '',
            attendance: rsvp.attendance
          } : r
        )
      )

      // Clear the editing state
      setEditingRsvp(null)
      setSelectedEvent(null)

      // Refresh the RSVPs list for the specific event
      if (rsvp.eventId) {
        const rsvpsResult = await getRsvpsAction({ eventId: rsvp.eventId })
        if (rsvpsResult?.data?.success) {
          setRsvps(rsvpsResult.data.data)
        }
      }

      toast({
        title: "Success",
        description: "RSVP updated successfully",
      })
    } catch (error) {
      console.error("Error updating RSVP:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update RSVP",
        variant: "destructive",
      })
    }
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
      console.log('Client: Adding recipe to state:', recipe)
      setRecipes(prevRecipes => {
        if (prevRecipes.some(r => r.id === recipe.id)) {
          console.log('Client: Recipe already exists in state:', recipe.id)
          return prevRecipes
        }
        const newRecipes = [...prevRecipes, recipe]
        console.log('Client: Updated recipes state:', newRecipes)
        return newRecipes
      })
    } catch (error) {
      console.error('Client: Error adding recipe:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to add recipe')
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      console.log('Client: Deleting recipe:', id)
      const result = await deleteRecipeAction({ id })
      console.log('Client: Delete recipe result:', result)

      if (!result?.data?.success) {
        console.error('Client: Failed to delete recipe:', result?.data?.error)
        toast({
          title: "Error",
          description: result?.data?.error || "Failed to delete recipe",
          variant: "destructive",
        })
        return
      }

      // Update the local state immediately
      setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== id))
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting recipe:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete recipe",
        variant: "destructive",
      })
    }
  }

  const handleAddSharedContent = async (content: SharedContent) => {
    try {
      setSharedContent(prev => [...prev, content])
      toast({
        title: "Success",
        description: "Content added successfully",
      })
    } catch (error) {
      console.error('Client: Error adding shared content:', error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
      }
      setError(error instanceof Error ? error.message : 'Failed to add shared content')
    }
  }

  const handleDeleteSharedContent = async (id: string) => {
    try {
      console.log('Client: Deleting shared content:', id)
      const result = await deleteSharedContentAction({ id })
      console.log('Client: Delete shared content result:', result)

      if (!result?.data?.success) {
        console.error('Client: Failed to delete shared content:', result?.data)
        toast({
          title: "Error",
          description: "Failed to delete shared content",
          variant: "destructive",
        })
        return
      }

      // Update the local state immediately
      setSharedContent(prevContent => prevContent.filter(content => content.id !== id))
      toast({
        title: "Success",
        description: "Content deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting shared content:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete shared content",
        variant: "destructive",
      })
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

  const getRsvps = async () => {
    try {
      console.log('Client: Starting to fetch RSVPs')
      const result = await getRsvpsAction({ eventId: selectedEvent?.id || '' })
      console.log('Client: RSVPs fetch result:', result)

      if (!result?.data?.success) {
        console.error('Client: Failed to fetch RSVPs:', result?.data)
        toast({
          title: "Error",
          description: "Failed to fetch RSVPs",
          variant: "destructive",
        })
        return
      }

      // Transform the RSVPs to match the expected type
      const transformedRSVPs = result.data.data.map(rsvp => ({
        id: rsvp.id,
        eventId: rsvp.eventId,
        name: rsvp.name,
        food: rsvp.food || '',
        content: rsvp.content || '',
        attendance: rsvp.attendance,
        createdAt: rsvp.createdAt
      }))

      setRsvps(transformedRSVPs)
    } catch (error) {
      console.error("Error fetching RSVPs:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch RSVPs",
        variant: "destructive",
      })
    }
  }

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
          <TabsTrigger value="shared">Tech Content to Share</TabsTrigger>
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
                onUpdateRsvp={handleEditRSVP}
                editingRsvp={editingRsvp}
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                setEditingRsvp={setEditingRsvp}
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

