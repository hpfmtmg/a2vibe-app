'use server'

import { prisma } from '@/lib/db'
import type { Recipe } from '@/lib/types'

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return recipes
  } catch (error) {
    console.error('Error fetching recipes:', error)
    throw new Error('Failed to fetch recipes')
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  try {
    await prisma.recipe.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    throw new Error('Failed to delete recipe')
  }
} 