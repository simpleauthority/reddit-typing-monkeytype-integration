import { validateSession } from "@/auth";
import Header from "@/components/header";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { revalidatePath } from "next/cache";

import StatsResult from "@/types/stats-result";
import Stats from "@/types/stats";
import Errable from "@/types/errable";
import StatChooser from "@/components/stat-chooser";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

export const runtime = 'edge'

async function setApeKey(id: string, data: FormData): Promise<Errable> {
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

async function deleteApeKey(id: string): Promise<Errable> {
  'use server'

  const db = getRequestContext().env.DB
  const res = await db.prepare("UPDATE user SET monkeytype_apekey = null WHERE id = ?")
    .bind(id)
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

async function getMonkeyTypeStats(key: string | null): Promise<StatsResult> {
  if (!key) {
    return {
      stats: null,
      error: "No key provided"
    }
  }

  const resp = await fetch(
    "https://api.monkeytype.com/users/personalBests?mode=time",
    {
      headers: {
        Authorization: `ApeKey ${key}`
      }
    }
  )

  if (!resp.ok) {
    if (resp.status === 470) {
      return {
        stats: null,
        error: "Could not retrieve your stats: Ape Key is invalid. Check your provided Ape Key."
      }
    } else if (resp.status === 471) {
      return {
        stats: null,
        error: "Could not retrieve your stats: Ape Key is inactive. Set the Ape Key to active in MonkeyType settings."
      }
    }

    const errorData = await resp.json() as any

    return {
      stats: null,
      error: `An unknown error occurred while trying to retrieve your stats: ${errorData.message}.`
    }
  }

  const stats = (await resp.json() as any)['data'] as Stats

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
    const deleteApeKeyWithId = deleteApeKey.bind(null, user.id)

    return <>
      <Header user={user} />
      <div className="pt-6">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">
              Ape Key
              { key ? <>
                <p className="pt-2 text-xs">Click below and we will forget your Ape Key.</p>
                <form action={deleteApeKeyWithId}>
                  <span>
                    <button className="rounded-md bg-white font-medium text-red-600 hover:text-red-500">
                      Delete
                    </button>
                  </span>
                </form>
              </> : <></> }
            </dt>
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
          {key ? 
            <StatChooser user={user} stats={stats} /> :
            <div className="px-4 py-6 sm:px-0 space-y-2">
              <p>To get your MonkeyType stats, we need your Ape Key. This key lets us query your MonkeyType account and determine your personal leaderboard scores.</p>
              <p>To find it, please follow these steps:</p>
              <ol className="list-decimal list-inside py-2 space-y-2">
                <li>Go to <a className="text-blue-600 hover:text-blue-400" href="https://monkeytype.com" target="_blank">MonkeyType</a> (this will open in a new window).</li>
                <li>Click the settings icon (looks like this: <Cog6ToothIcon className="inline-block h-8 w-8"></Cog6ToothIcon>).</li>
                <li>In the menu at the top of the settings page, click "danger zone".</li>
                <li>The third option down in this section is "ape keys". Click "open".</li>
                <li>Click "Generate new key" and give it a name you will remember (like "typing_subreddit"), then click "generate".</li>
                <li>Copy your Ape Key. You will only see it <strong>one time</strong>! Then, click "close".</li>
                <li>Click "open" next to "ape keys" again. In the Ape Keys screen, check the "active" checkbox next to the key's name.</li>
                <li>Come back here and paste your Ape Key in the box above, then press "Update". We will then use your Ape Key to get your leaderboard results.</li>
              </ol>
            </div>
          }
        </dl>
      </div>
    </>
  } else {
    return <>
      <Header />
      <div className="pt-6">
        <p>You are not logged in. Please sign in with Reddit using the top-right button. We need this so that we can verify your Reddit username and associate it with your chosen flair.</p>
      </div>
    </>
  }
}
