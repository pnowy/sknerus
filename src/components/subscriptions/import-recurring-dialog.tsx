import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useImportRecurringSubscriptions } from '@/hooks/use-subscriptions'
import { formatCurrency } from '@/lib/shared/format'
import { formatBillingPeriod, isConvertibleRecurring, recurringPeriodMonths } from '@/lib/shared/subscription-utils'
import type { RecurringExpense } from '@/lib/shared/types/expense'
import type { DeductionProfile, Subscription } from '@/lib/shared/types/subscription'
import { cn } from '@/lib/utils'

type Props = {
  recurring: Array<RecurringExpense>
  subscriptions: Array<Subscription>
  profiles: Array<DeductionProfile>
  onClose: () => void
}

export function ImportRecurringDialog({ recurring, subscriptions, profiles, onClose }: Props) {
  const importRecurring = useImportRecurringSubscriptions()
  const linked = new Set(subscriptions.map((s) => s.recurringId))
  const candidates = recurring.filter((r) => r.amount < 0 && !linked.has(r.id))
  const [selected, setSelected] = useState<Set<string>>(() => new Set(candidates.filter(isConvertibleRecurring).map((r) => r.id)))
  const [profileId, setProfileId] = useState('')

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleImport() {
    try {
      const { created } = await importRecurring.mutateAsync({ recurringIds: [...selected], deductionProfileId: profileId || undefined })
      toast.success(`Imported ${created} subscription${created === 1 ? '' : 's'}`)
      onClose()
    } catch {
      toast.error('Failed to import subscriptions')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from recurring</DialogTitle>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">All recurring expenses are already tracked as subscriptions.</p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {candidates.map((r) => {
                const convertible = isConvertibleRecurring(r)
                const months = recurringPeriodMonths(r)
                return (
                  <label
                    key={r.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm',
                      convertible ? 'cursor-pointer' : 'opacity-50'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        checked={selected.has(r.id)}
                        className="accent-primary size-4"
                        disabled={!convertible}
                        type="checkbox"
                        onChange={() => toggle(r.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="text-muted-foreground block text-xs">
                          {months ? formatBillingPeriod(months) : 'Unsupported period (daily/weekly)'}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatCurrency(Math.abs(r.amount), r.currency)}</span>
                  </label>
                )
              })}
            </div>
            {profiles.length > 0 && (
              <div className="space-y-1">
                <Label>Deduction profile for imported items</Label>
                <Select value={profileId} onValueChange={(v) => setProfileId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Private (no deductions)">
                      {(value: string) => profiles.find((p) => p.id === value)?.name ?? 'Private (no deductions)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Private (no deductions)</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={selected.size === 0 || importRecurring.isPending} onClick={handleImport}>
            {importRecurring.isPending ? 'Importing…' : `Import ${selected.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
