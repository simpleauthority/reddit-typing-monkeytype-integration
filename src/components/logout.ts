'use server'

import { initializeLucia, validateSession } from "@/auth"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function logout(): Promise<{ error: string | null }> {
  const { session } = await validateSession()
  if (!session) {
    return {
      error: "Unauthorized"
    }
  }

  const lucia = initializeLucia(getRequestContext().env.DB)

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  return redirect("/")
}