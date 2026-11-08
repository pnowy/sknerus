import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/api'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await login(token)
      await navigate({ to: '/' })
    } catch {
      toast.error('Invalid API token')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form className="w-full max-w-sm space-y-4 rounded-lg border p-6" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-muted-foreground text-sm">Enter the API token configured for this Sknerus instance.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-token">API token</Label>
          <Input
            autoComplete="current-password"
            id="api-token"
            required
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  )
}
