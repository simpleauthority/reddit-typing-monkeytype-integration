import { validateSession } from "@/auth";
import Header from "@/components/header";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { revalidatePath } from "next/cache";

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

  if (user) {
    const key = await getCurrentApeKey(user.id)
    const stats = await getMonkeyTypeStats(key)

    const setApeKeyWithId = setApeKey.bind(null, user.id)

    return <>
      <Header user={user} />
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
                  <button className="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">
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
    return <Header />
  }
}
