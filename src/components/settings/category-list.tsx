import type { DragEndEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SortableCategoryItem } from '@/components/settings/sortable-category-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Category } from '@/lib/shared/types/expense'
import { randomColor } from '@/lib/utils'

type Props = {
  categories: Array<Category>
  onChange: (categories: Array<Category>) => void
  onNameChange: (id: string, newName: string) => void
}

export function CategoryList({ categories, onChange, onNameChange }: Props) {
  const [mounted, setMounted] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => setMounted(true), [])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = categories.findIndex((c) => c.id === active.id)
      const newIdx = categories.findIndex((c) => c.id === over.id)
      onChange(arrayMove(categories, oldIdx, newIdx))
    }
  }

  function handleDelete(id: string) {
    onChange(categories.filter((c) => c.id !== id))
  }

  function handleColorChange(id: string, color: string) {
    onChange(categories.map((c) => (c.id === id ? { ...c, color } : c)))
  }

  function handleToggleExcludeFromBudget(id: string, value: boolean) {
    onChange(categories.map((c) => (c.id === id ? { ...c, excludeFromBudget: value || undefined } : c)))
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (trimmed && !categories.some((c) => c.name === trimmed)) {
      const id = `cat_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      onChange([...categories, { id, name: trimmed, color: randomColor() }])
      setNewName('')
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <span className="size-5 shrink-0 rounded-full border-2 border-black/20" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm">{cat.name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {categories.map((cat) => (
              <SortableCategoryItem
                key={cat.id}
                category={cat}
                onColorChange={handleColorChange}
                onDelete={handleDelete}
                onNameChange={onNameChange}
                onToggleExcludeFromBudget={handleToggleExcludeFromBudget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <Input
          placeholder="New category..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  )
}
