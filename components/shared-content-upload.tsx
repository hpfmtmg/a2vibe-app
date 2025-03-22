"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Trash2, Download, Calendar } from "lucide-react"
import type { SharedContent } from "@/lib/types"

interface SharedContentUploadProps {
  sharedContent: SharedContent[]
  onAddContent: (content: SharedContent) => void
  onDeleteContent: (id: string) => void
}

export function SharedContentUpload({ sharedContent, onAddContent, onDeleteContent }: SharedContentUploadProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      setContentFile(null)
      return
    }

    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      setFileError("Please upload a PDF file")
      setContentFile(null)
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size should be less than 10MB")
      setContentFile(null)
      return
    }

    setFileError("")
    setContentFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !contentFile) return

    setIsUploading(true)

    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("file", contentFile)

      const response = await fetch("/api/shared-content", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newContent = await response.json()
        onAddContent(newContent)
        setTitle("")
        setDescription("")
        setContentFile(null)

        // Reset the file input
        const fileInput = document.getElementById("content-file") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        const error = await response.json()
        setFileError(error.error || "Failed to upload content")
      }
    } catch (error) {
      console.error("Error uploading content:", error)
      setFileError("An error occurred while uploading the content")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upload Shared Content</h2>
        <Card className="border-scarlet">
          <CardHeader>
            <CardTitle>Add New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content-title">Document Title</Label>
                <Input
                  id="content-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-description">Description (Optional)</Label>
                <Textarea
                  id="content-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-file">PDF Document</Label>
                <Input id="content-file" type="file" accept=".pdf" onChange={handleFileChange} required />
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                {contentFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {contentFile.name} ({(contentFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <Button type="submit" disabled={!title || !contentFile || isUploading} className="bg-scarlet text-grey">
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Shared Documents</h2>
        {sharedContent.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">No shared documents yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedContent.map((content) => (
              <Card key={content.id} className="overflow-hidden border-scarlet">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-lg truncate">{content.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <FileText className="h-10 w-10 text-primary mr-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {content.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{content.description}</p>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(content.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 truncate">{content.fileName}</p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-scarlet text-grey" asChild>
                          <a href={content.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => onDeleteContent(content.id)}
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

