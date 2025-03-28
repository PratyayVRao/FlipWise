"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus } from "lucide-react"
import StudySetCard from "@/components/study-set-card"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { supabase, user, loading } = useSupabase()
  const { toast } = useToast()
  const [recentSets, setRecentSets] = useState<any[]>([])
  const [allSets, setAllSets] = useState<any[]>([])
  const [tempSets, setTempSets] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const fetchData = async () => {
    try {
      setLoadingData(true)
      if (user) {
        // Get all study sets
        const { data: allUserSets, error } = await supabase
          .from("study_sets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setAllSets(allUserSets || [])

        // Get recent sets (just take the first 4)
        setRecentSets(allUserSets?.slice(0, 4) || [])
      } else {
        // Load temporary sets from localStorage
        try {
          const storedSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
          setTempSets(storedSets)
        } catch (error) {
          console.error("Error loading temporary sets:", error)
          setTempSets([])
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchData()
    }
  }, [loading, user])

  const handleDeleteSet = () => {
    // Refresh the list after deletion
    fetchData()
  }

  return (
    <div className="container py-8">
      <section className="mb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Master knowledge one flip at a time</h1>
          <p className="text-xl text-muted-foreground mb-6">Create, study, and master your flashcards with FlipWise</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/study">Start Studying</Link>
            </Button>
            {!user && !loading && (
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {!loading && !loadingData && user && (
        <>
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Recent Study Sets</h2>
            {recentSets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentSets.map((set) => (
                  <StudySetCard key={set.id} studySet={set} onDelete={handleDeleteSet} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/50">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent study sets</h3>
                <p className="text-muted-foreground mb-4">You haven't studied any sets recently.</p>
                <Button asChild>
                  <Link href="/study/create">Create a Study Set</Link>
                </Button>
              </div>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">All Study Sets</h2>
              <Button asChild>
                <Link href="/study/create">
                  <Plus className="mr-2 h-4 w-4" /> Create New Set
                </Link>
              </Button>
            </div>

            {allSets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allSets.map((set) => (
                  <StudySetCard key={set.id} studySet={set} onDelete={handleDeleteSet} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/50">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No study sets yet</h3>
                <p className="text-muted-foreground mb-4">Create your first study set to get started.</p>
                <Button asChild>
                  <Link href="/study/create">Create a Study Set</Link>
                </Button>
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !loadingData && !user && (
        <>
          {tempSets.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Your Temporary Study Sets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tempSets.map((set) => (
                  <StudySetCard
                    key={set.id}
                    studySet={{
                      id: set.id,
                      title: set.title,
                      description: set.description,
                      created_at: set.created_at,
                      updated_at: set.updated_at,
                    }}
                    isTemporary={true}
                    onDelete={handleDeleteSet}
                  />
                ))}
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  These are temporary study sets stored in your browser. To save them permanently, please
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
            </section>
          )}

          <section>
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Log in to see your sets</h3>
              <p className="text-muted-foreground mb-4">
                Create an account or log in to create and view your study sets.
              </p>
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

