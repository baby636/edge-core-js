import { Disklet } from 'disklet'
import { Bridgeable, bridgifyObject, close, emit, update } from 'yaob'

import { EdgeContext } from '../../types/types'
import {
  fetchLobbyRequest,
  LobbyInstance,
  LobbyRequest,
  makeLobby,
  sendLobbyReply
} from '../login/lobby'
import { loginFetch } from '../login/login-fetch'
import { hashUsername } from '../login/login-selectors'
import { ApiInput } from '../root-pixie'
import { makeRepoPaths, syncRepo, SyncResult } from '../storage/repo'

/**
 * The requesting side of an Edge login lobby.
 * The `replies` property will update as replies come in.
 */
class EdgeLobby extends Bridgeable<
  {
    replies: unknown[]
    lobbyId: string
  },
  { error: Error }
> {
  _lobby: LobbyInstance
  _onError: Function
  _onRepliesChanged: Function
  _replies: unknown[]
  _unsubscribe: Function

  constructor(lobby: LobbyInstance) {
    super()
    this._lobby = lobby
    this._onError = () => undefined
    this._onRepliesChanged = () => undefined
    this._replies = []

    const { unsubscribe } = lobby.subscribe(
      (reply: unknown) => {
        this._replies = [...this._replies, reply]
        update(this)
      },
      (e: Error) => {
        emit(this, 'error', e)
      }
    )
    this._unsubscribe = unsubscribe
  }

  get lobbyId(): string {
    return this._lobby.lobbyId
  }

  get replies(): unknown[] {
    return this._replies
  }

  close(): void {
    this._unsubscribe()
    close(this)
  }
}

/**
 * A secret internal API which has some goodies for the CLI
 * and for unit testing.
 */
export class EdgeInternalStuff extends Bridgeable<{}> {
  _ai: ApiInput

  constructor(ai: ApiInput) {
    super()
    this._ai = ai
  }

  authRequest(method: string, path: string, body?: {}): Promise<any> {
    return loginFetch(this._ai, method, path, body)
  }

  hashUsername(username: string): Promise<Uint8Array> {
    return hashUsername(this._ai, username)
  }

  async makeLobby(
    lobbyRequest: LobbyRequest,
    period: number = 1000
  ): Promise<EdgeLobby> {
    const lobby = await makeLobby(this._ai, lobbyRequest, period)
    return new EdgeLobby(lobby)
  }

  fetchLobbyRequest(lobbyId: string): Promise<LobbyRequest> {
    return fetchLobbyRequest(this._ai, lobbyId)
  }

  async sendLobbyReply(
    lobbyId: string,
    lobbyRequest: LobbyRequest,
    replyData: unknown
  ): Promise<void> {
    await sendLobbyReply(this._ai, lobbyId, lobbyRequest, replyData)
  }

  async syncRepo(syncKey: Uint8Array): Promise<SyncResult> {
    const { io, log } = this._ai.props
    const paths = makeRepoPaths(io, syncKey, new Uint8Array(0))
    return syncRepo(io, log, paths, { lastSync: 0, lastHash: undefined })
  }

  async getRepoDisklet(
    syncKey: Uint8Array,
    dataKey: Uint8Array
  ): Promise<Disklet> {
    const { io } = this._ai.props
    const paths = makeRepoPaths(io, syncKey, dataKey)
    bridgifyObject(paths.disklet)
    return paths.disklet
  }
}

/**
 * Our public Flow types don't include the internal stuff,
 * so this function hacks around Flow to retrieve it.
 */
export function getInternalStuff(context: EdgeContext): EdgeInternalStuff {
  const flowHack: any = context
  return flowHack.$internalStuff
}
