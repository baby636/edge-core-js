import crypto from 'crypto'
import { makeNodeDisklet } from 'disklet'
import fetch from 'node-fetch'

import { EdgeIo } from '../../types/types'
import { scrypt } from '../../util/crypto/scrypt'

/**
 * Creates the io resources needed to run the Edge core on node.js.
 *
 * @param {string} path Location where data should be written to disk.
 */
export function makeNodeIo(path: string): EdgeIo {
  return {
    // Crypto:
    random(bytes: number) {
      return crypto.randomBytes(bytes)
    },
    scrypt,

    // Local io:
    console,
    disklet: makeNodeDisklet(path),

    // Networking:
    fetch,
    fetchCors: fetch
  }
}
