"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Edit, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TempStudyPageProps {
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

export default function TempStudyPage({ params }: TempStudyPageProps) {
  const [studySet, setStudySet] = useState<TempStudySet | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Load temporary study set from localStorage
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
    setLoading(false)
  }, [params.id, router, toast])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading study set...</p>
        </div>
      </div>
    )
  }

  if (!studySet) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{studySet.title}</h1>
          {studySet.description && <p className="text-muted-foreground mt-2">{studySet.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/study/temp/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

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

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Choose Study Mode</CardTitle>
            <CardDescription>
              Select how you want to study this set of {studySet.flashcards.length} flashcards
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <Link href={`/study/temp/${params.id}/flashcard`} className="block p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <BookOpen className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">Flashcard Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Flip through cards and mark them as correct or incorrect
                    </p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <Link href={`/study/temp/${params.id}/written`} className="block p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <FileText className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">Written Mode</h3>
                    <p className="text-sm text-muted-foreground">Type your answers and check if they match</p>
                  </div>
                </div>
              </Link>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview Flashcards</CardTitle>
            <CardDescription>Review all flashcards in this set</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {studySet.flashcards.map((card, index) => (
                <Card key={card.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Front - Card {index + 1}</p>
                      <p>{card.front_text}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Back - Card {index + 1}</p>
                      <p>{card.back_text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">Total: {studySet.flashcards.length} flashcards</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

