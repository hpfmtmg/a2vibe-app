"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Trash2, Download } from "lucide-react"
import type { Recipe } from "@/lib/types"

interface RecipeUploadProps {
  recipes: Recipe[]
  onAddRecipe: (recipe: Recipe) => void
  onDeleteRecipe: (id: string) => void
}

export function RecipeUpload({ recipes, onAddRecipe, onDeleteRecipe }: RecipeUploadProps) {
  const [recipeName, setRecipeName] = useState("")
  const [recipeFile, setRecipeFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      setRecipeFile(null)
      return
    }

    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      setFileError("Please upload a PDF file")
      setRecipeFile(null)
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size should be less than 5MB")
      setRecipeFile(null)
      return
    }

    setFileError("")
    setRecipeFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipeName || !recipeFile) return

    setIsUploading(true)

    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append("name", recipeName)
      formData.append("file", recipeFile)

      const response = await fetch("/api/recipes", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newRecipe = await response.json()
        onAddRecipe(newRecipe)
        setRecipeName("")
        setRecipeFile(null)

        // Reset the file input
        const fileInput = document.getElementById("recipe-file") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        const error = await response.json()
        setFileError(error.error || "Failed to upload recipe")
      }
    } catch (error) {
      console.error("Error uploading recipe:", error)
      setFileError("An error occurred while uploading the recipe")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upload Recipe</h2>
        <Card className="border-scarlet">
          <CardHeader>
            <CardTitle>Add New Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipe-name">Recipe Name</Label>
                <Input
                  id="recipe-name"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Enter recipe name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipe-file">Recipe PDF</Label>
                <Input id="recipe-file" type="file" accept=".pdf" onChange={handleFileChange} required />
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                {recipeFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {recipeFile.name} ({(recipeFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <Button type="submit" disabled={!recipeName || !recipeFile || isUploading} className="bg-scarlet text-grey">
                {isUploading ? "Uploading..." : "Upload Recipe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recipe Library</h2>
        {recipes.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">No recipes uploaded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="border-scarlet">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <FileText className="h-10 w-10 text-muted-foreground mr-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg truncate">{recipe.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{recipe.fileName}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Uploaded on {new Date(recipe.uploadDate).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-scarlet text-grey" asChild>
                          <a href={recipe.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => onDeleteRecipe(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

