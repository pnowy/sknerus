import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Dices, GripVertical, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Category } from '@/lib/shared/types/expense.ts'

function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`
}

type Props = {
  category: Category
  onDelete: (name: string) => void
  onColorChange: (name: string, color: string) => void
  onNameChange: (oldName: string, newName: string) => void
}

export function SortableCategoryItem({ category, onDelete, onColorChange, onNameChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.name })
  const colorInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== category.name) {
      onNameChange(category.name, trimmed)
    } else {
      setDraft(category.name)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setDraft(category.name)
      setEditing(false)
    }
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

      {editing ? (
        <Input
          autoFocus
          className="h-7 flex-1 px-1 text-sm"
          value={draft}
          onBlur={commitEdit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          className="flex-1 cursor-text text-left text-sm hover:text-foreground/70"
          title="Click to rename"
          type="button"
          onClick={() => {
            setDraft(category.name)
            setEditing(true)
          }}
        >
          {category.name}
        </button>
      )}

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
