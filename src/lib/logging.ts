type LevelName = 'debug' | 'info' | 'warn' | 'error'

interface LogEntryMeta {
  durationMs?: number
  [k: string]: unknown
}

const levelOrder: Record<LevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const COLOR = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
}

const LOG_NAME_PAD = 16

let currentLevel: LevelName = (process.env.LOG_LEVEL as LevelName) || 'info'

export function setLogLevel(l: LevelName) {
  currentLevel = l
}

function ts() {
  return new Date().toISOString()
}

function colorFor(level: LevelName) {
  switch (level) {
    case 'debug':
      return COLOR.cyan
    case 'info':
      return COLOR.green
    case 'warn':
      return COLOR.yellow
    case 'error':
      return COLOR.red
  }
}

function log(level: LevelName, msg: string, meta?: LogEntryMeta) {
  if (levelOrder[level] < levelOrder[currentLevel]) return
  const base = `${COLOR.dim}${ts()}${COLOR.reset} ${colorFor(level)}${level.toUpperCase().padEnd(5)}${COLOR.reset}`
  let line = `${base} ${msg}`
  if (meta && Object.keys(meta).length) {
    const safeMeta = JSON.stringify(meta, (_k, v) => (v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v))
    line += ` ${COLOR.gray}${safeMeta}${COLOR.reset}`
  }
  // Use appropriate console method
  switch (level) {
    case 'debug':
      console.debug(line)
      break
    case 'info':
      console.info(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'error':
      console.error(line)
      break
  }
}

export const logger = {
  debug: (m: string, meta?: LogEntryMeta) => log('debug', m, meta),
  info: (m: string, meta?: LogEntryMeta) => log('info', m, meta),
  warn: (m: string, meta?: LogEntryMeta) => log('warn', m, meta),
  error: (m: string, meta?: LogEntryMeta) => log('error', m, meta),
  time<T>(label: string, fn: () => Promise<T> | T, extra?: LogEntryMeta): Promise<T> | T {
    const start = performance.now()
    const done = (ok: boolean) => {
      const durationMs = +(performance.now() - start).toFixed(2)
      logger[ok ? 'debug' : 'error'](`${label} completed`, {
        durationMs,
        ...extra,
      })
    }
    try {
      const result = fn()
      if (result instanceof Promise) {
        return result
          .then((r) => {
            done(true)
            return r
          })
          .catch((e) => {
            done(false)
            throw e
          })
      } else {
        done(true)
        return result
      }
    } catch (e) {
      done(false)
      throw e
    }
  },
  named(name: string) {
    return {
      debug: (m: string, meta?: LogEntryMeta) => log('debug', `[${name.padEnd(LOG_NAME_PAD)}] ${m}`, meta),
      info: (m: string, meta?: LogEntryMeta) => log('info', `[${name.padEnd(LOG_NAME_PAD)}] ${m}`, meta),
      warn: (m: string, meta?: LogEntryMeta) => log('warn', `[${name.padEnd(LOG_NAME_PAD)}] ${m}`, meta),
      error: (m: string, meta?: LogEntryMeta) => log('error', `[${name.padEnd(LOG_NAME_PAD)}] ${m}`, meta),
      time<T>(label: string, fn: () => Promise<T> | T, extra?: LogEntryMeta): Promise<T> | T {
        return logger.time(`[${name.padEnd(LOG_NAME_PAD)}] ${label}`, fn, extra)
      },
      named(sub: string) {
        return logger.named(`${name}:${sub}`)
      },
    }
  },
}

export type NamedLogger = ReturnType<typeof logger.named>

export function withLogging<TArgs extends { request: Request }>(name: string, handler: (args: TArgs) => Promise<Response> | Response) {
  return async (args: TArgs) => {
    const { request } = args
    const start = performance.now()
    logger.info(`${name} start`, { method: request.method, url: request.url })
    try {
      const res = await handler(args)
      const durationMs = +(performance.now() - start).toFixed(2)
      logger.info(`${name} ok`, { status: res.status, durationMs })
      return res
    } catch (err) {
      const durationMs = +(performance.now() - start).toFixed(2)
      logger.error(`${name} failed`, {
        durationMs,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }
}

// export const Route = createFileRoute("/api/something")({
//     server: {
//         handlers: {
//             GET: withLogging("webhook.GET", async () => {
//                 return json({status: "OK"})
//             })
//         }
//     }
// })
