import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button.tsx'

export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="font-semibold text-base text-gray-600">404</p>
        <h1 className="mt-4 text-balance font-semibold text-5xl text-gray-900 tracking-tight sm:text-7xl">Page not found</h1>
        <p className="mt-6 text-pretty font-medium text-gray-500 text-lg sm:text-xl/8">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button render={<Link to="/" />}>Go back home</Button>
        </div>
      </div>
    </main>
  )
}
