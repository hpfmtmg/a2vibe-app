import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File

    if (!title || !description || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create the shared content in the database with the file data
    const newContent = await prisma.sharedContent.create({
      data: {
        title,
        description,
        fileName: file.name,
        fileData: buffer,
      },
    })

    return NextResponse.json(newContent)
  } catch (error) {
    console.error('Error creating shared content:', error)
    return NextResponse.json(
      { error: 'Failed to create shared content' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('id')
    const download = searchParams.get('download') === 'true'

    if (contentId && download) {
      // Handle PDF download
      const content = await prisma.sharedContent.findUnique({
        where: { id: contentId },
        select: {
          fileName: true,
          fileData: true,
        },
      })

      if (!content) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        )
      }

      // Return the PDF data with proper headers
      return new NextResponse(content.fileData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${content.fileName}"`,
        },
      })
    }

    // Handle content list
    const contents = await prisma.sharedContent.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(contents)
  } catch (error) {
    console.error('Error fetching shared content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared content' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('id')

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // Delete the content from the database
    await prisma.sharedContent.delete({
      where: { id: contentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shared content:', error)
    return NextResponse.json(
      { error: 'Failed to delete shared content' },
      { status: 500 }
    )
  }
} 