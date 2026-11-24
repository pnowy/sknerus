import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftRight, Car, CreditCard, Database, Palette, SlidersHorizontal } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
import { type UnderlineTab, UnderlineTabsList } from '@/components/layout/underline-tabs-list'
import { BackupSection } from '@/components/settings/backup-section'
import { CategoryList } from '@/components/settings/category-list'
import { CurrencySelector } from '@/components/settings/currency-selector'
import { DeductionProfileList } from '@/components/settings/deduction-profile-list'
import { ExchangeProviderSelector } from '@/components/settings/exchange-provider-selector'
import { ImportDialog } from '@/components/settings/import-dialog'
import { RecurringList } from '@/components/settings/recurring-list'
import { SupportedCurrenciesSelector } from '@/components/settings/supported-currencies-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { queryKeys, useConfig, useExpenses, useRenameCategory, useUpdateConfig } from '@/hooks/use-expenses'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { useVehicles } from '@/hooks/use-vehicles'
import { createExpense, getConfig, getExpenses, getRecurring, getSubscriptions, getVehicles } from '@/lib/api'
import { exportToCSV, parseCSV } from '@/lib/shared/csv'
import { CURRENCIES } from '@/lib/shared/currencies'
import { FabPosition } from '@/lib/shared/types/fab-position'
import { StartPage } from '@/lib/shared/types/start-page'
import type { DeductionProfile } from '@/lib/shared/types/subscription'

const SETTINGS_TABS = ['general', 'transactions', 'appearance', 'data', 'vehicles', 'subscriptions'] as const
type SettingsTab = (typeof SETTINGS_TABS)[number]

const TAB_ITEMS: Array<UnderlineTab<SettingsTab>> = [
  { value: 'general', label: 'General', icon: SlidersHorizontal },
  { value: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'data', label: 'Data', icon: Database },
  { value: 'vehicles', label: 'Vehicles', icon: Car },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
]

export const Route = createFileRoute('/settings')({
  validateSearch: z.object({ section: z.enum(SETTINGS_TABS).optional().catch(undefined) }),
  loader: async ({ context: { queryClient } }) => {
    const [, config] = await Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
      queryClient.ensureQueryData({ queryKey: ['recurring'], queryFn: () => getRecurring() }),
      queryClient.ensureQueryData({ queryKey: ['vehicles'], queryFn: () => getVehicles() }),
    ])
    // the subscriptions API is only served while the plugin is on
    if (config.features?.subscriptionTracking) {
      await queryClient.ensureQueryData({ queryKey: ['subscriptions'], queryFn: () => getSubscriptions() })
    }
  },
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
  const { data: subscriptions = [] } = useSubscriptions(config?.features?.subscriptionTracking ?? false)
  const updateConfig = useUpdateConfig()
  const renameCategoryMutation = useRenameCategory()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { section } = Route.useSearch()
  const navigate = useNavigate()

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

  async function handleShowSearchChange(showSearch: boolean) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, showSearch })
      toast.success(showSearch ? 'Search enabled' : 'Search hidden')
    } catch {
      toast.error('Failed to update search visibility')
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
        await createExpense(parsed[i])
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
  const subscriptionTrackingEnabled = config.features?.subscriptionTracking ?? false
  // A plugin tab in the URL falls back to General once that plugin is switched off
  const pluginTabHidden =
    (section === 'vehicles' && !vehicleTrackingEnabled) || (section === 'subscriptions' && !subscriptionTrackingEnabled)
  const activeTab: SettingsTab = !section || pluginTabHidden ? 'general' : section

  const visibleTabs = TAB_ITEMS.filter(
    ({ value }) => (value !== 'vehicles' || vehicleTrackingEnabled) && (value !== 'subscriptions' || subscriptionTrackingEnabled)
  )

  function setTab(next: SettingsTab) {
    void navigate({ to: '/settings', search: (prev) => ({ ...prev, section: next === 'general' ? undefined : next }), replace: true })
  }

  async function handleFeatureToggle(feature: 'vehicleExpenseTracking' | 'subscriptionTracking', checked: boolean, label: string) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, features: { ...currentConfig.features, [feature]: checked } })
      toast.success(checked ? `${label} enabled` : `${label} disabled`)
    } catch {
      toast.error('Failed to update setting')
    }
  }

  async function handleDeductionProfilesChange(deductionProfiles: Array<DeductionProfile>) {
    try {
      await updateConfig.mutateAsync({ ...currentConfig, deductionProfiles })
      toast.success('Deduction profiles updated')
    } catch {
      toast.error('Failed to update deduction profiles')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="hidden text-xl font-semibold sm:block">Settings</h1>
        <Tabs value={activeTab} onValueChange={(value) => setTab(value as SettingsTab)}>
          <UnderlineTabsList activeTab={activeTab} tabs={visibleTabs} />

          <TabsContent value="general">
            <div className="space-y-6 pt-4">
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
                    <p className="text-muted-foreground mt-1 text-xs">Day of month when your budget cycle starts</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Additional Currencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-sm">Select currencies to use when recording expenses.</p>
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
                  <CardTitle>Plugins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={vehicleTrackingEnabled}
                        id="vehicle-tracking"
                        onCheckedChange={(checked) => handleFeatureToggle('vehicleExpenseTracking', checked, 'Vehicle tracking')}
                      />
                      <Label htmlFor="vehicle-tracking">Vehicle expense tracking</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={subscriptionTrackingEnabled}
                        id="subscription-tracking"
                        onCheckedChange={(checked) => handleFeatureToggle('subscriptionTracking', checked, 'Subscription tracking')}
                      />
                      <Label htmlFor="subscription-tracking">Subscription tracking</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryList categories={config.categories} onChange={handleCategoriesChange} onNameChange={handleCategoryRename} />
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
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Start Page</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={config.startPage} onValueChange={(v) => v && handleStartPageChange(v)}>
                      <SelectTrigger>
                        <SelectValue>{(value: string) => (value === StartPage.Table ? 'Transactions' : 'Dashboard')}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={StartPage.Dashboard}>Dashboard</SelectItem>
                        <SelectItem value={StartPage.Table}>Transactions</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground mt-1 text-xs">Page shown when you open the app</p>
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
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="show-search">Show search</Label>
                        <Switch checked={config.showSearch} id="show-search" onCheckedChange={handleShowSearchChange} />
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Hide tags or notes from forms and tables, or add transaction search to the table view
                    </p>
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
                    <p className="text-muted-foreground mt-1 text-xs">
                      Floating add-expense button on phones — pick the side your thumb reaches
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full backup</CardTitle>
                </CardHeader>
                <CardContent>
                  <BackupSection />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Transactions CSV</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Transactions only, for spreadsheets or moving data from another app. Imported rows are added to the existing ones.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleCsvExport}>
                      Export CSV
                    </Button>
                    <ImportDialog onFileSelected={handleFileImport} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <div className="space-y-6 pt-4">
              {vehicles.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Add a vehicle on the{' '}
                  <Link className="text-foreground underline underline-offset-4" to="/vehicles">
                    Vehicles
                  </Link>{' '}
                  page to map categories to it.
                </p>
              )}
              {vehicles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category → Vehicle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 text-sm">
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

          <TabsContent value="subscriptions">
            <div className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deduction Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Describe how business costs are deducted (VAT, income tax, other contributions). Assign a profile to a subscription to
                    see its real cost.
                  </p>
                  <DeductionProfileList
                    profiles={config.deductionProfiles ?? []}
                    subscriptions={subscriptions}
                    onChange={handleDeductionProfilesChange}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        <p className="text-muted-foreground pt-2 text-center text-xs">
          Version <span className="font-mono">{__APP_VERSION__}</span>
        </p>
      </div>
    </AppLayout>
  )
}
