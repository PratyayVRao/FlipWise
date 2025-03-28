"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface TempEditStudySetPageProps {
  params: {
    id: string
  }
}

interface TempStudySet {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  flashcards: {
    id: string
    front_text: string
    back_text: string
  }[]
}

export default function TempEditStudySetPage({ params }: TempEditStudySetPageProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [flashcards, setFlashcards] = useState<{ id: string; front: string; back: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Load temporary study set from localStorage
    try {
      const tempSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
      const currentSet = tempSets.find((set: TempStudySet) => set.id === params.id)

      if (!currentSet) {
        toast({
          title: "Study set not found",
          description: "The temporary study set you're looking for doesn't exist.",
          variant: "destructive",
        })
        router.push("/study")
        return
      }

      setTitle(currentSet.title)
      setDescription(currentSet.description || "")
      setFlashcards(
        currentSet.flashcards.map((card) => ({
          id: card.id,
          front: card.front_text,
          back: card.back_text,
        })),
      )
      setLoading(false)
    } catch (error: any) {
      toast({
        title: "Error loading study set",
        description: error.message || "Failed to load study set",
        variant: "destructive",
      })
      router.push("/study")
    }
  }, [params.id, router, toast])

  const handleAddCard = () => {
    // Create a new card with a temporary ID
    const newCard = { id: `temp-card-${Date.now()}`, front: "", back: "" }
    setFlashcards((prevCards) => [...prevCards, newCard])
  }

  const handleRemoveCard = (index: number) => {
    if (flashcards.length <= 2) {
      toast({
        title: "Cannot remove card",
        description: "You need at least 2 flashcards in a set.",
        variant: "destructive",
      })
      return
    }

    setFlashcards((prevCards) => {
      const newCards = [...prevCards]
      newCards.splice(index, 1)
      return newCards
    })
  }

  const handleCardChange = (index: number, field: "front" | "back", value: string) => {
    setFlashcards((prevCards) => {
      const newCards = [...prevCards]
      newCards[index] = { ...newCards[index], [field]: value }
      return newCards
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your study set.",
        variant: "destructive",
      })
      return
    }

    // Validate flashcards
    const invalidCards = flashcards.filter((card) => !card.front.trim() || !card.back.trim())
    if (invalidCards.length > 0) {
      toast({
        title: "Incomplete flashcards",
        description: "Please fill in both sides of all flashcards.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      // Update temporary study set in localStorage
      const tempSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
      const updatedSets = tempSets.map((set: TempStudySet) => {
        if (set.id === params.id) {
          return {
            ...set,
            title,
            description,
            updated_at: new Date().toISOString(),
            flashcards: flashcards.map((card) => ({
              id: card.id,
              front_text: card.front,
              back_text: card.back,
            })),
          }
        }
        return set
      })

      localStorage.setItem("tempStudySets", JSON.stringify(updatedSets))

      toast({
        title: "Success!",
        description: "Your temporary study set has been updated.",
      })

      router.push(`/study/temp/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Error updating study set",
        description: error.message || "Failed to update study set",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Study Set</h1>
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Study Set</h1>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">
          This is a temporary study set. To save it permanently, please
          <Link href="/login" className="font-medium underline mx-1">
            log in
          </Link>
          or
          <Link href="/login?tab=register" className="font-medium underline mx-1">
            create an account
          </Link>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Set Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your study set"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for your study set"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-4">Flashcards</h2>
            </div>

            {flashcards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Card {index + 1}</CardTitle>
                    <Button
                      type="button"
                      onClick={() => handleRemoveCard(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`front-${index}`}>Front</Label>
                    <Textarea
                      id={`front-${index}`}
                      value={card.front}
                      onChange={(e) => handleCardChange(index, "front", e.target.value)}
                      placeholder="Front side of the flashcard"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`back-${index}`}>Back</Label>
                    <Textarea
                      id={`back-${index}`}
                      value={card.back}
                      onChange={(e) => handleCardChange(index, "back", e.target.value)}
                      placeholder="Back side of the flashcard"
                      rows={2}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center mt-6">
              <Button type="button" onClick={handleAddCard} variant="outline" className="w-full max-w-md">
                <Plus className="mr-2 h-4 w-4" /> Add Card
              </Button>
            </div>
          </div>

          <CardFooter className="flex justify-end gap-4 px-0">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </div>
      </form>
    </div>
  )
}

