"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Trash2, Download, Search } from "lucide-react"
import type { Recipe } from "@/lib/types"
import { useToast } from '@/components/ui/use-toast'
import { createRecipeAction } from '@/app/actions/actions'

interface RecipeUploadProps {
  recipes: Recipe[]
  onAddRecipe: (recipe: Recipe) => void
  onDeleteRecipe: (id: string) => void
}

export function RecipeUpload({ recipes, onAddRecipe, onDeleteRecipe }: RecipeUploadProps) {
  const [recipeName, setRecipeName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipeName || !file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Client: Starting recipe upload:', {
        name: recipeName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      // Convert file to Uint8Array
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      console.log('Client: File converted to Uint8Array:', {
        length: uint8Array.length,
        isUint8Array: uint8Array instanceof Uint8Array
      })

      // Create input object
      const input = {
        name: recipeName,
        fileName: file.name,
        fileData: uint8Array
      }
      console.log('Client: Sending recipe data to server:', {
        name: input.name,
        fileName: input.fileName,
        fileDataLength: input.fileData.length,
        fileDataType: typeof input.fileData,
        isUint8Array: input.fileData instanceof Uint8Array
      })

      // Call server action
      const result = await createRecipeAction(input)
      console.log('Client: Server action response:', result)

      if (!result?.data?.success) {
        console.error('Client: Server returned error:', result?.data)
        toast({
          title: "Error",
          description: result?.data?.error || "Failed to create recipe",
          variant: "destructive",
        })
        return
      }

      // Update the local state immediately with the new recipe
      onAddRecipe(result.data.data)

      // Clear form
      setRecipeName("")
      setFile(null)
      toast({
        title: "Success",
        description: "Recipe uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading recipe:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload recipe",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes?id=${recipeId}&download=true`)
      if (!response.ok) throw new Error('Failed to download recipe')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = recipes.find(r => r.id === recipeId)?.fileName || 'recipe.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Recipe downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading recipe:", error)
      toast({
        title: "Error",
        description: "Failed to download recipe",
        variant: "destructive",
      })
    }
  }

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name</Label>
              <Input
                id="name"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Enter recipe name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {filteredRecipes.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {searchQuery ? "No recipes found matching your search." : "No recipes uploaded yet."}
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{recipe.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(recipe.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(recipe.id)}
                        title="Download recipe"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteRecipe(recipe.id)}
                        title="Delete recipe"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

