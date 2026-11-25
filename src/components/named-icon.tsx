import { type ComponentType, type CSSProperties, lazy, type ReactNode, Suspense, type SVGProps } from 'react'

const DynamicLucideIcon = lazy(() => import('@/components/dynamic-lucide-icon'))

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type Props = {
  /** Key of `curated`, or any lucide kebab-case icon name loaded on demand */
  name: string
  curated: Record<string, IconComponent>
  className?: string
  style?: CSSProperties
  'aria-label'?: string
  /** Shown while a lucide icon loads and when the name doesn't exist */
  fallback?: ReactNode
}

export function NamedIcon({ name, curated, fallback = null, ...props }: Props) {
  const Curated = curated[name]
  if (Curated) return <Curated aria-hidden={!props['aria-label']} {...props} />
  return (
    <Suspense fallback={fallback}>
      <DynamicLucideIcon fallback={() => <>{fallback}</>} name={name} {...props} />
    </Suspense>
  )
}
