"use client"

import { useSession } from "next-auth/react"

export function useCurrentUser() {
  const { data: session, status, update } = useSession()

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    updateSession: update,
  }
}
