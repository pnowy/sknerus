import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoryList } from '@/components/settings/category-list'
import { CurrencySelector } from '@/components/settings/currency-selector'
import { ExchangeProviderSelector } from '@/components/settings/exchange-provider-selector'
import { ImportDialog } from '@/components/settings/import-dialog'
import { RecurringList } from '@/components/settings/recurring-list'
import { SupportedCurrenciesSelector } from '@/components/settings/supported-currencies-selector'
import { VehicleList } from '@/components/settings/vehicle-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { queryKeys, useConfig, useExpenses, useRenameCategory, useUpdateConfig } from '@/hooks/use-expenses'
import { useVehicles } from '@/hooks/use-vehicles'
import { getConfig } from '@/lib/server/functions/config'
import { createExpense, getExpenses } from '@/lib/server/functions/expenses'
import { getRecurring } from '@/lib/server/functions/recurring'
import { getVehicles } from '@/lib/server/functions/vehicles'
import { exportToCSV, parseCSV } from '@/lib/shared/csv'
import { CURRENCIES } from '@/lib/shared/currencies'
import { FabPosition } from '@/lib/shared/types/fab-position'
import { StartPage } from '@/lib/shared/types/start-page'

export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
      queryClient.ensureQueryData({ queryKey: ['recurring'], queryFn: () => getRecurring() }),
      queryClient.ensureQueryData({ queryKey: ['vehicles'], queryFn: () => getVehicles() }),
    ]),
  component: SettingsPage,
})

const FISCAL_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const FAB_POSITION_OPTIONS = [
  { value: FabPosition.Right, label: 'Bottom right' },
  { value: FabPosition.Left, label: 'Bottom left' },
  { value: FabPosition.Off, label: 'Off' },
] as const

function SettingsPage() {
  const { data: config } = useConfig()
  const { data: allExpenses = [] } = useExpenses()
  const { data: vehicles = [] } = useVehicles()
  const updateConfig = useUpdateConfig()
  const renameCategoryMutation = useRenameCategory()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('general')

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

  async function handleExchangeProviderChange(exchangeProvider: string, exchangeApiKey?: string) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, exchangeProvider, exchangeApiKey })
      toast.success('Exchange provider updated')
    } catch {
      toast.error('Failed to update exchange provider')
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

  async function handleShowTagsChange(showTags: boolean) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, showTags })
      toast.success(showTags ? 'Tags enabled' : 'Tags hidden')
    } catch {
      toast.error('Failed to update tags visibility')
    }
  }

  async function handleShowNotesChange(showNotes: boolean) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, showNotes })
      toast.success(showNotes ? 'Notes enabled' : 'Notes hidden')
    } catch {
      toast.error('Failed to update notes visibility')
    }
  }

  async function handleFabPositionChange(fabPosition: FabPosition) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, fabPosition })
      toast.success('Add button position updated')
    } catch {
      toast.error('Failed to update add button position')
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

  async function handleFileImport(file: File) {
    const text = await file.text()
    const { expenses: parsed, newCategories } = parseCSV(text, currentConfig.categories, currentConfig.currency)
    const toastId = 'csv-import'
    try {
      if (newCategories.length > 0) {
        await updateConfig.mutateAsync({ ...currentConfig, categories: [...currentConfig.categories, ...newCategories] })
      }
      for (let i = 0; i < parsed.length; i++) {
        toast.loading(`Importing ${i + 1} / ${parsed.length}…`, { id: toastId })
        await createExpense({ data: parsed[i] })
      }
      toast.success(
        `Imported ${parsed.length} transactions${newCategories.length > 0 ? ` and ${newCategories.length} new categories` : ''}`,
        { id: toastId }
      )
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
    } catch (err) {
      console.error('Import failed:', err)
      toast.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`, { id: toastId })
    }
  }

  const vehicleTrackingEnabled = config.features?.vehicleExpenseTracking ?? false

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="hidden font-semibold text-xl sm:block">Settings</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            {vehicleTrackingEnabled && <TabsTrigger value="vehicles">Vehicles</TabsTrigger>}
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6 pt-4">
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
                    <CardTitle>Exchange Rate Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExchangeProviderSelector
                      apiKey={config.exchangeApiKey}
                      provider={config.exchangeProvider}
                      onChange={handleExchangeProviderChange}
                    />
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
                          <SelectValue>
                            {(value: string) => (value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : null)}
                          </SelectValue>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Display</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="show-tags">Show tags</Label>
                        <Switch checked={config.showTags} id="show-tags" onCheckedChange={handleShowTagsChange} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="show-notes">Show notes</Label>
                        <Switch checked={config.showNotes} id="show-notes" onCheckedChange={handleShowNotesChange} />
                      </div>
                    </div>
                    <p className="mt-2 text-muted-foreground text-xs">Hide tags or notes from forms and tables</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Mobile Add Button</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={config.fabPosition} onValueChange={(v) => v && handleFabPositionChange(v as FabPosition)}>
                      <SelectTrigger>
                        <SelectValue>
                          {(value: string) => FAB_POSITION_OPTIONS.find((o) => o.value === value)?.label ?? 'Bottom right'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {FAB_POSITION_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Floating add-expense button on phones — pick the side your thumb reaches
                    </p>
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
                    <ImportDialog onFileSelected={handleFileImport} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Plugins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={vehicleTrackingEnabled}
                      id="vehicle-tracking"
                      onCheckedChange={async (checked) => {
                        try {
                          await updateConfig.mutateAsync({
                            ...currentConfig,
                            features: { ...currentConfig.features, vehicleExpenseTracking: checked },
                          })
                          if (!checked) setActiveTab('general')
                          toast.success(checked ? 'Vehicle tracking enabled' : 'Vehicle tracking disabled')
                        } catch {
                          toast.error('Failed to update setting')
                        }
                      }}
                    />
                    <Label htmlFor="vehicle-tracking">Vehicle expense tracking</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <div className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleList currency={config.currency} expenses={allExpenses} vehicles={vehicles} />
                </CardContent>
              </Card>
              {vehicles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category → Vehicle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-muted-foreground text-sm">
                      Assign a vehicle to a category to enable fuel tracking for expenses in that category.
                    </p>
                    <div className="space-y-2">
                      {config.categories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-3">
                          <span className="w-32 truncate text-sm">{cat.name}</span>
                          <Select
                            value={cat.vehicleId ?? ''}
                            onValueChange={async (val) => {
                              const updated = config.categories.map((c) => (c.id === cat.id ? { ...c, vehicleId: val || undefined } : c))
                              try {
                                await updateConfig.mutateAsync({ ...currentConfig, categories: updated })
                              } catch {
                                toast.error('Failed to update category')
                              }
                            }}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="No vehicle">
                                {(v: string) => vehicles.find((vh) => vh.id === v)?.name ?? 'No vehicle'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No vehicle</SelectItem>
                              {vehicles.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <p className="pt-2 text-center text-muted-foreground text-xs">
          Version <span className="font-mono">{__APP_VERSION__}</span>
        </p>
      </div>
    </AppLayout>
  )
}
