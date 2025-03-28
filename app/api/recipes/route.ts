import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const file = formData.get('file') as File

    if (!name || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create the recipe in the database with the file data
    const newRecipe = await prisma.recipe.create({
      data: {
        name,
        fileName: file.name,
        fileData: buffer,
      },
    })

    return NextResponse.json(newRecipe)
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('id')
    const download = searchParams.get('download') === 'true'

    if (recipeId && download) {
      // Handle PDF download
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: {
          fileName: true,
          fileData: true,
        },
      })

      if (!recipe) {
        return NextResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        )
      }

      // Return the PDF data with proper headers
      return new NextResponse(recipe.fileData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${recipe.fileName}"`,
        },
      })
    }

    // Handle recipe list
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        name: true,
        fileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('id')

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    // Delete the recipe from the database
    await prisma.recipe.delete({
      where: { id: recipeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    )
  }
} 