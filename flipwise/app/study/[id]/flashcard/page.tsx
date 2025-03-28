"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"

interface FlashcardStudyPageProps {
  params: {
    id: string
  }
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  status?: "correct" | "incorrect"
}

export default function FlashcardStudyPage({ params }: FlashcardStudyPageProps) {
  const [studySet, setStudySet] = useState<{ id: string; title: string } | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
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
                mode: "flashcard",
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

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleMarkCard = (status: "correct" | "incorrect") => {
    if (!flipped) {
      toast({
        title: "Flip the card first",
        description: "Please flip the card to see the answer before marking it.",
      })
      return
    }

    // Update the current card's status
    const updatedCards = [...flashcards]
    updatedCards[currentIndex].status = status
    setFlashcards(updatedCards)
    setFlipped(false)

    // Move to the next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Check if there are any incorrect cards
      const incorrectCards = updatedCards.filter((card) => card.status === "incorrect")

      if (incorrectCards.length > 0) {
        // Reset to only show incorrect cards
        const newCards = incorrectCards.map((card) => ({ ...card, status: undefined }))
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
        <div className={`flip-card w-full max-w-2xl ${flipped ? "flipped" : ""}`} onClick={handleFlip}>
          <div className="flip-card-inner">
            <Card className="flip-card-front p-8 min-h-[300px] flex items-center justify-center cursor-pointer">
              <div className="text-center">
                <p className="text-xl">{flashcards[currentIndex]?.front_text}</p>
                <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
              </div>
            </Card>
            <Card className="flip-card-back p-8 min-h-[300px] flex items-center justify-center cursor-pointer absolute inset-0">
              <div className="text-center">
                <p className="text-xl">{flashcards[currentIndex]?.back_text}</p>
                <p className="text-sm text-muted-foreground mt-4">Click to flip back</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={() => handleMarkCard("incorrect")}
          variant="outline"
          size="lg"
          className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <X className="mr-2 h-5 w-5" /> I didn't know
        </Button>
        <Button
          onClick={() => handleMarkCard("correct")}
          variant="outline"
          size="lg"
          className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
        >
          <Check className="mr-2 h-5 w-5" /> I knew it
        </Button>
      </div>
    </div>
  )
}

