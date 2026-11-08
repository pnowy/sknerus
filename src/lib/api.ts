import { apiFetch } from '@/lib/api-client'
import type { ExpenseInput, VehicleInput } from '@/lib/schemas'
import type { Config, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'

const API_PREFIX = '/api/v1'

export function getExpenses(): Promise<Array<Expense>> {
  return apiFetch(`${API_PREFIX}/expenses`)
}

export function createExpense(data: ExpenseInput): Promise<Expense> {
  return apiFetch(`${API_PREFIX}/expenses`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateExpense(data: Expense): Promise<Expense> {
  return apiFetch(`${API_PREFIX}/expenses/${encodeURIComponent(data.id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteExpense(id: string): Promise<{ success: true }> {
  return apiFetch(`${API_PREFIX}/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getConfig(): Promise<Config> {
  return apiFetch(`${API_PREFIX}/config`)
}

export function updateConfig(data: Config): Promise<Config> {
  return apiFetch(`${API_PREFIX}/config`, { method: 'PUT', body: JSON.stringify(data) })
}

export function renameCategory(data: { id: string; newName: string }): Promise<{ ok: true }> {
  return apiFetch(`${API_PREFIX}/categories/${encodeURIComponent(data.id)}/rename`, {
    method: 'POST',
    body: JSON.stringify({ newName: data.newName }),
  })
}

export function getRecurring(): Promise<Array<RecurringExpense>> {
  return apiFetch(`${API_PREFIX}/recurring`)
}

export function createRecurring(data: Omit<RecurringExpense, 'id'>): Promise<RecurringExpense> {
  return apiFetch(`${API_PREFIX}/recurring`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateRecurring(data: RecurringExpense): Promise<RecurringExpense> {
  return apiFetch(`${API_PREFIX}/recurring/${encodeURIComponent(data.id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteRecurring(id: string): Promise<{ success: true }> {
  return apiFetch(`${API_PREFIX}/recurring/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function materializeRecurring(): Promise<{ created: number }> {
  return apiFetch(`${API_PREFIX}/recurring/materialize`, { method: 'POST' })
}

export function getVehicles(): Promise<Array<Vehicle>> {
  return apiFetch(`${API_PREFIX}/vehicles`)
}

export function createVehicle(data: Omit<VehicleInput, 'id'>): Promise<Vehicle> {
  return apiFetch(`${API_PREFIX}/vehicles`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateVehicle(data: Vehicle): Promise<Vehicle> {
  return apiFetch(`${API_PREFIX}/vehicles/${encodeURIComponent(data.id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteVehicle(id: string): Promise<{ success: true }> {
  return apiFetch(`${API_PREFIX}/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function resolveExchangeRate(data: { date: string; from: string; to: string }): Promise<number> {
  const query = new URLSearchParams(data)
  return apiFetch(`${API_PREFIX}/exchange-rate?${query}`)
}

export function login(token: string): Promise<{ success: true }> {
  return apiFetch(`${API_PREFIX}/auth/login`, { method: 'POST', body: JSON.stringify({ token }) })
}

export function logout(): Promise<{ success: true }> {
  return apiFetch(`${API_PREFIX}/auth/logout`, { method: 'POST' })
}

export function getAuthStatus(): Promise<{ authEnabled: boolean }> {
  return apiFetch(`${API_PREFIX}/auth/status`)
}
