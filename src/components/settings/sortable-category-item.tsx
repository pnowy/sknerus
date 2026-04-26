import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Dices, GripVertical, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '../../lib/shared/types/expense'

function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`
}

type Props = {
  category: Category
  onDelete: (name: string) => void
  onColorChange: (name: string, color: string) => void
}

export function SortableCategoryItem({ category, onDelete, onColorChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.name })
  const colorInputRef = useRef<HTMLInputElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2" style={style}>
      <button
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        aria-label={`Change color for ${category.name}`}
        className="size-5 shrink-0 rounded-full border-2 border-black/20 transition-transform hover:scale-110 dark:border-white/20"
        style={{ backgroundColor: category.color }}
        type="button"
        onClick={() => colorInputRef.current?.click()}
      />
      <input
        ref={colorInputRef}
        aria-label={`Color picker for ${category.name}`}
        className="sr-only"
        type="color"
        value={category.color}
        onChange={(e) => onColorChange(category.name, e.target.value)}
      />
      <Button
        aria-label="Random color"
        className="size-7 text-muted-foreground"
        size="icon-sm"
        variant="ghost"
        onClick={() => onColorChange(category.name, randomColor())}
      >
        <Dices className="size-3.5" />
      </Button>
      <span className="flex-1 text-sm">{category.name}</span>
      <Button
        aria-label={`Delete ${category.name}`}
        className="size-7"
        size="icon-sm"
        variant="ghost"
        onClick={() => onDelete(category.name)}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  )
}
