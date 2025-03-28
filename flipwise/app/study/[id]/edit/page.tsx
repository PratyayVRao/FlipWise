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
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"

interface EditStudySetPageProps {
  params: {
    id: string
  }
}

export default function EditStudySetPage({ params }: EditStudySetPageProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [flashcards, setFlashcards] = useState<{ id?: string; front: string; back: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStudySet = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // Get study set
        const { data: studySet, error: setError } = await supabase
          .from("study_sets")
          .select("*")
          .eq("id", params.id)
          .single()

        if (setError) throw setError

        setTitle(studySet.title)
        setDescription(studySet.description || "")

        // Get flashcards
        const { data: cards, error: cardsError } = await supabase
          .from("flashcards")
          .select("*")
          .eq("study_set_id", params.id)
          .order("created_at", { ascending: true })

        if (cardsError) throw cardsError

        setFlashcards(
          cards.map((card) => ({
            id: card.id,
            front: card.front_text,
            back: card.back_text,
          })),
        )
      } catch (error: any) {
        toast({
          title: "Error loading study set",
          description: error.message,
          variant: "destructive",
        })
        router.push("/study")
      } finally {
        setLoading(false)
      }
    }

    fetchStudySet()
  }, [params.id, router, supabase, toast, user])

  const handleAddCard = () => {
    // Create a new card with a temporary ID
    const newCard = { front: "", back: "" }
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
      // Update study set
      const { error: setError } = await supabase
        .from("study_sets")
        .update({
          title,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (setError) throw setError

      // Handle existing cards (update or delete)
      const existingCardIds = flashcards.filter((card) => card.id).map((card) => card.id)

      // Delete cards that are no longer in the set
      if (existingCardIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("flashcards")
          .delete()
          .eq("study_set_id", params.id)
          .not("id", "in", `(${existingCardIds.join(",")})`)

        if (deleteError) throw deleteError
      } else {
        // If there are no existing cards, delete all cards for this set
        const { error: deleteAllError } = await supabase.from("flashcards").delete().eq("study_set_id", params.id)

        if (deleteAllError) throw deleteAllError
      }

      // Update existing cards
      for (const card of flashcards.filter((card) => card.id)) {
        const { error } = await supabase
          .from("flashcards")
          .update({
            front_text: card.front,
            back_text: card.back,
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id)

        if (error) throw error
      }

      // Insert new cards
      const newCards = flashcards
        .filter((card) => !card.id)
        .map((card) => ({
          study_set_id: params.id,
          front_text: card.front,
          back_text: card.back,
        }))

      if (newCards.length > 0) {
        const { error: insertError } = await supabase.from("flashcards").insert(newCards)

        if (insertError) throw insertError
      }

      toast({
        title: "Success!",
        description: "Your study set has been updated.",
      })

      router.push(`/study/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Error updating study set",
        description: error.message,
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

