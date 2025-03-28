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
import { useToast } from '@/components/ui/use-toast'
import { createSharedContentAction } from '@/app/actions/actions'

interface SharedContentUploadProps {
  sharedContent: SharedContent[]
  onAddContent: (content: SharedContent) => void
  onDeleteContent: (id: string) => void
}

export function SharedContentUpload({ sharedContent, onAddContent, onDeleteContent }: SharedContentUploadProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Client: Form submitted with:', { title, description, file: file?.name })
    
    if (!title || !file) {
      console.log('Client: Missing fields:', { title, file: !!file })
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      console.log('Client: Starting content upload...')
      
      // Convert File to Uint8Array
      console.log('Client: Converting file to Uint8Array...')
      const bytes = await file.arrayBuffer()
      const fileData = new Uint8Array(bytes)
      console.log('Client: File converted to Uint8Array:', {
        length: fileData.length,
        isUint8Array: fileData instanceof Uint8Array,
        constructor: fileData.constructor.name,
        value: fileData
      })

      const input = {
        title,
        description: description || '',
        fileName: file.name,
        fileData: Array.from(fileData) // Convert to regular array for serialization
      }
      console.log('Client: Calling createSharedContentAction with:', {
        title: input.title,
        description: input.description,
        fileName: input.fileName,
        fileDataLength: input.fileData.length,
        isArray: Array.isArray(input.fileData),
        constructor: input.fileData.constructor.name
      })

      // Call the server action
      console.log('Client: Making server action call...')
      const result = await createSharedContentAction(input)
      console.log('Client: Server action call completed, result:', result)

      if (!result.success) {
        console.error('Client: Server returned error:', result.error)
        if (result.validationErrors) {
          console.error('Client: Validation errors:', result.validationErrors)
          // Handle validation errors
          const errorMessage = Object.entries(result.validationErrors)
            .map(([field, error]) => {
              if (typeof error === 'string') return `${field}: ${error}`
              if (Array.isArray(error)) return `${field}: ${error.join(', ')}`
              if (error && typeof error === 'object') {
                if ('_errors' in error) {
                  return `${field}: ${error._errors.join(', ')}`
                }
                return `${field}: ${JSON.stringify(error)}`
              }
              return `${field}: Invalid value`
            })
            .join('\n')
          throw new Error(errorMessage)
        }
        throw new Error(result.error || 'Failed to create shared content')
      }

      console.log('Client: Content created successfully:', result.data)
      
      // Add the new content to the list immediately
      onAddContent(result.data)
      
      // Clear the form
      setTitle("")
      setDescription("")
      setFile(null)
      
      // Show success message
      toast({
        title: "Success",
        description: "Content uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading content:", error)
      if (error instanceof Error) {
        console.error('Client error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        })
        toast({
          title: "Error",
          description: error.message || "Failed to upload content",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to upload content",
          variant: "destructive",
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (contentId: string) => {
    try {
      const response = await fetch(`/api/shared-content?id=${contentId}&download=true`)
      if (!response.ok) throw new Error('Failed to download content')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = sharedContent.find(c => c.id === contentId)?.fileName || 'content.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Content downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading content:", error)
      toast({
        title: "Error",
        description: "Failed to download content",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter content description"
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
          <CardTitle>Content Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sharedContent.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{content.title}</h3>
                    <p className="text-sm text-muted-foreground">{content.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(content.id)}
                    title="Download content"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteContent(content.id)}
                    title="Delete content"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

