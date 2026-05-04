import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { useRef } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoryList } from '@/components/settings/category-list'
import { CurrencySelector } from '@/components/settings/currency-selector'
import { RecurringList } from '@/components/settings/recurring-list'
import { SupportedCurrenciesSelector } from '@/components/settings/supported-currencies-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConfig, useExpenses, useRenameCategory, useUpdateConfig } from '@/hooks/use-expenses'
import { getConfig } from '@/lib/server/functions/config'
import { createExpense, getExpenses } from '@/lib/server/functions/expenses'
import { getRecurring } from '@/lib/server/functions/recurring'
import { exportToCSV, parseCSV } from '@/lib/shared/csv'
import { CURRENCIES } from '@/lib/shared/currencies'
import { StartPage } from '@/lib/shared/types/start-page'

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
      queryClient.ensureQueryData({ queryKey: ['recurring'], queryFn: () => getRecurring() }),
    ]),
  component: SettingsPage,
})

const FISCAL_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function SettingsPage() {
  const { data: config } = useConfig()
  const { data: allExpenses = [] } = useExpenses()
  const updateConfig = useUpdateConfig()
  const renameCategoryMutation = useRenameCategory()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!config) return null
  const currentConfig = config

  async function handleCurrencyChange(currency: string) {
    try {
      await updateConfig.mutateAsync({
        ...currentConfig,
        currency,
        supportedCurrencies: currentConfig.supportedCurrencies.filter((c) => c !== currency),
      })
      toast.success('Currency updated')
    } catch {
      toast.error('Failed to update currency')
    }
  }

  async function handleSupportedCurrenciesChange(supportedCurrencies: Array<string>) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, supportedCurrencies })
      toast.success('Supported currencies updated')
    } catch {
      toast.error('Failed to update currencies')
    }
  }

  async function handleStartPageChange(val: string) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, startPage: val })
      toast.success('Start page updated')
    } catch {
      toast.error('Failed to update start page')
    }
  }

  async function handleStartDateChange(val: string) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, startDate: Number(val) })
      toast.success('Fiscal start date updated')
    } catch {
      toast.error('Failed to update start date')
    }
  }

  async function handleCategoryRename(id: string, newName: string) {
    const oldName = currentConfig.categories.find((c) => c.id === id)?.name ?? id
    try {
      await renameCategoryMutation.mutateAsync({ id, newName })
      toast.success(`Renamed "${oldName}" to "${newName}"`)
    } catch {
      toast.error('Failed to rename category')
    }
  }

  async function handleCategoriesChange(categories: typeof currentConfig.categories) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, categories })
    } catch {
      toast.error('Failed to update categories')
    }
  }

  function handleCsvExport() {
    exportToCSV(allExpenses, currentConfig.categories)
    toast.success('Exported')
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const { expenses: parsed, newCategories } = parseCSV(text, currentConfig.categories)
    try {
      if (newCategories.length > 0) {
        await updateConfig.mutateAsync({ ...currentConfig, categories: [...currentConfig.categories, ...newCategories] })
      }
      await Promise.all(parsed.map((row) => createExpense({ data: row })))
      toast.success(
        `Imported ${parsed.length} transactions${newCategories.length > 0 ? ` and ${newCategories.length} new categories` : ''}`
      )
    } catch {
      toast.error('Import failed')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="hidden font-semibold text-xl sm:block">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList categories={config.categories} onChange={handleCategoriesChange} onNameChange={handleCategoryRename} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencySelector value={config.currency} onChange={handleCurrencyChange} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fiscal Start Day</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={String(config.startDate)} onValueChange={(v) => v && handleStartDateChange(v)}>
                <SelectTrigger>
                  <SelectValue>{(value: string) => `Day ${value}`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Day {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-muted-foreground text-xs">Day of month when your budget cycle starts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Start Page</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={config.startPage} onValueChange={(v) => v && handleStartPageChange(v)}>
                <SelectTrigger>
                  <SelectValue>{(value: string) => (value === StartPage.Table ? 'Table' : 'Dashboard')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StartPage.Dashboard}>Dashboard</SelectItem>
                  <SelectItem value={StartPage.Table}>Table</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-muted-foreground text-xs">Page shown when you open the app</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label>Appearance</Label>
                <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue>{(value: string) => (value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : null)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Additional Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-muted-foreground text-sm">Select currencies to use when recording expenses.</p>
            <SupportedCurrenciesSelector
              allCurrencies={CURRENCIES}
              defaultCurrency={config.currency}
              value={config.supportedCurrencies}
              onChange={handleSupportedCurrenciesChange}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringList categories={config.categories} currency={config.currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleCsvExport}>
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Import CSV
              </Button>
              <input ref={fileInputRef} accept=".csv" className="hidden" type="file" onChange={handleCsvImport} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
