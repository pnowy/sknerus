import { createFileRoute, redirect } from '@tanstack/react-router'
import { getConfig } from '@/lib/server/functions/config'
import { StartPage } from '@/lib/shared/types/start-page'

export const Route = createFileRoute('/')({
  loader: async ({ context: { queryClient } }) => {
    const config = await queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() })
    throw redirect({ to: config.startPage === StartPage.Table ? '/table' : '/dashboard' })
  },
})
