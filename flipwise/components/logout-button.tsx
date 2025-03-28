"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "./supabase-provider"
import { useToast } from "@/hooks/use-toast"

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const handleLogout = async () => {
    setLoading(true)

    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "There was a problem logging out.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading} className="w-full">
      {loading ? "Logging out..." : "Log out"}
    </Button>
  )
}

