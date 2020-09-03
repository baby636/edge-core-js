import {
  asArray,
  asBoolean,
  asDate,
  asObject,
  asOptional,
  asString,
  Cleaner
} from 'cleaners'

import {
  EdgeLoginMessage,
  EdgeLoginMessages,
  EdgePendingVoucher
} from '../../types/types'
import { ApiInput } from '../root-pixie'
import { loginFetch } from './login-fetch'

/**
 * Fetches any login-related messages for all the users on this device.
 */
export function fetchLoginMessages(ai: ApiInput): Promise<EdgeLoginMessages> {
  const stashes = ai.props.state.login.stashes

  const loginMap: { [loginId: string]: string } = {} // loginId -> username
  for (const username of Object.keys(stashes)) {
    const loginId = stashes[username].loginId
    if (loginId != null) loginMap[loginId] = username
  }

  const request = {
    loginIds: Object.keys(loginMap)
  }
  return loginFetch(ai, 'POST', '/v2/messages', request).then(reply => {
    const out: EdgeLoginMessages = {}
    for (const message of asLoginMessagesReply(reply)) {
      const username = loginMap[message.loginId]
      if (username != null) out[username] = message
    }
    return out
  })
}

const asPendingVoucher: Cleaner<EdgePendingVoucher> = asObject({
  voucherId: asString,
  activates: asDate,
  created: asDate,
  ip: asString,
  ipDescription: asString,
  deviceDescription: asOptional(asString)
})

const asLoginMessage: Cleaner<EdgeLoginMessage> = asObject({
  loginId: asString,
  otpResetPending: asOptional(asBoolean, false),
  pendingVouchers: asOptional(asArray(asPendingVoucher), []),
  recovery2Corrupt: asOptional(asBoolean, false)
})

const asLoginMessagesReply = asArray(asLoginMessage)
