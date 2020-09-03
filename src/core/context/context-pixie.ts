import { combinePixies, stopUpdates, TamePixie } from 'redux-pixies'
import { close, update } from 'yaob'

import { EdgeContext } from '../../types/types'
import { ApiInput, RootProps } from '../root-pixie'
import { makeContextApi } from './context-api'

export interface ContextOutput {
  api: EdgeContext
}

export const context: TamePixie<RootProps> = combinePixies({
  api(ai: ApiInput) {
    return {
      destroy() {
        close(ai.props.output.context.api)
      },
      update() {
        ai.onOutput(makeContextApi(ai))
        return stopUpdates
      }
    }
  },

  watcher(ai: ApiInput) {
    let lastLocalUsers, lastPaused

    return () => {
      if (
        lastLocalUsers !== ai.props.state.login.localUsers ||
        lastPaused !== ai.props.state.paused
      ) {
        lastLocalUsers = ai.props.state.login.localUsers
        lastPaused = ai.props.state.paused
        if (ai.props.output.context.api) update(ai.props.output.context.api)
      }
    }
  }
})
