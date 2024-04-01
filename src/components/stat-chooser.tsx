"use client"

import StatsResult from "@/types/stats-result"
import { User } from "lucia"

import dayjs from "dayjs"

import setRedditFlair from "./set-reddit-flair"
import { useFormState, useFormStatus } from "react-dom"

export default function StatChooser({ user, stats }: { user: User, stats: StatsResult }) {
  const { pending } = useFormStatus()
  const [state, formAction] = useFormState(setRedditFlair.bind(null, user.reddit_username), { message: '', error: '' })

  let dom: React.ReactNode
  if (stats.stats) {
    dom = <>
      <dt className="text-sm font-medium leading-6 text-gray-900">
        Flair Choices
        <p className="pt-2 text-xs">
          You may choose from the following flairs, sourced from your MonkeyType leaderboards.
        </p>
      </dt>
      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
        <div>
          <fieldset>
            <legend className="sr-only">Flair choices</legend>
            <div className="space-y-4">
              <form className="flex" action={formAction}>
                <span className="flex-grow">
                  {Object.entries(stats.stats).map((entry) => {
                    const time = entry[0]
                    const stat = entry[1][0]

                    const flair = `${time}s :: ${stat.wpm}wpm :: ${stat.acc}% acc :: ${dayjs(stat.timestamp).format("MMM DD, YYYY")}`

                    return <div key={time} className="flex items-center">
                      <input
                        id={time}
                        name="flair-choice"
                        value={flair}
                        type="radio"
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        required
                      />
                      <label htmlFor={time} className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                        <p>{flair}</p>
                      </label>
                    </div>
                  })}
                </span>
                <span className="ml-4 flex-shrink-0">
                  <button className="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500" disabled={pending}>
                    {pending ? "Updating..." : "Update"}
                  </button>
                </span>
              </form>
            </div>
          </fieldset>
        </div>
      </dd>
      {state.error ? 
        <p className="col-span-3 text-center text-red-500 font-semibold">Error: {state.error}</p> :
        <p className="col-span-3 text-center text-green-500 font-semibold">{state.message}</p>
      }
    </>
  } else {
    const error = stats.error ? <span>(Error: {stats.error})</span> : <></>
    dom = <div className="col-span-3">
      <p>We couldn't fetch your stats from MonkeyType. Is your key correct? {error}</p>
    </div>
  }

  return <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    {dom}
  </div>
}