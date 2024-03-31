"use client"

import { User } from "lucia"
import logout from "./logout"

export default function Header({ user }: { user?: User }) {
  return (
    <div className="w-full py-4 rounded-r-md rounded-l-md flex justify-between items-center">
      <p><a className="text-blue-600 hover:text-blue-400" href="https://reddit.com/r/typing" target="_blank">r/typing</a> <a className="text-blue-600 hover:text-blue-400" href="https://monkeytype.com" target="_blank">MonkeyType</a> integration</p>
      <div className="flex space-x-4 items-center">
        <div className="flex space-x-4 items-center bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm rounded-md">
          {user ? <>
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
        {user ? <>
          <div className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <form action={logout}>
              <button>Log out</button>
            </form>
          </div>
        </> : <></>}
      </div>
    </div>
  )
}