import { initializeLucia, createReddit } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages"
import { cookies } from "next/headers";
import { generateId } from "lucia";

export const runtime = 'edge'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const storedState = cookies().get("reddit_oauth_state")?.value ?? null

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400
    })
  }

  const tokens = await createReddit().validateAuthorizationCode(code)

  const redditUserResponse = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`
    }
  })

  let redditUser: RedditUser
  try {
    redditUser = await redditUserResponse.json()
  } catch (e) {
    return new Response("Failed to retrieve your Reddit profile. Please try again.", {
      status: 500,
      statusText: "Reddit profile JSON deserialization failed",
      headers: {
        "content-type": "text/plain;charset=UTF-8"
      }
    })
  }

  const d1 = getRequestContext().env.DB
  const lucia = initializeLucia(d1)

  const existingUser = await d1.prepare("SELECT id FROM user WHERE reddit_username = ?")
    .bind(redditUser.name)
    .first() as UserRecord

  if (existingUser) {
    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/"
      }
    })
  }

  const newUserId = generateId(15)
  const createUser = await d1.prepare("INSERT INTO user (id, reddit_username) VALUES (?, ?, ?)")
    .bind(newUserId, redditUser.name)
    .run()

  if (!createUser.success) {
    return new Response(JSON.stringify({ "error": "Failed to create new user" }), {
      status: 500
    })
  }

  const session = await lucia.createSession(newUserId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/"
    }
  })
}

interface UserRecord {
  id: string
}

interface RedditUser {
  name: string
}