"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type SupabaseContext = {
  supabase: typeof supabase
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error("Error refreshing user:", error.message)
        setUser(null)
      } else {
        setUser(data.user)
      }
    } catch (error: any) {
      console.error("Error refreshing user:", error.message || error)
      // Don't reset user on network errors to prevent flickering
    }
  }

  useEffect(() => {
    // Use localStorage as a fallback for user data
    const storedUser = localStorage.getItem("supabase.auth.token")
    if (storedUser) {
      try {
        const parsedData = JSON.parse(storedUser)
        if (parsedData?.currentSession?.user) {
          setUser(parsedData.currentSession.user)
        }
      } catch (e) {
        console.error("Error parsing stored user data")
      }
    }

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("Error getting user:", error.message)
          // Don't reset user if we already have data from localStorage
          if (!user) setUser(null)
        } else {
          setUser(data.user)
        }
      } catch (error: any) {
        console.error("Error getting user:", error.message || error)
        // Don't reset user if we already have data from localStorage
        if (!user) setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)
      if (session?.user) {
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, user])

  return <Context.Provider value={{ supabase, user, loading, refreshUser }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}

