export const FabPosition = {
  Off: 'off',
  Left: 'left',
  Right: 'right',
} as const
export type FabPosition = (typeof FabPosition)[keyof typeof FabPosition]
