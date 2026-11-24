import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ulid } from 'ulid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type DeductionProfileFormInput, deductionProfileFormSchema } from '@/lib/schemas'
import { calcPeriodCost } from '@/lib/shared/subscription-utils'
import type { DeductionProfile, Subscription } from '@/lib/shared/types/subscription'

type Props = {
  profiles: Array<DeductionProfile>
  subscriptions: Array<Subscription>
  /** Persists the full list */
  onChange: (profiles: Array<DeductionProfile>) => Promise<void>
}

const FIELDS = [
  { name: 'vatRate', label: 'VAT rate', hint: 'Included in gross prices' },
  { name: 'vatRecoverable', label: 'VAT recovered', hint: '100 = full, 50 = half' },
  { name: 'incomeTaxRate', label: 'Income tax rate', hint: 'Lowered by the cost' },
  { name: 'extraRate', label: 'Extra rate', hint: 'e.g. health contribution' },
] as const

function describe(profile: DeductionProfile): string {
  // A 100-unit example makes the combined effect of all rates easy to read
  const example = calcPeriodCost(
    { id: 'x', name: '', amount: 100, currency: 'XXX', billingPeriodMonths: 1, priceIncludesVat: true, active: true },
    profile,
    1
  )
  return `VAT ${profile.vatRate}% (${profile.vatRecoverable}% back) · tax ${profile.incomeTaxRate + profile.extraRate}% · 100 → ${example.effective.toFixed(2)}`
}

function ProfileDialog({
  profile,
  onSave,
  onClose,
}: {
  profile?: DeductionProfile
  onSave: (data: DeductionProfileFormInput) => Promise<void>
  onClose: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeductionProfileFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(deductionProfileFormSchema as any),
    defaultValues: profile ?? { name: '', vatRate: 23, vatRecoverable: 100, incomeTaxRate: 19, extraRate: 0 },
  })

  async function onSubmit(data: DeductionProfileFormInput) {
    await onSave(data)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit deduction profile' : 'Add deduction profile'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="deduction-profile-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="ded-name">Name</Label>
            <Input id="ded-name" placeholder="Business (VAT + income tax)" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((field) => (
              <div key={field.name} className="space-y-1">
                <Label htmlFor={`ded-${field.name}`}>{field.label} (%)</Label>
                <Input
                  id={`ded-${field.name}`}
                  max="100"
                  min="0"
                  step="0.1"
                  type="number"
                  {...register(field.name, { valueAsNumber: true })}
                />
                {errors[field.name] ? (
                  <p className="text-destructive text-xs">{errors[field.name]?.message}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} form="deduction-profile-form" type="submit">
            {isSubmitting ? 'Saving...' : profile ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeductionProfileList({ profiles, subscriptions, onChange }: Props) {
  const [editing, setEditing] = useState<DeductionProfile | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<DeductionProfile | null>(null)
  const usage = (id: string) => subscriptions.filter((s) => s.deductionProfileId === id).length

  return (
    <div className="space-y-3">
      {profiles.length === 0 && (
        <p className="text-muted-foreground text-sm">No profiles yet. Add one to calculate the real cost of business subscriptions.</p>
      )}
      {profiles.map((profile) => (
        <div key={profile.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="text-muted-foreground text-xs">{describe(profile)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button aria-label="Edit profile" size="icon-sm" variant="ghost" onClick={() => setEditing(profile)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button aria-label="Delete profile" size="icon-sm" variant="ghost" onClick={() => setDeleting(profile)}>
              <Trash2 className="text-destructive size-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
        <Plus className="size-4" />
        Add profile
      </Button>
      {adding && (
        <ProfileDialog onClose={() => setAdding(false)} onSave={(data) => onChange([...profiles, { ...data, id: `ded_${ulid()}` }])} />
      )}
      {editing && (
        <ProfileDialog
          profile={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => onChange(profiles.map((p) => (p.id === editing.id ? { ...data, id: editing.id } : p)))}
        />
      )}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
          </DialogHeader>
          {deleting && usage(deleting.id) > 0 && (
            <p className="text-muted-foreground text-sm">
              {usage(deleting.id)} subscription{usage(deleting.id) === 1 ? '' : 's'} will be treated as private until you pick another
              profile.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return
                await onChange(profiles.filter((p) => p.id !== deleting.id))
                setDeleting(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
