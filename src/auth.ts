import { Lucia, Session, User } from "lucia"
import { D1Adapter } from "@lucia-auth/adapter-sqlite"
import { Reddit } from "arctic"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { cache } from "react"
import { cookies } from "next/headers"

export const validateSession = cache(
  async (): Promise<UserSession> => {
    const lucia = initializeLucia(getRequestContext().env.DB)

    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null
    if (!sessionId) {
      return {
        user: null,
        session: null
      }
    }

    const result = await lucia.validateSession(sessionId)

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }

      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
    } catch {}

    return result;
  }
)

export function createReddit(): Reddit {
  const env = getRequestContext().env

  return new Reddit(
    env.REDDIT_CLIENT_ID,
    env.REDDIT_CLIENT_SECRET,
    env.REDDIT_REDIRECT_URI
  );
}

export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: "user",
    session: "user_session"
  })

  return new Lucia(adapter, {
    sessionCookie: {
      expires: false,
      attributes: {
        secure: process.env.NODE_ENV === "production"
      },
    },
    getUserAttributes: (attributes: DatabaseUserAttributes) => {
      return {
        reddit_username: attributes.reddit_username,
        reddit_snoovatar: attributes.reddit_snoovatar
      }
    }
  })
}

declare module "lucia" {
  interface Register {
    Lucia: typeof Lucia;
    Auth: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }

  interface User {
    reddit_username: string;
    reddit_snoovatar: string;
  }
}

interface DatabaseUserAttributes {
  reddit_username: string;
  reddit_snoovatar: string;
}

export type UserSession = { user: User; session: Session } | { user: null; session: null }