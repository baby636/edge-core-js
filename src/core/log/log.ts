import {
  EdgeConsole,
  EdgeLog,
  EdgeLogEvent,
  EdgeLogMethod,
  EdgeOnLog
} from '../../types/types'
import { addHiddenProperties } from '../../util/util'

function makeLogMethod(
  onLog: EdgeOnLog,
  type: EdgeLogEvent['type'],
  source: string
): EdgeLogMethod {
  return function log() {
    let message = ''
    for (let i = 0; i < arguments.length; ++i) {
      const arg = arguments[i]
      if (i > 0) message += ' '
      message += typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
    }

    onLog({ message, source, time: new Date(), type })
  }
}

export function defaultOnLog(event: EdgeLogEvent): void {
  const prettyDate = event.time
    .toISOString()
    .replace(/.*(\d\d-\d\d)T(\d\d:\d\d:\d\d).*/, '$1 $2')
  console.info(`${prettyDate} ${event.source}: ${event.message}`)
}

export function makeLog(onLog: EdgeOnLog, source: string): EdgeLog {
  return addHiddenProperties(makeLogMethod(onLog, 'info', source), {
    warn: makeLogMethod(onLog, 'warn', source),
    error: makeLogMethod(onLog, 'error', source)
  })
}

export function makeLegacyConsole(onLog: EdgeOnLog): EdgeConsole {
  const log = makeLog(onLog, 'console')
  return {
    info(...args) {
      return log(...args)
    },
    error(...args) {
      return log.error(...args)
    },
    warn(...args) {
      return log.warn(...args)
    }
  }
}
