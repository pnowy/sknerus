import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import type { CSSProperties, ReactElement } from 'react'

type Props = {
  name: string
  className?: string
  style?: CSSProperties
  'aria-label'?: string
  fallback?: () => ReactElement | null
}

// Default export so it can be code-split with React.lazy: the full lucide name map stays out of the main bundle
export default function DynamicLucideIcon({ name, fallback, ...props }: Props) {
  return <DynamicIcon aria-hidden={!props['aria-label']} fallback={fallback} name={name as IconName} {...props} />
}
