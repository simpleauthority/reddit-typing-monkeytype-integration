"use client"

import { User } from "lucia"
import logout from "./logout"

export default function Header({ user }: { user?: User }) {
  return (
    <div className="w-full py-4 rounded-r-md rounded-l-md flex justify-between items-center">
      <p><a className="text-blue-600 hover:text-blue-400" href="https://reddit.com/r/typing" target="_blank">r/typing</a> <a className="text-blue-600 hover:text-blue-400" href="https://monkeytype.com" target="_blank">MonkeyType</a> integration</p>
      <div className="flex space-x-4 items-center">
        <div className="flex space-x-4 items-center bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm rounded-md">
          {user ? <p>{user.reddit_username}</p> : <a href="/api/auth/login">Log in</a>}
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