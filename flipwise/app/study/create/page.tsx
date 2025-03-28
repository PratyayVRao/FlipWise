"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CreateStudySetPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [flashcards, setFlashcards] = useState([
    { front: "", back: "" },
    { front: "", back: "" },
  ])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()

  const handleAddCard = () => {
    setFlashcards((prevCards) => [...prevCards, { front: "", back: "" }])
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

    setLoading(true)

    try {
      if (user) {
        // Create study set in database for authenticated users
        const { data: studySet, error: setError } = await supabase
          .from("study_sets")
          .insert({
            title,
            description: description || null,
            user_id: user.id,
          })
          .select()
          .single()

        if (setError) throw setError

        // Create flashcards
        const flashcardsToInsert = flashcards.map((card) => ({
          study_set_id: studySet.id,
          front_text: card.front,
          back_text: card.back,
        }))

        const { error: cardsError } = await supabase.from("flashcards").insert(flashcardsToInsert)

        if (cardsError) throw cardsError

        toast({
          title: "Success!",
          description: "Your study set has been created.",
        })

        // Redirect to the study set page
        router.push(`/study/${studySet.id}`)
      } else {
        // For non-authenticated users, store in localStorage
        const tempSet = {
          id: `temp-${Date.now()}`,
          title,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          flashcards: flashcards.map((card, index) => ({
            id: `temp-card-${index}`,
            front_text: card.front,
            back_text: card.back,
          })),
        }

        // Get existing temp sets or initialize empty array
        const existingTempSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
        existingTempSets.push(tempSet)
        localStorage.setItem("tempStudySets", JSON.stringify(existingTempSets))

        toast({
          title: "Success!",
          description: "Your temporary study set has been created. Log in to save it permanently.",
        })

        // Redirect to the temporary study set page
        router.push(`/study/temp/${tempSet.id}`)
      }
    } catch (error: any) {
      toast({
        title: "Error creating study set",
        description: error.message || "Failed to create study set",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Study Set</h1>

      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            You are creating a temporary study set. To save it permanently, please
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
      )}

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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Flashcards</h2>
              <Button type="button" onClick={handleAddCard} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Card
              </Button>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Study Set"}
            </Button>
          </CardFooter>
        </div>
      </form>
    </div>
  )
}

