import { backupSchema } from '@/lib/schemas'
import { handleErrors, jsonResponse, readJson } from '@/lib/server/api/http'
import { exportBackup, restoreBackup } from '@/lib/server/services/backup.service'
import { todayISO } from '@/lib/shared/date-utils'

export const exportBackupHandler = handleErrors(async () =>
  jsonResponse(await exportBackup(), 200, {
    'Content-Disposition': `attachment; filename="sknerus-backup-${todayISO()}.json"`,
  })
)

export const restoreBackupHandler = handleErrors(async (request: Request) => {
  const parsed = backupSchema.parse(await readJson(request))
  return jsonResponse(await restoreBackup(parsed))
})
