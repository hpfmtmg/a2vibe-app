import { writeFile, mkdir, readFile } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

// In-memory data store
let dataStore = {
  events: [] as any[],
  rsvps: [] as any[],
  recipes: [] as any[],
  sharedContent: [] as any[],
}

// File paths
const dataDir = path.join(process.cwd(), "data")
const dataFilePath = path.join(dataDir, "event-data.json")
const uploadsDir = path.join(process.cwd(), "public", "uploads")

// Initialize data store
export async function initDataStore() {
  try {
    // Ensure directories exist
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Try to load existing data
    if (existsSync(dataFilePath)) {
      const fileData = await readFile(dataFilePath, "utf-8")
      dataStore = JSON.parse(fileData)

      // Ensure all collections exist
      if (!dataStore.events) dataStore.events = []
      if (!dataStore.rsvps) dataStore.rsvps = []
      if (!dataStore.recipes) dataStore.recipes = []
      if (!dataStore.sharedContent) dataStore.sharedContent = []
    }

    return true
  } catch (error) {
    console.error("Error initializing data store:", error)
    return false
  }
}

// Save data to file
export async function saveDataToFile() {
  try {
    await writeFile(dataFilePath, JSON.stringify(dataStore, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("Error saving data to file:", error)
    return false
  }
}

// Events operations
export async function getEvents() {
  await initDataStore()
  return dataStore.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function addEvent(event: any) {
  await initDataStore()
  dataStore.events.push(event)
  await saveDataToFile()
  return event
}

// RSVPs operations
export async function getRsvps() {
  await initDataStore()
  return dataStore.rsvps
}

export async function addRsvp(rsvp: any) {
  await initDataStore()
  const index = dataStore.rsvps.findIndex((r) => r.id === rsvp.id)

  if (index !== -1) {
    // Update existing
    dataStore.rsvps[index] = rsvp
  } else {
    // Add new
    dataStore.rsvps.push(rsvp)
  }

  await saveDataToFile()
  return rsvp
}

export async function deleteRsvp(id: string) {
  await initDataStore()
  dataStore.rsvps = dataStore.rsvps.filter((r) => r.id !== id)
  await saveDataToFile()
  return true
}

export async function deleteEvent(id: string) {
  await initDataStore()
  dataStore.events = dataStore.events.filter((event) => event.id !== id)
  await saveDataToFile()
  return true
}

// Recipes operations
export async function getRecipes() {
  await initDataStore()
  return dataStore.recipes.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}

export async function addRecipe(recipe: any) {
  await initDataStore()
  dataStore.recipes.push(recipe)
  await saveDataToFile()
  return recipe
}

export async function deleteRecipe(id: string) {
  await initDataStore()
  dataStore.recipes = dataStore.recipes.filter((r) => r.id !== id)
  await saveDataToFile()
  return true
}

// Shared Content operations
export async function getSharedContent() {
  await initDataStore()
  return dataStore.sharedContent.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}

export async function addSharedContent(content: any) {
  await initDataStore()
  dataStore.sharedContent.push(content)
  await saveDataToFile()
  return content
}

export async function deleteSharedContent(id: string) {
  await initDataStore()
  dataStore.sharedContent = dataStore.sharedContent.filter((c) => c.id !== id)
  await saveDataToFile()
  return true
}

// Get uploads directory path
export function getUploadsDir() {
  return uploadsDir
}

