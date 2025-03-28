"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "./supabase-provider"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, supabase, refreshUser } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)

    // Refresh user data when component mounts
    if (!loading) {
      refreshUser()
    }
  }, [refreshUser, loading])

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

  // Only render the navbar after the component has mounted to avoid hydration issues
  if (!mounted) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">FlipWise</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-foreground/60"
            }`}
          >
            Home
          </Link>
          <Link
            href="/study"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname.startsWith("/study") ? "text-primary" : "text-foreground/60"
            }`}
          >
            Study
          </Link>
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/study/create">Create Study Set</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="default" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

