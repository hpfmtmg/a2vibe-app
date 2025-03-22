import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { getRecipes, addRecipe, deleteRecipe, getUploadsDir } from "@/lib/db"
import type { Recipe } from "@/lib/types"

export async function GET() {
  try {
    const recipes = await getRecipes()
    return NextResponse.json(recipes)
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const file = formData.get("file") as File

    if (!name || !file) {
      return NextResponse.json({ error: "Name and file are required" }, { status: 400 })
    }

    // Generate unique ID and safe filename
    const id = crypto.randomUUID()
    const fileName = file.name
    const safeFileName = `${id}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `/uploads/${safeFileName}`
    const uploadsDir = getUploadsDir()
    const fullPath = path.join(uploadsDir, safeFileName)

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullPath, buffer)

    // Save to database
    const recipe: Recipe = {
      id,
      name,
      fileName,
      fileUrl: filePath,
      uploadDate: new Date().toISOString(),
    }

    await addRecipe(recipe)
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error("Error uploading recipe:", error)
    return NextResponse.json({ error: "Failed to upload recipe" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 })
    }

    // We don't delete the actual file to avoid file system operations in this example
    // In a production app, you would also delete the file

    await deleteRecipe(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 })
  }
}

