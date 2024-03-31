import { initializeLucia, createReddit } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages"
import { cookies } from "next/headers";
import { generateId } from "lucia";
import { OAuth2RequestError } from "arctic";

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

  try {
    const tokens = await createReddit().validateAuthorizationCode(code)
    const redditUserResponse = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    })

    const redditUser: RedditUser = (await redditUserResponse.json())

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
    const createUser = await d1.prepare("INSERT INTO user (id, reddit_username, reddit_snoovatar) VALUES (?, ?, ?)")
      .bind(newUserId, redditUser.name, redditUser.snoovatar_img)
      .run()

    if (!createUser.success) {
      return new Response(JSON.stringify({"error": "Failed to create new user"}), {
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
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400
      })
    }

    return new Response(JSON.stringify({"error": `Encountered error: ${e}`}), {
      status: 500
    })
  }
}

interface UserRecord {
  id: string
}

interface RedditUser {
  name: string,
  snoovatar_img: string,
}