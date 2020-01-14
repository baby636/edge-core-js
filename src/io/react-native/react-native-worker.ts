import './polyfills'

import hashjs from 'hash.js'
import HmacDRBG from 'hmac-drbg'
import { base64 } from 'rfc4648'
import { Bridge, bridgifyObject } from 'yaob'

import {
  addEdgeCorePlugins,
  lockEdgeCorePlugins,
  makeContext,
  makeFakeWorld
} from '../../core/core'
import { EdgeFetchOptions, EdgeFetchResponse, EdgeIo } from '../../types/types'
import { makeFetchResponse } from '../../util/http/http-to-fetch'
import { ClientIo, WorkerApi } from './react-native-types'

// @ts-ignore `window` doesn't exist in React Native
const global: any = typeof window !== 'undefined' ? window : {}
const body = global.document.body

/**
 * Gently pulse the background color in debug mode,
 * to show that code is loaded & running.
 */
if (body != null && /debug=true/.test(window.location.search)) {
  const update = (): void => {
    const wave = Math.abs(((Date.now() / 2000) % 2) - 1)
    const color = 0x40 + 0x80 * wave
    body.style.backgroundColor = `rgb(${color}, ${color}, ${color})`

    setTimeout(update, 100)
  }
  update()
}

global.addEdgeCorePlugins = addEdgeCorePlugins
global.lockEdgeCorePlugins = lockEdgeCorePlugins

function makeIo(clientIo: ClientIo): EdgeIo {
  const { disklet, entropy, scrypt } = clientIo
  const csprng = new HmacDRBG({
    hash: hashjs.sha256,
    entropy: base64.parse(entropy)
  })

  return {
    console,
    disklet,

    random: bytes => csprng.generate(bytes),
    scrypt,

    // Networking:
    fetch(uri: string, opts?: EdgeFetchOptions): Promise<EdgeFetchResponse> {
      return global.fetch(uri, opts)
    },

    fetchCors(
      uri: string,
      opts: EdgeFetchOptions = {}
    ): Promise<EdgeFetchResponse> {
      return clientIo.fetchCors(uri, opts).then(makeFetchResponse)
    }
  }
}

const workerApi: WorkerApi = bridgifyObject({
  makeEdgeContext(nativeIo, opts) {
    const clientIo: ClientIo = nativeIo['edge-core']
    const { onLog } = clientIo

    return makeContext({ io: makeIo(clientIo), nativeIo, onLog }, opts)
  },

  makeFakeEdgeWorld(nativeIo, users = []) {
    const clientIo: ClientIo = nativeIo['edge-core']
    const { onLog } = clientIo

    return Promise.resolve(
      makeFakeWorld({ io: makeIo(clientIo), nativeIo, onLog }, users)
    )
  }
})

/**
 * Legacy WebView support.
 */
function oldSendRoot(): void {
  if (global.originalPostMessage != null) {
    const reactPostMessage = global.postMessage
    global.postMessage = global.originalPostMessage
    global.bridge = new Bridge({
      sendMessage: message => reactPostMessage(JSON.stringify(message))
    })
    global.bridge.sendRoot(workerApi)
  } else {
    setTimeout(oldSendRoot, 100)
  }
}

// Start the object bridge:
if (global.ReactNativeWebView != null) {
  global.bridge = new Bridge({
    sendMessage(message) {
      global.ReactNativeWebView.postMessage(JSON.stringify(message))
    }
  })
  global.bridge.sendRoot(workerApi)
} else {
  oldSendRoot()
}
