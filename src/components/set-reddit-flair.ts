"use server"

import { getRequestContext } from "@cloudflare/next-on-pages"

export default async function setRedditFlair(username: string, prevState: any, data: FormData) {
  const flair = data.get("flair-choice")
  if (!flair) {
    return {
      message: '',
      error: 'Flair not specified'
    }
  }

  const token = await getRequestContext().env.KV.get("bot_token")
  if (!token) {
    return {
      message: '',
      error: "The Reddit Bot is not currently authorized to use Reddit's API. Please contact u/simpleauthority about this."
    }
  }

  const flairUrl = "https://oauth.reddit.com/r/typing/api/flair?" + new URLSearchParams({
    api_type: "json",
    name: username,
    text: flair.toString()
  })

  const flairResp = await fetch(flairUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': 'RTypingMonkeytypeIntegration/0.0.1 by u/simpleauthority'
    }
  })

  if (!flairResp.ok) {
    return {
      message: '',
      error: "Failed to update your flair via Reddit. Please try again later."
    }
  }

  return { message: "Successfully updated your flair! Feel free to go check.", error: '' }
}