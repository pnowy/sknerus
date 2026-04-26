import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { logger } from '@/lib/logging.ts'

const log = logger.named('server')

log.info('Initializing server...')
export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
