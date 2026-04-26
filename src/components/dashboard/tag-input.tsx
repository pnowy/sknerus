import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  value: Array<string>
  onChange: (tags: Array<string>) => void
  suggestions?: Array<string>
  placeholder?: string
}

export function TagInput({ value, onChange, suggestions = [], placeholder = 'Add tag...' }: Props) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s))

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
    setOpen(false)
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-9 flex-wrap gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm focus-within:ring-1 focus-within:ring-ring'
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} className="gap-1 pr-1" variant="secondary">
            {tag}
            <button
              aria-label={`Remove ${tag}`}
              className="rounded-full hover:bg-muted"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          className="h-auto min-w-20 flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
          placeholder={value.length === 0 ? placeholder : ''}
          value={input}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(e.target.value.length > 0)
          }}
          onFocus={() => setOpen(input.length > 0 || suggestions.length > 0)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {filtered.map((s) => (
            <li key={s} className="cursor-pointer px-3 py-1.5 text-sm hover:bg-muted" onMouseDown={() => addTag(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
