import { fixUsername } from '../../client-side'
import { ApiInput } from '../root-pixie'
import { scrypt, userIdSnrp } from '../scrypt/scrypt-selectors'
import { LoginStash } from './login-stash'

export { fixUsername }

/**
 * Finds the login stash for the given username.
 * Returns a default object if
 */
export function getStash(ai: ApiInput, username: string): LoginStash {
  const fixedName = fixUsername(username)
  const { stashes } = ai.props.state.login

  if (stashes[fixedName] != null) return stashes[fixedName]
  return { username: fixedName, appId: '', loginId: '' }
}

// Hashed username cache:
const userIdCache = {}

/**
 * Hashes a username into a userId.
 */
export function hashUsername(
  ai: ApiInput,
  username: string
): Promise<Uint8Array> {
  const fixedName = fixUsername(username)
  if (userIdCache[fixedName] == null) {
    userIdCache[fixedName] = scrypt(ai, fixedName, userIdSnrp)
  }
  return userIdCache[fixedName]
}
