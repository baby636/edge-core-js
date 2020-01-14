import { makeLocalStorageDisklet } from 'disklet'

import { EdgeFetchOptions, EdgeFetchResponse, EdgeIo } from '../../types/types'
import { scrypt } from '../../util/crypto/scrypt'

// @ts-ignore `window` doesn't exist in React Native
const global: any = typeof window !== 'undefined' ? window : {}

/**
 * Extracts the io functions we need from the browser.
 */
export function makeBrowserIo(): EdgeIo {
  if (
    global.crypto == null ||
    typeof global.crypto.getRandomValues !== 'function'
  ) {
    throw new Error('No secure random number generator in this browser')
  }

  return {
    // Crypto:
    random: size => {
      const out = new Uint8Array(size)
      global.crypto.getRandomValues(out)
      return out
    },
    scrypt,

    // Local io:
    console,
    disklet: makeLocalStorageDisklet(global.localStorage, {
      prefix: 'airbitz'
    }),

    // Networking:
    fetch(uri: string, opts?: EdgeFetchOptions): Promise<EdgeFetchResponse> {
      return global.fetch(uri, opts)
    }
  }
}
