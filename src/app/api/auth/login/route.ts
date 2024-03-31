import { createReddit } from "@/auth";
import { generateState } from "arctic";
import { cookies } from "next/headers";

export const runtime = 'edge'

export async function GET(): Promise<Response> {
  const state = generateState()

  let url = await createReddit().createAuthorizationURL(state, { scopes: ["identity", "flair"] })
  url.searchParams.set("duration", "permanent")
  
  cookies().set("reddit_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax"
  })

  return Response.redirect(url)
}