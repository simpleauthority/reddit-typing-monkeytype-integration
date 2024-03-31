import { initializeLucia, validateSession } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = 'edge'

async function logout(): Promise<{ error: string | null }> {
  'use server';

  const { session } = await validateSession()
  if (!session) {
    return {
      error: "Unauthorized"
    }
  }

  const lucia = initializeLucia(getRequestContext().env.DB);
  
  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return redirect("/");
}

export default async function Home() {
  const { user } = await validateSession()

  if (user) {
    return <>
      <p>Hello, {user.reddit_username}!</p>
      <img src={user.reddit_snoovatar} alt={user.reddit_username + "'s avatar"} />
      <form action={logout}>
        <button>Sign out</button>
      </form>
    </>
  } else {
    return (
      <>
        <p>You are not logged in.</p>
        <p><a href="/api/auth/login">Login via Reddit</a></p>
      </>
    );
  }
}
