import { Disklet } from 'disklet'

import {
  EdgeContext,
  EdgeContextOptions,
  EdgeFakeUser,
  EdgeFakeWorld,
  EdgeFetchOptions,
  EdgeOnLog,
  EdgeScryptFunction
} from '../../types/types'
import { HttpResponse } from '../../util/http/http-types'

export interface ClientIo {
  readonly disklet: Disklet
  readonly onLog: EdgeOnLog

  readonly entropy: string // base64
  readonly scrypt: EdgeScryptFunction

  // Networking:
  fetchCors(url: string, opts: EdgeFetchOptions): Promise<HttpResponse>
}

export interface WorkerApi {
  makeEdgeContext(nativeIo: any, opts: EdgeContextOptions): Promise<EdgeContext>

  makeFakeEdgeWorld(
    nativeIo: any,
    users?: EdgeFakeUser[]
  ): Promise<EdgeFakeWorld>
}
