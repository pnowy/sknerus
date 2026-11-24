import { useQueryClient } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BACKUP_DOWNLOAD_URL, restoreBackup } from '@/lib/api'
import { type Backup, backupSchema } from '@/lib/schemas'
import { formatDate } from '@/lib/shared/format'

export function BackupSection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [restoring, setRestoring] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      // validated up front so the confirmation can show what the file contains
      setPending(backupSchema.parse(JSON.parse(await file.text())))
    } catch {
      toast.error('This file is not a valid Sknerus backup')
    }
  }

  async function confirmRestore() {
    if (!pending) return
    setRestoring(true)
    try {
      const summary = await restoreBackup(pending)
      await queryClient.invalidateQueries()
      toast.success(
        `Backup restored: ${summary.expenses} transactions, ${summary.subscriptions} subscriptions, ${summary.vehicles} vehicles`
      )
      setPending(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore backup')
    } finally {
      setRestoring(false)
    }
  }

  const counts = pending && [
    ['Transactions', pending.data.expenses.length],
    ['Categories', pending.data.config.categories.length],
    ['Recurring transactions', pending.data.recurring.length],
    ['Vehicles', pending.data.vehicles.length],
    ['Subscriptions', pending.data.subscriptions.length],
  ]

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        Everything in one file: settings, categories, transactions, recurring transactions, vehicles and subscriptions, with all links
        between them. The exchange-rate API key is not included.
      </p>
      <div className="flex flex-wrap gap-3">
        <a className={buttonVariants({ variant: 'outline' })} download href={BACKUP_DOWNLOAD_URL}>
          <Download className="size-4" />
          Download backup
        </a>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-4" />
          Restore backup
        </Button>
        <input ref={fileInputRef} accept="application/json,.json" className="hidden" type="file" onChange={handleFile} />
      </div>

      <Dialog open={!!pending} onOpenChange={(open) => !open && !restoring && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore backup?</DialogTitle>
            <DialogDescription>
              {pending && `Created ${formatDate(pending.exportedAt.slice(0, 10))}. `}
              All current data will be replaced by the backup. This cannot be undone — download a backup of the current data first if you
              may need it.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {counts?.map(([label, count]) => (
              <li key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button disabled={restoring} variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button disabled={restoring} variant="destructive" onClick={confirmRestore}>
              {restoring ? 'Restoring…' : 'Replace all data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
