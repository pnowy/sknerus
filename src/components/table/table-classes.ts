// Long names wrap up to two lines (full name in a tooltip) and tags wrap, so neither stretches the table
// (table cells default to whitespace-nowrap)
export const NAME_TEXT_CLASS = 'min-w-40 max-w-md'
export const TAGS_CELL_CLASS = 'min-w-28 whitespace-normal'

// Keeps row actions visible when the table still overflows horizontally.
// The row needs the `group` class so the pinned cell follows the row hover background.
export const ACTIONS_CELL_CLASS =
  'sticky right-0 bg-background group-hover:bg-[color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))]'
