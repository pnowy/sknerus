import { Shapes } from 'lucide-react'
import { IconPicker } from '@/components/icon-picker'
import { CATEGORY_ICONS } from '@/lib/shared/category-icons'
import type { Category } from '@/lib/shared/types/expense'

type Props = {
  category: Category
  onChange: (icon: string | undefined) => void
}

export function CategoryIconPicker({ category, onChange }: Props) {
  return (
    <IconPicker
      color={category.color}
      curated={CATEGORY_ICONS}
      allowNone
      placeholder={<Shapes className="size-3.5" />}
      tooltip={category.icon ? 'Change icon' : 'Choose icon'}
      triggerLabel={`Choose icon for ${category.name}`}
      value={category.icon}
      onChange={onChange}
    />
  )
}
