export type AttendanceStatus = "yes" | "no" | "unsure"

export interface Event {
  id?: string
  date: string
  name: string
  rsvps?: Rsvp[]
}

export interface Rsvp {
  id: string
  eventId: string
  name: string
  food: string
  content: string
  attendance: AttendanceStatus
}

export interface Recipe {
  id: string
  name: string
  fileName: string
  fileUrl: string
  uploadDate: string
}

export interface SharedContent {
  id: string
  title: string
  description: string
  fileName: string
  fileUrl: string
  uploadDate: string
}

