import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Edit, FileText } from "lucide-react"
import { createServerSupabase } from "@/lib/supabase-server"

interface StudyPageProps {
  params: {
    id: string
  }
}

export default async function StudyPage({ params }: StudyPageProps) {
  const supabase = createServerSupabase()

  // Get study set without requiring authentication
  const { data: studySet, error } = await supabase
    .from("study_sets")
    .select("*, flashcards(*)")
    .eq("id", params.id)
    .single()

  if (error || !studySet) {
    notFound()
  }

  // Get session to check if user is logged in (but don't require it)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Only create a study session if user is logged in
  if (session) {
    try {
      await supabase.from("study_sessions").insert({
        user_id: session.user.id,
        study_set_id: studySet.id,
        mode: "view", // Just viewing the set, not studying yet
      })
    } catch (error) {
      console.error("Failed to create study session:", error)
      // Continue even if this fails
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{studySet.title}</h1>
          {studySet.description && <p className="text-muted-foreground mt-2">{studySet.description}</p>}
        </div>
        <div className="flex gap-2">
          {session && session.user.id === studySet.user_id && (
            <Button asChild variant="outline">
              <Link href={`/study/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
        </div>
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
              <Link href={`/study/${params.id}/flashcard`} className="block p-6">
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
              <Link href={`/study/${params.id}/written`} className="block p-6">
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

