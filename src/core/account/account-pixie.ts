import {
  combinePixies,
  filterPixie,
  mapPixie,
  PixieInput,
  stopUpdates,
  TamePixie
} from 'redux-pixies'
import { close, emit, update } from 'yaob'

import { EdgeAccount, EdgeCurrencyWallet } from '../../types/types'
import { waitForPlugins } from '../plugins/plugins-selectors'
import { ApiInput, RootProps } from '../root-pixie'
import { addStorageWallet, syncStorageWallet } from '../storage/storage-actions'
import { makeAccountApi } from './account-api'
import { loadAllWalletStates, reloadPluginSettings } from './account-files'
import { AccountState } from './account-reducer'

export interface AccountOutput {
  readonly api: EdgeAccount
  readonly currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
}

export type AccountProps = RootProps & {
  readonly id: string
  readonly selfState: AccountState
  readonly selfOutput: AccountOutput
}

export type AccountInput = PixieInput<AccountProps>

const accountPixie: TamePixie<AccountProps> = combinePixies({
  api(input: AccountInput) {
    return {
      destroy() {
        // The Pixie library stops updating props after destruction,
        // so we are stuck seeing the logged-in state. Fix that:
        const hack: any = input.props
        hack.state = { accounts: {} }

        if (
          input.props.selfOutput != null &&
          input.props.selfOutput.api != null
        ) {
          update(input.props.selfOutput.api)
          close(input.props.selfOutput.api)
          close(input.props.selfOutput.api.dataStore)
          close(input.props.selfOutput.api.exchangeCache)
          const currencies = input.props.selfOutput.api.currencyConfig
          for (const n of Object.keys(currencies)) close(currencies[n])
          const swaps = input.props.selfOutput.api.swapConfig
          for (const n of Object.keys(swaps)) close(swaps[n])
        }
      },

      async update() {
        const ai: ApiInput = input as any // Safe, since input extends ApiInput
        const accountId = input.props.id
        const { log } = input.props
        const { accountWalletInfos } = input.props.selfState

        async function loadAllFiles(): Promise<void> {
          await Promise.all([
            reloadPluginSettings(ai, accountId),
            loadAllWalletStates(ai, accountId)
          ])
        }

        try {
          // Wait for the currency plugins (should already be loaded by now):
          await waitForPlugins(ai)
          log('Login: currency plugins exist')

          // Start the repo:
          await Promise.all(
            accountWalletInfos.map(info => addStorageWallet(ai, info))
          )
          log('Login: synced account repos')

          await loadAllFiles()
          log('Login: loaded files')

          // Create the API object:
          input.onOutput(makeAccountApi(ai, accountId))
          log('Login: complete')
        } catch (error) {
          input.props.dispatch({
            type: 'ACCOUNT_LOAD_FAILED',
            payload: { accountId, error }
          })
        }

        return stopUpdates
      }
    }
  },

  // Starts & stops the sync timer for this account:
  syncTimer: filterPixie(
    (input: AccountInput) => {
      let started: boolean = false
      let stopped: boolean = false
      let timeout: ReturnType<typeof setTimeout> | undefined

      function doSync(): void {
        const ai: ApiInput = input as any // Safe, since input extends ApiInput
        const accountId = input.props.id
        const { accountWalletInfos } = input.props.selfState

        async function innerSync(): Promise<void> {
          if (input.props.state.accounts[accountId] == null) return
          const changeLists = await Promise.all(
            accountWalletInfos.map(info => syncStorageWallet(ai, info.id))
          )
          const changes: string[] = [].concat(...changeLists)
          if (changes.length) {
            await Promise.all([
              reloadPluginSettings(ai, accountId),
              loadAllWalletStates(ai, accountId)
            ])
          }
        }
        // We don't report sync failures, since that could be annoying.
        innerSync().catch(e => {})

        if (!stopped) timeout = setTimeout(doSync, 30 * 1000)
      }

      return {
        update() {
          if (
            !started &&
            input.props.selfOutput &&
            input.props.selfOutput.api
          ) {
            started = true
            doSync()
          }
        },

        destroy() {
          stopped = true
          if (timeout != null) clearTimeout(timeout)
        }
      }
    },
    props => (props.state.paused ? undefined : props)
  ),

  watcher(input: AccountInput) {
    let lastState
    // let lastWallets
    let lastExchangeState

    return () => {
      const { selfState, selfOutput } = input.props
      if (selfState == null || selfOutput == null) return

      // TODO: Remove this once update detection is reliable:
      if (selfOutput.api != null) update(selfOutput.api)

      // General account state:
      if (lastState !== selfState) {
        lastState = selfState
        if (selfOutput.api != null) {
          // TODO: Put this back once we solve the race condition:
          // update(selfOutput.api)
          for (const pluginId in selfOutput.api.currencyConfig) {
            update(selfOutput.api.currencyConfig[pluginId])
          }
          for (const pluginId in selfOutput.api.swapConfig) {
            update(selfOutput.api.swapConfig[pluginId])
          }
        }
      }

      // Wallet list:
      // TODO: Why don't we always detect `currencyWallets` updates?
      // if (lastWallets !== input.props.output.currency.wallets) {
      //   lastWallets = input.props.output.currency.wallets
      //   if (selfOutput.api != null) update(selfOutput.api)
      // }

      // Exchange:
      if (lastExchangeState !== input.props.state.exchangeCache) {
        lastExchangeState = input.props.state.exchangeCache
        if (selfOutput.api != null) {
          emit(selfOutput.api.exchangeCache, 'update', undefined)
        }
      }
    }
  },

  currencyWallets(input: AccountInput) {
    let lastActiveWalletIds

    return () => {
      const { activeWalletIds } = input.props.selfState
      let dirty = lastActiveWalletIds !== activeWalletIds
      lastActiveWalletIds = activeWalletIds

      let lastOut = {}
      if (input.props.selfOutput && input.props.selfOutput.currencyWallets) {
        lastOut = input.props.selfOutput.currencyWallets
      }

      const out = {}
      for (const walletId of activeWalletIds) {
        if (
          input.props.output.currency.wallets[walletId] != null &&
          input.props.output.currency.wallets[walletId].api != null
        ) {
          const api = input.props.output.currency.wallets[walletId].api
          if (api !== lastOut[walletId]) dirty = true
          out[walletId] = api
        }
      }

      if (dirty) input.onOutput(out)
    }
  }
})

export const accounts: TamePixie<RootProps> = mapPixie(
  accountPixie,
  (props: RootProps) => props.state.accountIds,
  (props: RootProps, id: string): AccountProps => ({
    ...props,
    id,
    selfState: props.state.accounts[id],
    selfOutput: props.output.accounts[id]
  })
)
