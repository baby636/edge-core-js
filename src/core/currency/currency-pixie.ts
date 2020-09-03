import { combinePixies, mapPixie, TamePixie } from 'redux-pixies'

import { RootProps } from '../root-pixie'
import {
  CurrencyWalletOutput,
  CurrencyWalletProps,
  walletPixie
} from './wallet/currency-wallet-pixie'

export interface CurrencyOutput {
  readonly wallets: { [walletId: string]: CurrencyWalletOutput }
}

export const currency: TamePixie<RootProps> = combinePixies({
  wallets: mapPixie(
    walletPixie,
    (props: RootProps) => props.state.currency.currencyWalletIds,
    (props: RootProps, id: string): CurrencyWalletProps => ({
      ...props,
      id,
      selfState: props.state.currency.wallets[id],
      selfOutput: props.output.currency.wallets[id]
    })
  )
})
