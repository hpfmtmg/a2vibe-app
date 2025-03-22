import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { getSharedContent, addSharedContent, deleteSharedContent, getUploadsDir } from "@/lib/db"
import type { SharedContent } from "@/lib/types"

export async function GET() {
  try {
    const content = await getSharedContent()
    return NextResponse.json(content)
  } catch (error) {
    console.error("Error fetching shared content:", error)
    return NextResponse.json({ error: "Failed to fetch shared content" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const file = formData.get("file") as File

    if (!title || !file) {
      return NextResponse.json({ error: "Title and file are required" }, { status: 400 })
    }

    // Generate unique ID and safe filename
    const id = crypto.randomUUID()
    const fileName = file.name
    const safeFileName = `shared-${id}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `/uploads/${safeFileName}`
    const uploadsDir = getUploadsDir()
    const fullPath = path.join(uploadsDir, safeFileName)

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullPath, buffer)

    // Save to database
    const content: SharedContent = {
      id,
      title,
      description: description || "",
      fileName,
      fileUrl: filePath,
      uploadDate: new Date().toISOString(),
    }

    await addSharedContent(content)
    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error("Error uploading shared content:", error)
    return NextResponse.json({ error: "Failed to upload shared content" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    // We don't delete the actual file to avoid file system operations in this example
    // In a production app, you would also delete the file

    await deleteSharedContent(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shared content:", error)
    return NextResponse.json({ error: "Failed to delete shared content" }, { status: 500 })
  }
}

