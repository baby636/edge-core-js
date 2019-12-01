import {
  EdgeCorePluginsInit,
  EdgeCurrencyPlugin,
  EdgeCurrencyTools,
  EdgePluginMap,
  EdgeRatePlugin,
  EdgeSwapPlugin
} from '../../types/types'
import { RootAction } from '../actions'

export interface PluginsState {
  readonly init: EdgeCorePluginsInit
  readonly locked: boolean

  readonly currency: EdgePluginMap<EdgeCurrencyPlugin>
  readonly rate: EdgePluginMap<EdgeRatePlugin>
  readonly swap: EdgePluginMap<EdgeSwapPlugin>

  readonly currencyTools: EdgePluginMap<Promise<EdgeCurrencyTools>>
}

const initialState: PluginsState = {
  init: {},
  locked: false,
  currency: {},
  rate: {},
  swap: {},
  currencyTools: {}
}

export const plugins = (
  state: PluginsState = initialState,
  action: RootAction
): PluginsState => {
  switch (action.type) {
    case 'CORE_PLUGINS_ADDED': {
      const out = {
        ...state,
        currency: { ...state.currency },
        rate: { ...state.rate },
        swap: { ...state.swap }
      }
      for (const pluginId in action.payload) {
        const plugin = action.payload[pluginId]
        // $FlowFixMe - Flow doesn't see the type refinement here:
        if (plugin.currencyInfo != null) out.currency[pluginId] = plugin
        // $FlowFixMe
        if (plugin.rateInfo != null) out.rate[pluginId] = plugin
        // $FlowFixMe
        if (plugin.swapInfo != null) out.swap[pluginId] = plugin
      }
      return out
    }
    case 'CORE_PLUGINS_LOCKED':
      return { ...state, locked: true }
    case 'CURRENCY_TOOLS_LOADED': {
      const currencyTools = { ...state.currencyTools }
      currencyTools[action.payload.pluginId] = action.payload.tools
      return { ...state, currencyTools }
    }
    case 'INIT':
      return { ...state, init: action.payload.pluginsInit }
  }
  return state
}
