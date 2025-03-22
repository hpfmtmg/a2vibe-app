"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Event } from "@/lib/types"

interface CalendarWidgetProps {
  events: Event[]
}

export function CalendarWidget({ events }: CalendarWidgetProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  // Create a set of dates that have events
  const eventDates = React.useMemo(() => {
    return new Set(
      events.map(event => {
        const eventDate = new Date(event.date)
        // Normalize the date to midnight in Eastern Time
        return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).toISOString()
      })
    )
  }, [events])

  // Get events for the selected date
  const selectedDateEvents = React.useMemo(() => {
    if (!date) return []
    return events.filter(event => {
      const eventDate = new Date(event.date)
      const selectedDateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
      const eventDateStr = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).toISOString()
      return selectedDateStr === eventDateStr
    })
  }, [date, events])

  // Format time in Eastern Time
  const formatEasternTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="flex items-center justify-center">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={setDate}
                className={cn("rounded-md border")}
                modifiers={{
                  hasEvent: (date) => {
                    const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
                    return eventDates.has(dateStr)
                  },
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(0 100% 50%)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 2px hsl(0 100% 50%)',
                  },
                }}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                  ),
                  day_range_end: "day-range-end",
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {date ? date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'America/New_York'
                  }) : "No date selected"}
                </h3>
                {selectedDateEvents.length > 0 && (
                  <span className="text-sm text-[hsl(0 100% 50%)] font-medium">
                    {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {selectedDateEvents.length > 0 ? (
                <div className="grid gap-4">
                  {selectedDateEvents.map(event => (
                    <Card key={event.id} className="border-[hsl(0 100% 50%)]/20 bg-[hsl(0 100% 50%)]/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-[hsl(0 100% 50%)]">{event.name}</h4>
                          <span className="text-sm text-[hsl(0 100% 50%)]/80">
                            {formatEasternTime(event.date)} ET
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-muted-foreground">
                    No events scheduled for this date
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}