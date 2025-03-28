"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface TempWrittenStudyPageProps {
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

interface TempStudySet {
  id: string
  title: string
  description?: string
  flashcards: Flashcard[]
}

export default function TempWrittenStudyPage({ params }: TempWrittenStudyPageProps) {
  const [studySet, setStudySet] = useState<TempStudySet | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [showResult, setShowResult] = useState<"correct" | "incorrect" | null>(null)
  const [round, setRound] = useState(1)
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

      setStudySet(currentSet)
      setFlashcards(currentSet.flashcards.map((card) => ({ ...card, status: undefined })))
      setLoading(false)
    } catch (error) {
      console.error("Error loading study set:", error)
      toast({
        title: "Error loading study set",
        description: "There was a problem loading the study set.",
        variant: "destructive",
      })
      router.push("/study")
    }
  }, [params.id, router, toast])

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
        }
      }
    }, 1500)
  }

  const handleExit = () => {
    router.push(`/study/temp/${params.id}`)
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
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 mb-4">
              This was a temporary study set. To save your progress, please
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

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">
          This is a temporary study set. To save your progress, please
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

