import { buildReducer, BuiltReducer, mapReducer } from 'redux-keto'

import { accountReducer, AccountState } from './account/account-reducer'
import { RootAction } from './actions'
import { currency, CurrencyState } from './currency/currency-reducer'
import { exchangeCache, ExchangeState } from './exchange/exchange-reducer'
import { login, LoginState } from './login/login-reducer'
import { plugins, PluginsState } from './plugins/plugins-reducer'
import { storageWallets, StorageWalletsState } from './storage/storage-reducer'

export interface RootState {
  readonly accountCount: number
  readonly accountIds: string[]
  readonly accounts: { [accountId: string]: AccountState }
  readonly hideKeys: boolean
  readonly lastAccountId: string

  readonly currency: CurrencyState
  readonly exchangeCache: ExchangeState
  readonly login: LoginState
  readonly paused: boolean
  readonly plugins: PluginsState
  readonly storageWallets: StorageWalletsState
}

export const reducer: BuiltReducer<RootState, RootAction> = buildReducer({
  accountCount(state = 0, action: RootAction): number {
    return action.type === 'LOGIN' ? state + 1 : state
  },

  accountIds(state = [], action: RootAction, next: RootState): string[] {
    switch (action.type) {
      case 'LOGIN':
        return [...state, next.lastAccountId]

      case 'LOGOUT': {
        const { accountId } = action.payload
        const out = state.filter(id => id !== accountId)
        if (out.length === state.length) {
          throw new Error(`Login ${accountId} does not exist`)
        }
        return out
      }

      case 'CLOSE':
        return []
    }
    return state
  },

  accounts: mapReducer(accountReducer, (next: RootState) => next.accountIds),

  hideKeys(state = true, action: RootAction): boolean {
    return action.type === 'INIT' ? action.payload.hideKeys : state
  },

  lastAccountId(state, action: RootAction, next: RootState): string {
    return `login${next.accountCount}`
  },

  paused(state = false, action: RootAction): boolean {
    return action.type === 'PAUSE' ? action.payload : state
  },

  currency,
  exchangeCache,
  login,
  plugins,
  storageWallets
})
