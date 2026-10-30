import { Search, X } from 'lucide-react'
import { startTransition, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SEARCH_DEBOUNCE_MS = 150

type Props = {
  matchCount: number | null
  onSearchChange: (query: string) => void
  onClose: () => void
}

export function TableSearch({ matchCount, onSearchChange, onClose }: Props) {
  const [draft, setDraft] = useState('')

  // Keystrokes only re-render this input; the expensive table update is debounced and runs as an interruptible transition
  useEffect(() => {
    const commit = () => startTransition(() => onSearchChange(draft))
    if (draft === '') return commit()
    const timer = setTimeout(commit, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, onSearchChange])

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="relative w-full sm:max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          aria-label="Search transactions"
          autoFocus
          className="px-8"
          placeholder="Search name, notes, tags…"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            if (draft) setDraft('')
            else onClose()
          }}
        />
        {draft && (
          <Button
            aria-label="Clear search"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            size="icon-xs"
            variant="ghost"
            onClick={() => setDraft('')}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      {matchCount !== null && (
        <span className="text-muted-foreground text-sm">
          {matchCount} {matchCount === 1 ? 'match' : 'matches'} across all time
        </span>
      )}
    </div>
  )
}
