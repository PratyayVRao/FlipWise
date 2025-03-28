"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const router = useRouter()
  const { supabase, user, loading } = useSupabase()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [updating, setUpdating] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        if (profileData) {
          setProfile(profileData)
          setUsername(profileData.username || "")
        } else {
          // Create profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: user.email?.split("@")[0] || "user",
            })
            .select()
            .single()

          if (createError) throw createError

          if (newProfile) {
            setProfile(newProfile)
            setUsername(newProfile.username || "")
          }
        }
      } catch (error: any) {
        console.error("Error loading profile:", error.message || error)
        toast({
          title: "Error loading profile",
          description: "Could not load your profile information. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [user, router, supabase, toast])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
        })
        .eq("id", user?.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
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
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a username"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleLogout}>
                Log out
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your study materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <a href="/study/create">Create New Study Set</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/study">Browse Study Sets</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

