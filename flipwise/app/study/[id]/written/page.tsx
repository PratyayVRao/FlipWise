"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"

interface WrittenStudyPageProps {
  params: {
    id: string
  }
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  status?: "correct" | "incorrect"
  userAnswer?: string
}

export default function WrittenStudyPage({ params }: WrittenStudyPageProps) {
  const [studySet, setStudySet] = useState<{ id: string; title: string } | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [round, setRound] = useState(1)
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStudySet = async () => {
      try {
        // Create a new study session if user is logged in
        if (user) {
          try {
            const { data: session, error: sessionError } = await supabase
              .from("study_sessions")
              .insert({
                user_id: user.id,
                study_set_id: params.id,
                mode: "written",
              })
              .select()
              .single()

            if (!sessionError && session) {
              setSessionId(session.id)
            }
          } catch (error) {
            console.error("Failed to create study session:", error)
            // Continue even if this fails
          }
        }

        // Get study set
        const { data: set, error: setError } = await supabase
          .from("study_sets")
          .select("*")
          .eq("id", params.id)
          .single()

        if (setError) throw setError

        setStudySet({ id: set.id, title: set.title })

        // Get flashcards
        const { data: cards, error: cardsError } = await supabase
          .from("flashcards")
          .select("*")
          .eq("study_set_id", params.id)
          .order("created_at", { ascending: true })

        if (cardsError) throw cardsError

        if (cards.length === 0) {
          toast({
            title: "No flashcards",
            description: "This study set doesn't have any flashcards.",
            variant: "destructive",
          })
          router.push(`/study/${params.id}`)
          return
        }

        setFlashcards(cards)
      } catch (error: any) {
        toast({
          title: "Error loading study set",
          description: error.message || "Failed to load study set",
          variant: "destructive",
        })
        router.push("/study")
      } finally {
        setLoading(false)
      }
    }

    fetchStudySet()
  }, [params.id, router, supabase, toast, user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if the answer is correct (case insensitive)
    const currentCard = flashcards[currentIndex]
    const isCorrect = userAnswer.trim().toLowerCase() === currentCard.back_text.trim().toLowerCase()

    // Update the current card's status
    const updatedCards = [...flashcards]
    updatedCards[currentIndex].status = isCorrect ? "correct" : "incorrect"
    updatedCards[currentIndex].userAnswer = userAnswer
    setFlashcards(updatedCards)

    // Show result
    setShowResult(isCorrect ? "correct" : "incorrect")

    // Clear the input after a delay
    setTimeout(() => {
      setUserAnswer("")
      setShowResult(null)

      // Move to the next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Check if there are any incorrect cards
        const incorrectCards = updatedCards.filter((card) => card.status === "incorrect")

        if (incorrectCards.length > 0) {
          // Reset to only show incorrect cards
          const newCards = incorrectCards.map((card) => ({ ...card, status: undefined, userAnswer: undefined }))
          setFlashcards(newCards)
          setCurrentIndex(0)
          setRound(round + 1)

          toast({
            title: "Review incorrect cards",
            description: `You have ${incorrectCards.length} cards to review again.`,
          })
        } else {
          // All cards are correct, study session completed
          setCompleted(true)

          // Update the study session as completed if user is logged in
          if (sessionId && user) {
            supabase
              .from("study_sessions")
              .update({ completed_at: new Date().toISOString() })
              .eq("id", sessionId)
              .then(() => {
                console.log("Study session marked as completed")
              })
              .catch((error) => {
                console.error("Failed to update study session:", error)
              })
          }
        }
      }
    }, 1500)
  }

  const handleExit = () => {
    router.push(`/study/${params.id}`)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
          <p className="text-xl mb-8">You've mastered this study set!</p>
          <Button onClick={handleExit} size="lg">
            Exit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{studySet?.title}</h1>
        <p className="text-muted-foreground">
          Card {currentIndex + 1} of {flashcards.length}
          {round > 1 && ` (Round ${round})`}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center mb-8">
        <Card
          className={`w-full max-w-2xl p-8 min-h-[300px] ${
            showResult === "correct" ? "bg-green-50" : showResult === "incorrect" ? "bg-red-50" : ""
          }`}
        >
          <CardContent className="p-0 flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8 w-full">
              <p className="text-xl mb-4">{flashcards[currentIndex]?.front_text}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="answer">Your answer:</Label>
                  <Input
                    id="answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here"
                    className={`text-center ${
                      showResult === "correct" ? "border-green-500" : showResult === "incorrect" ? "border-red-500" : ""
                    }`}
                    disabled={showResult !== null}
                    autoFocus
                  />
                </div>

                {showResult === "incorrect" && (
                  <div className="text-red-500 mt-2">
                    <p>Correct answer: {flashcards[currentIndex]?.back_text}</p>
                  </div>
                )}

                {showResult === null && (
                  <Button type="submit" className="w-full">
                    Submit
                  </Button>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

