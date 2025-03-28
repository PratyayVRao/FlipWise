"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, BookOpen, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface StudySetCardProps {
  studySet: {
    id: string
    title: string
    description?: string
    created_at: string
    updated_at: string
    user_id?: string
  }
  isTemporary?: boolean
  onDelete?: () => void
}

export default function StudySetCard({ studySet, isTemporary = false, onDelete }: StudySetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { supabase, user } = useSupabase()
  const { toast } = useToast()

  const createdAt = new Date(studySet.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

  // Check if the current user owns this study set
  const isOwner = user && studySet.user_id === user.id

  const handleDelete = async () => {
    if (isTemporary) {
      // Delete from localStorage
      try {
        const tempSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
        const updatedSets = tempSets.filter((set: any) => set.id !== studySet.id)
        localStorage.setItem("tempStudySets", JSON.stringify(updatedSets))

        toast({
          title: "Study set deleted",
          description: "Your temporary study set has been deleted.",
        })

        if (onDelete) onDelete()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the study set.",
          variant: "destructive",
        })
      }
    } else if (user) {
      // Delete from database
      setIsDeleting(true)
      try {
        const { error } = await supabase.from("study_sets").delete().eq("id", studySet.id).eq("user_id", user.id)

        if (error) throw error

        toast({
          title: "Study set deleted",
          description: "Your study set has been deleted.",
        })

        if (onDelete) onDelete()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete the study set.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }

    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{studySet.title}</h3>
              {studySet.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{studySet.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">Created {timeAgo}</p>
              {isTemporary && <p className="text-xs text-yellow-600 mt-1">Temporary</p>}
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button asChild variant="default" size="sm">
            <Link href={isTemporary ? `/study/temp/${studySet.id}` : `/study/${studySet.id}`}>Study</Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={isTemporary ? `/study/temp/${studySet.id}/edit` : `/study/${studySet.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Link>
            </Button>

            {(isTemporary || isOwner) && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the study set "{studySet.title}" and all its flashcards. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

