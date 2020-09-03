import { makeLocalBridge } from 'yaob'

import { makeContext, makeFakeWorld } from './core/core'
import { defaultOnLog } from './core/log/log'
import { makeNodeIo } from './io/node/node-io'
import {
  EdgeContext,
  EdgeContextOptions,
  EdgeFakeUser,
  EdgeFakeWorld,
  EdgeFakeWorldOptions
} from './types/types'

export { makeNodeIo }
export {
  addEdgeCorePlugins,
  closeEdge,
  lockEdgeCorePlugins,
  makeFakeIo
} from './core/core'
export * from './types/types'

export function makeEdgeContext(
  opts: EdgeContextOptions
): Promise<EdgeContext> {
  const { onLog = defaultOnLog, path = './edge' } = opts
  return makeContext({ io: makeNodeIo(path), nativeIo: {}, onLog }, opts)
}

export function makeFakeEdgeWorld(
  users: EdgeFakeUser[] = [],
  opts: EdgeFakeWorldOptions = {}
): Promise<EdgeFakeWorld> {
  const { onLog = defaultOnLog } = opts
  return Promise.resolve(
    makeLocalBridge(
      makeFakeWorld({ io: makeNodeIo('.'), nativeIo: {}, onLog }, users),
      { cloneMessage: message => JSON.parse(JSON.stringify(message)) }
    )
  )
}
