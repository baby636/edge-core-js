import { makeReactNativeDisklet } from 'disklet'
import * as React from 'react'

import { defaultOnLog } from './core/log/log'
import { parseReply } from './core/login/login-fetch'
import { EdgeCoreBridge } from './io/react-native/react-native-webview'
import {
  EdgeContext,
  EdgeContextOptions,
  EdgeFakeUser,
  EdgeFakeWorld,
  EdgeFetchOptions,
  EdgeFetchResponse,
  EdgeLoginMessages,
  EdgeNativeIo,
  EdgeOnLog,
  NetworkError
} from './types/types'
import { timeout } from './util/promise'

export { makeFakeIo } from './core/fake/fake-io'
export * from './types/types'

// @ts-ignore `window` doesn't exist in React Native
const global: any = typeof window !== 'undefined' ? window : {}

function onErrorDefault(e: any): void {
  console.error(e)
}

export function MakeEdgeContext(props: {
  debug?: boolean
  nativeIo?: EdgeNativeIo
  onError?: (e: any) => unknown
  onLoad: (context: EdgeContext) => unknown
  onLog?: EdgeOnLog
  options: EdgeContextOptions
}): React.ReactNode {
  const {
    debug,
    nativeIo,
    onError = onErrorDefault,
    onLoad,
    onLog = defaultOnLog
  } = props
  if (onLoad == null) {
    throw new TypeError('No onLoad passed to MakeEdgeContext')
  }

  return (
    <EdgeCoreBridge
      debug={debug}
      nativeIo={nativeIo}
      onError={onError}
      onLoad={(nativeIo, root) =>
        root.makeEdgeContext(nativeIo, props.options).then(onLoad)
      }
      onLog={onLog}
    />
  )
}

export function MakeFakeEdgeWorld(props: {
  debug?: boolean
  nativeIo?: EdgeNativeIo
  onError?: (e: any) => unknown
  onLoad: (world: EdgeFakeWorld) => unknown
  onLog?: EdgeOnLog
  users?: EdgeFakeUser[]
}): React.ReactNode {
  const {
    debug,
    nativeIo,
    onError = onErrorDefault,
    onLoad,
    onLog = defaultOnLog
  } = props
  if (onLoad == null) {
    throw new TypeError('No onLoad passed to MakeFakeEdgeWorld')
  }

  return (
    <EdgeCoreBridge
      debug={debug}
      nativeIo={nativeIo}
      onError={onError}
      onLoad={(nativeIo, root) =>
        root.makeFakeEdgeWorld(nativeIo, props.users).then(onLoad)
      }
      onLog={onLog}
    />
  )
}

/**
 * Fetches any login-related messages for all the users on this device.
 */
export async function fetchLoginMessages(
  apiKey: string
): Promise<EdgeLoginMessages> {
  const disklet = makeReactNativeDisklet()

  // Load the login stashes from disk:
  const loginMap: { [loginId: string]: string } = {} // loginId -> username
  const listing = await disklet.list('logins')
  const files: string[] = await Promise.all(
    Object.keys(listing)
      .filter(path => listing[path] === 'file')
      .map(path => disklet.getText(path).catch(() => '{}'))
  )
  for (const text of files) {
    try {
      const { username, loginId } = JSON.parse(text)
      if (loginId == null || username == null) continue
      loginMap[loginId] = username
    } catch (e) {}
  }

  const uri = 'https://auth.airbitz.co/api/v2/messages'
  const opts: EdgeFetchOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Token ${apiKey}`
    },
    body: JSON.stringify({ loginIds: Object.keys(loginMap) })
  }

  const responsePromise: Promise<EdgeFetchResponse> = global.fetch(uri, opts)
  return timeout(
    responsePromise,
    30000,
    new NetworkError('Could not reach the auth server: timeout')
  ).then(response => {
    if (!response.ok) {
      throw new Error(`${uri} return status code ${response.status}`)
    }

    return response.json().then(json => {
      const reply = parseReply(json)
      const out: EdgeLoginMessages = {}
      for (const message of reply) {
        const username = loginMap[message.loginId]
        if (username != null) out[username] = message
      }
      return out
    })
  })
}
