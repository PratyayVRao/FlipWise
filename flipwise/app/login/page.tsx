"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase, refreshUser } = useSupabase()
  const { toast } = useToast()

  // Get the tab from URL or default to login
  const defaultTab = searchParams.get("tab") || "login"

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Show specific error messages based on error code
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Invalid email or password. Please try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setLoginError("Please confirm your email address before logging in.")
        } else {
          setLoginError(error.message)
        }
      } else if (data.user) {
        await refreshUser()
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        })

        // Redirect to home page or the page they were trying to access
        const redirectTo = searchParams.get("redirectTo") || "/"
        router.push(redirectTo)
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRegisterError(null)

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        // Show specific error messages
        if (error.message.includes("already registered")) {
          setRegisterError("This email is already registered. Please log in instead.")
        } else if (error.message.includes("password")) {
          setRegisterError("Password is too weak. Please use at least 6 characters.")
        } else {
          setRegisterError(error.message)
        }
      } else if (data.user) {
        // Create a profile with the username
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: username || email.split("@")[0], // Use part of email as default username if none provided
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          setRegisterError("Your account was created but we couldn't set up your profile.")
        } else {
          toast({
            title: "Account created!",
            description: "Your account has been created successfully.",
          })

          // Auto sign in after registration
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (!signInError) {
            await refreshUser()
            router.push("/")
          } else {
            // Switch to login tab if auto sign-in fails
            document.querySelector('[data-state="inactive"][data-value="login"]')?.click()
          }
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setRegisterError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your email and password to access your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Enter your details to get started</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  {registerError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

