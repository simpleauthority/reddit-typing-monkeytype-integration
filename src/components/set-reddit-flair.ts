"use server"

import AccessTokenResponse from "@/types/access-token-response"
import { getRequestContext } from "@cloudflare/next-on-pages"
import * as base64 from 'base-64'

async function fetchRedditToken(env: CloudflareEnv): Promise<string | null> {
  const tokenResp = await fetch("https://oauth.reddit.com/api/v1/access_token", {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + base64.encode(`${env.REDDIT_BOT_CLIENT_ID}:${env.REDDIT_BOT_CLIENT_SECRET}`),
      'User-Agent': 'RTypingBot/Indev by u/simpleauthority'
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: env.REDDIT_BOT_USERNAME,
      password: env.REDDIT_BOT_PASSWORD
    })
  })

  if (!tokenResp.ok) {
    return null
  }

  const resp = await tokenResp.json() as AccessTokenResponse

  const expiration = new Date()
  expiration.setTime(expiration.getTime() + (resp.expires_in * 1000))

  await env.KV.put("bot_token", resp.access_token, {
    metadata: {
      expiration: expiration.getTime()
    }
  })

  return resp.access_token
}

export default async function setRedditFlair(username: string, prevState: any, data: FormData) {
  const flair = data.get("flair-choice")
  if (!flair) {
    return {
      message: '',
      error: 'Flair not specified'
    }
  }

  const env = getRequestContext().env

  let token: string | null

  const { value, metadata } = await env.KV.getWithMetadata("bot_token")

  if (!value) {
    token = await fetchRedditToken(env)
  } else {
    const now = new Date().getTime()
    const expirationTime = metadata ? ((metadata as any).expiration as number) : now; // if there's no metadata, treat as expired
    const timeRemaining = expirationTime - now;
    const isExpired = timeRemaining < 1000 * 60 * 10 // 10 minutes
    if (isExpired) {
      token = await fetchRedditToken(env)
    } else {
      token = value
    }
  }

  if (!token) {
    return {
      message: '',
      error: "Failed to contact Reddit for authentication token. Please try again later."
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
      'User-Agent': 'RTypingBot/Indev by u/simpleauthority'
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