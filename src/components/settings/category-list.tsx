import type { DragEndEvent } from '@dnd-kit/core'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArchiveCategoryDialog } from '@/components/settings/archive-category-dialog'
import { SortableCategoryItem } from '@/components/settings/sortable-category-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getCategoryUsage } from '@/lib/shared/category-utils'
import type { Category, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { Subscription } from '@/lib/shared/types/subscription'
import { randomColor } from '@/lib/utils'

type Props = {
  categories: Array<Category>
  onChange: (categories: Array<Category>) => void
  onNameChange: (id: string, newName: string) => void
  currency: string
  expenses?: Array<Expense>
  recurring?: Array<RecurringExpense>
  subscriptions?: Array<Subscription>
}

export function CategoryList({ categories, onChange, onNameChange, currency, expenses = [], recurring = [], subscriptions = [] }: Props) {
  const [mounted, setMounted] = useState(false)
  const [archiving, setArchiving] = useState<Category | null>(null)
  const activeCategories = categories.filter((c) => !c.archived)
  const archivedCategories = categories.filter((c) => c.archived)
  const [newName, setNewName] = useState('')
  const [newIsIncome, setNewIsIncome] = useState(false)

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

  function handleToggleIncome(id: string) {
    onChange(categories.map((c) => (c.id === id ? { ...c, isIncome: !c.isIncome } : c)))
  }

  function handleIconChange(id: string, icon: string | undefined) {
    onChange(categories.map((c) => (c.id === id ? { ...c, icon } : c)))
  }

  function setArchived(id: string, archived: boolean) {
    onChange(categories.map((c) => (c.id === id ? { ...c, archived: archived || undefined } : c)))
  }

  function handleToggleArchived(id: string) {
    const category = categories.find((c) => c.id === id)
    if (!category) return
    if (category.archived) setArchived(id, false)
    else setArchiving(category)
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (trimmed && !categories.some((c) => c.name === trimmed)) {
      const id = `cat_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      onChange([...categories, { id, name: trimmed, color: randomColor(), ...(newIsIncome && { isIncome: true }) }])
      setNewName('')
      setNewIsIncome(false)
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-2">
        {activeCategories.map((cat) => (
          <div key={cat.id} className="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="size-5 shrink-0 rounded-full border-2 border-black/20" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm">{cat.name}</span>
            {cat.isIncome && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400">
                Income
              </Badge>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={activeCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {activeCategories.map((cat) => (
              <SortableCategoryItem
                key={cat.id}
                category={cat}
                onColorChange={handleColorChange}
                onDelete={handleDelete}
                onNameChange={onNameChange}
                onIconChange={handleIconChange}
                onToggleArchived={handleToggleArchived}
                onToggleIncome={handleToggleIncome}
              />
            ))}
          </div>
        </SortableContext>
        {archivedCategories.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Archived ({archivedCategories.length})</p>
            {archivedCategories.map((cat) => (
              <SortableCategoryItem
                key={cat.id}
                category={cat}
                onColorChange={handleColorChange}
                onDelete={handleDelete}
                onNameChange={onNameChange}
                onIconChange={handleIconChange}
                onToggleArchived={handleToggleArchived}
                onToggleIncome={handleToggleIncome}
              />
            ))}
          </div>
        )}
      </DndContext>
      <div className="flex items-center gap-2">
        <Input
          placeholder="New category..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Switch checked={newIsIncome} id="new-category-income" onCheckedChange={setNewIsIncome} />
          <Label htmlFor="new-category-income">Income</Label>
        </div>
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {archiving && (
        <ArchiveCategoryDialog
          category={archiving}
          currency={currency}
          usage={getCategoryUsage(archiving.id, expenses, recurring, subscriptions)}
          onClose={() => setArchiving(null)}
          onConfirm={() => {
            setArchived(archiving.id, true)
            setArchiving(null)
          }}
        />
      )}
    </div>
  )
}
