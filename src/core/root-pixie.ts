import { Dispatch } from 'redux'
import { combinePixies, PixieInput, TamePixie } from 'redux-pixies'

import { EdgeIo, EdgeLog, EdgeOnLog } from '../types/types'
import { AccountOutput, accounts } from './account/account-pixie'
import { RootAction } from './actions'
import { context, ContextOutput } from './context/context-pixie'
import { currency, CurrencyOutput } from './currency/currency-pixie'
import { exchange } from './exchange/exchange-pixie'
import { RootState } from './root-reducer'
import { scrypt, ScryptOutput } from './scrypt/scrypt-pixie'

// The top-level pixie output structure:
export interface RootOutput {
  readonly accounts: { [accountId: string]: AccountOutput }
  readonly context: ContextOutput
  readonly currency: CurrencyOutput
  readonly scrypt: ScryptOutput
}

// Props passed to the root pixie:
export interface RootProps {
  readonly close: () => void
  readonly dispatch: Dispatch<RootAction>
  readonly io: EdgeIo
  readonly log: EdgeLog
  readonly onError: (e: Error) => unknown
  readonly onLog: EdgeOnLog
  readonly output: RootOutput
  readonly state: RootState
}

export type ApiInput = PixieInput<RootProps>

export const rootPixie: TamePixie<RootProps> = combinePixies({
  accounts,
  context,
  currency,
  exchange,
  scrypt
})
