"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import StudySetCard from "@/components/study-set-card"

export default function TemporaryStudySets() {
  const [tempSets, setTempSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedSets = JSON.parse(localStorage.getItem("tempStudySets") || "[]")
      setTempSets(storedSets)
    } catch (error) {
      console.error("Error loading temporary sets:", error)
      setTempSets([])
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <div>Loading temporary sets...</div>
  }

  if (tempSets.length === 0) {
    return null
  }

  return (
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
  )
}

