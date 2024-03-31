import { initializeLucia, validateSession } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { PaperClipIcon } from "@heroicons/react/16/solid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const runtime = 'edge'

interface PersonalBests {
  acc: number,
  consistency: number,
  difficulty: string,
  lazyMode: boolean,
  language: string,
  punctuation: boolean,
  raw: number,
  wpm: number,
  timestamp: number
}

async function logout(): Promise<{ error: string | null }> {
  'use server'

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

async function setApeKey(id: string, data: FormData): Promise<{ error: string | null }> {
  'use server'

  const key = data.get("ape_key")
  if (!key) {
    return {
      error: 'Ape Key not specified'
    }
  }

  const db = getRequestContext().env.DB
  const res = await db.prepare("UPDATE user SET monkeytype_apekey = ? WHERE id = ?")
    .bind(key, id)
    .run()

  if (!res.success) {
    return {
      error: 'Failed to execute query'
    }
  }

  revalidatePath("/")

  return {
    error: null
  }
}

async function getCurrentApeKey(id: string): Promise<string | null> {
  'use server'

  const db = getRequestContext().env.DB
  const key = await db.prepare("SELECT monkeytype_apekey FROM user WHERE id = ?")
    .bind(id)
    .first()

  if (!key) {
    return null
  }

  return key["monkeytype_apekey"] as string
}

async function getMonkeyTypeStats(key: string | null): Promise<{ stats: PersonalBests[] | null, error: string | null }> {
  if (!key) {
    return {
      stats: null,
      error: "No key provided"
    }
  }

  const resp = await fetch(
    "https://api.monkeytype.com/users/personalBests?mode=time&mode2=60",
    {
      headers: {
        Authorization: `ApeKey ${key}`
      }
    }
  )

  if (!resp.ok) {
    return {
      stats: null,
      error: "Failed to retrieve your stats"
    }
  }

  const stats = (await resp.json() as any)['data'] as PersonalBests[]

  return {
    stats,
    error: null
  }
}

export default async function Home() {
  const { user } = await validateSession()

  const header = <>
    <div className="w-full py-4 rounded-r-md rounded-l-md flex justify-between items-center">
      <p><a className="text-blue-600 hover:text-blue-400" href="https://reddit.com/r/typing" target="_blank">r/typing</a> <a className="text-blue-600 hover:text-blue-400" href="https://monkeytype.com" target="_blank">MonkeyType</a> integration</p>
      <div className="flex space-x-4 items-center">
        <div className="flex space-x-4 items-center bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm rounded-md">
          { user ? <> 
            <img
              className="h-4 w-4"
              src={user.reddit_snoovatar}
              alt={user.reddit_username + "'s avatar"}
            />
            <p>{user.reddit_username}</p>
          </> : <>
            <span className="inline-block h-4 w-4 overflow-hidden rounded-full bg-gray-100">
              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <a href="/api/auth/login">Log in</a>
          </>
        }
        </div>
        <div className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          <form action={logout}>
            <button>Log out</button>
          </form>
        </div>
      </div>
    </div>
  </>

  if (user) {
    const key = await getCurrentApeKey(user.id)
    const stats = await getMonkeyTypeStats(key)

    const setApeKeyWithId = setApeKey.bind(null, user.id)

    return <>
      {header}
      <div className="pt-6">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Ape Key</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <form className="flex" action={setApeKeyWithId}>
                <span className="flex-grow">
                  <input className="w-full" type="text" name="ape_key" placeholder={key ?? "Your Ape Key"} required></input>
                </span>
                <span className="ml-4 flex-shrink-0">
                  <button type="button" className="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </span>
              </form>
            </dd>
          </div>
          {stats.stats ? <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">Flair Choices</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <div>
                <fieldset>
                  <legend className="sr-only">Flair choices</legend>
                  <div className="space-y-4">
                    {stats.stats.map(stat => (
                      <div key={stat.language} className="flex items-center">
                        <input
                          id={stat.language}
                          name="flair-choice"
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <label className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                          <p>{stat.language}/r:{stat.raw}/w:{stat.wpm}/a:{stat.acc}/c:{stat.consistency}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            </dd>
          </div> : <></>}
        </dl>
      </div>
    </>
  } else {
    return header;
  }
}
