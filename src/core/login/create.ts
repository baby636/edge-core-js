import { base64 } from 'rfc4648'

import {
  EdgeAccountOptions,
  EdgeWalletInfo,
  errorNames
} from '../../types/types'
import { encrypt } from '../../util/crypto/crypto'
import { ApiInput } from '../root-pixie'
import { makeKeysKit } from './keys'
import { loginFetch } from './login-fetch'
import { fixUsername, hashUsername } from './login-selectors'
import { saveStash } from './login-stash'
import { LoginKit, LoginTree } from './login-types'
import { makePasswordKit } from './password'
import { makeChangePin2Kit } from './pin2'

export interface LoginCreateOpts {
  keyInfo?: EdgeWalletInfo
  password?: string | undefined
  pin?: string | undefined
}

/**
 * Determines whether or not a username is available.
 */
export function usernameAvailable(
  ai: ApiInput,
  username: string
): Promise<boolean> {
  return hashUsername(ai, username).then(userId => {
    const request = {
      userId: base64.stringify(userId)
    }
    return loginFetch(ai, 'POST', '/v2/login', request)
      .then(reply => false) // It's not available if we can hit it!
      .catch(e => {
        if (e.name !== errorNames.UsernameError) throw e
        return true
      })
  })
}

/**
 * Assembles all the data needed to create a new login.
 */
export function makeCreateKit(
  ai: ApiInput,
  parentLogin: LoginTree | undefined,
  appId: string,
  username: string,
  opts: LoginCreateOpts
): Promise<LoginKit> {
  const { io } = ai.props

  // Figure out login identity:
  const loginId =
    parentLogin != null ? io.random(32) : hashUsername(ai, username)
  const loginKey = io.random(32)
  const loginAuth = io.random(32)
  const loginAuthBox = encrypt(io, loginAuth, loginKey)

  const dummyLogin: LoginTree = {
    appId,
    lastLogin: new Date(),
    loginId: '',
    loginKey,
    children: [],
    keyInfos: []
  }

  // Set up login methods:
  const dummyKit: LoginKit = {}
  const parentBox =
    parentLogin != null
      ? encrypt(io, loginKey, parentLogin.loginKey)
      : undefined
  const passwordKit: Promise<LoginKit> =
    opts.password != null
      ? makePasswordKit(ai, dummyLogin, username, opts.password)
      : Promise.resolve(dummyKit)
  const pin2Kit: LoginKit =
    opts.pin != null
      ? makeChangePin2Kit(ai, dummyLogin, username, opts.pin, true)
      : dummyKit
  const keysKit =
    opts.keyInfo != null ? makeKeysKit(ai, dummyLogin, opts.keyInfo) : dummyKit

  // Bundle everything:
  return Promise.all([loginId, passwordKit]).then(values => {
    const [loginIdRaw, passwordKit] = values
    const loginId = base64.stringify(loginIdRaw)
    return {
      loginId,
      serverPath: '/v2/login/create',
      server: {
        appId,
        loginAuth: base64.stringify(loginAuth),
        loginAuthBox,
        loginId,
        parentBox,
        ...passwordKit.server,
        ...pin2Kit.server,
        ...keysKit.server
      },
      stash: {
        appId,
        loginAuthBox,
        loginId,
        parentBox,
        ...passwordKit.stash,
        ...pin2Kit.stash,
        ...keysKit.stash
      },
      login: {
        appId,
        loginAuth,
        loginId,
        loginKey,
        keyInfos: [],
        ...passwordKit.login,
        ...pin2Kit.login,
        ...keysKit.login
      }
    }
  })
}

/**
 * Creates a new login on the auth server.
 */
export function createLogin(
  ai: ApiInput,
  username: string,
  accountOpts: EdgeAccountOptions,
  opts: LoginCreateOpts
): Promise<LoginTree> {
  const fixedName = fixUsername(username)
  const { now = new Date() } = accountOpts

  return makeCreateKit(ai, undefined, '', fixedName, opts).then(kit => {
    kit.login.username = fixedName
    kit.stash.username = fixedName
    kit.login.userId = kit.login.loginId

    const request = { data: kit.server }
    return loginFetch(ai, 'POST', kit.serverPath, request).then(reply => {
      kit.stash.lastLogin = now
      return saveStash(ai, kit.stash).then(() => kit.login)
    })
  })
}
