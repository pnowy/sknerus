import { NamedIcon } from '@/components/named-icon'
import { CATEGORY_ICONS } from '@/lib/shared/category-icons'
import type { Category } from '@/lib/shared/types/expense'
import { cn } from '@/lib/utils'

type Props = {
  category: Pick<Category, 'color' | 'icon'>
  /** Size of the plain color dot; the icon is drawn slightly larger to match its visual weight */
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryMarker({ category, size = 'sm', className }: Props) {
  const dot = (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 rounded-sm', size === 'sm' ? 'size-2.5' : 'size-3', className)}
      style={{ backgroundColor: category.color }}
    />
  )
  if (!category.icon) return dot
  return (
    <NamedIcon
      className={cn('shrink-0', size === 'sm' ? 'size-3.5' : 'size-4', className)}
      curated={CATEGORY_ICONS}
      fallback={dot}
      name={category.icon}
      style={{ color: category.color }}
    />
  )
}
