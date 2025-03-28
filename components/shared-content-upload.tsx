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

    if (!title || !file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Client: Starting content upload:', {
        title,
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
        title,
        description: description || '',
        fileName: file.name,
        fileData: uint8Array
      }
      console.log('Client: Sending content data to server:', {
        title: input.title,
        description: input.description,
        fileName: input.fileName,
        fileDataLength: input.fileData.length,
        fileDataType: typeof input.fileData,
        isUint8Array: input.fileData instanceof Uint8Array
      })

      // Call server action
      const result = await createSharedContentAction(input)
      console.log('Client: Server action response:', result)

      if (!result?.data?.success) {
        console.error('Client: Server returned error:', result?.data)
        toast({
          title: "Error",
          description: result?.data?.error || "Failed to create shared content",
          variant: "destructive",
        })
        return
      }

      // Update the local state immediately with the new content
      onAddContent(result.data.data)

      // Clear form
      setTitle("")
      setDescription("")
      setFile(null)
      toast({
        title: "Success",
        description: "Content uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading content:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload content",
        variant: "destructive",
      })
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

