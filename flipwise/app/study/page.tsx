"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen } from "lucide-react"
import StudySetCard from "@/components/study-set-card"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"

export default function StudyPage() {
  const { supabase, user, loading } = useSupabase()
  const { toast } = useToast()
  const [studySets, setStudySets] = useState<any[]>([])
  const [tempSets, setTempSets] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const fetchData = async () => {
    try {
      setLoadingData(true)
      if (user) {
        // Get user's study sets
        const { data, error } = await supabase
          .from("study_sets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setStudySets(data || [])
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
      console.error("Error fetching study sets:", error)
      toast({
        title: "Error loading study sets",
        description: error.message || "Failed to load study sets",
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

  if (loading || loadingData) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Study Sets</h1>
          <Button asChild>
            <Link href="/study/create">
              <Plus className="mr-2 h-4 w-4" /> Create New Set
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading study sets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Study Sets</h1>
        <Button asChild>
          <Link href="/study/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Set
          </Link>
        </Button>
      </div>

      {user && studySets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {studySets.map((set) => (
            <StudySetCard key={set.id} studySet={set} onDelete={handleDeleteSet} />
          ))}
        </div>
      ) : user ? (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No study sets yet</h3>
          <p className="text-muted-foreground mb-6">Create your first study set to get started.</p>
          <Button asChild>
            <Link href="/study/create">Create a Study Set</Link>
          </Button>
        </div>
      ) : tempSets.length > 0 ? (
        <>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              You are viewing temporary study sets. To save them permanently, please
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tempSets.map((set) => (
              <StudySetCard key={set.id} studySet={set} isTemporary={true} onDelete={handleDeleteSet} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Create temporary study sets</h3>
          <p className="text-muted-foreground mb-6">
            You can create and study sets without logging in, but they won't be saved to your account.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link href="/study/create">Create a Study Set</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Log In to Save Sets</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

