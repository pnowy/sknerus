import { Ban, Search } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { type IconComponent, NamedIcon } from '@/components/named-icon'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MAX_SEARCH_RESULTS = 96

type Props = {
  value: string | undefined
  color: string
  /** Icons shown before searching; the search covers the full lucide library */
  curated: Record<string, IconComponent>
  onChange: (icon: string | undefined) => void
  triggerLabel: string
  tooltip: string
  /** What the trigger shows when no icon is set */
  placeholder: ReactNode
  /** Adds a first "No icon" cell that clears the value */
  allowNone?: boolean
}

export function IconPicker({ value, color, curated, onChange, triggerLabel, tooltip, placeholder, allowNone = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [allNames, setAllNames] = useState<Array<string> | null>(null)

  // spaces and dashes are ignored, so "hour glass", "credit card" and "creditcard" all match
  const normalized = query.toLowerCase().replace(/[\s-]+/g, '')
  const results = useMemo(() => {
    if (!normalized || !allNames) return []
    const compact = (name: string) => name.replace(/-/g, '')
    const matches = allNames.filter((name) => compact(name).includes(normalized))
    // names starting with the query first, so "car" ranks "car" above "credit-card"
    return matches
      .sort((a, b) => Number(!compact(a).startsWith(normalized)) - Number(!compact(b).startsWith(normalized)))
      .slice(0, MAX_SEARCH_RESULTS)
  }, [normalized, allNames])

  function handleQueryChange(next: string) {
    setQuery(next)
    if (!allNames) void import('lucide-react/dynamic').then((m) => setAllNames(m.iconNames))
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQuery('')
  }

  function pick(icon: string | undefined) {
    onChange(icon)
    handleOpenChange(false)
  }

  const cellClass = (selected: boolean) =>
    cn('hover:bg-muted flex size-8 items-center justify-center rounded-md', selected && 'ring-primary ring-2 ring-inset')
  const iconStyle = { color }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <PopoverTrigger
              aria-label={triggerLabel}
              className="hover:bg-muted text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
            >
              {value ? (
                <NamedIcon className="size-4" curated={curated} fallback={placeholder} name={value} style={iconStyle} />
              ) : (
                placeholder
              )}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="start" className="w-[19rem] max-w-none space-y-2 p-2" side="bottom">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
          <Input
            aria-label="Search all icons"
            className="h-8 pl-7 text-sm"
            placeholder="Search all icons…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>

        {normalized ? (
          !allNames ? (
            <p className="text-muted-foreground py-4 text-center text-xs">Loading icons…</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">No icons match “{query.trim()}”</p>
          ) : (
            <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto">
              {results.map((name) => (
                <button
                  key={name}
                  aria-label={`Icon ${name}`}
                  className={cellClass(value === name)}
                  title={name}
                  type="button"
                  onClick={() => pick(name)}
                >
                  <NamedIcon
                    className="size-4"
                    curated={{}}
                    fallback={<span className="bg-muted size-4 rounded-sm" />}
                    name={name}
                    style={iconStyle}
                  />
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {allowNone && (
              <button aria-label="No icon" className={cellClass(!value)} title="No icon" type="button" onClick={() => pick(undefined)}>
                <Ban className="text-muted-foreground size-4" />
              </button>
            )}
            {Object.entries(curated).map(([key, Icon]) => (
              <button
                key={key}
                aria-label={`Icon ${key}`}
                className={cellClass(value === key)}
                title={key}
                type="button"
                onClick={() => pick(key)}
              >
                <Icon className="size-4" style={iconStyle} />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
