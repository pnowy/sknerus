import { ulid } from 'ulid'

export function genExpenseId() {
  return `exp_${ulid()}`
}

export function genCategoryId() {
  return `cat_${ulid()}`
}

export function genRecurringId() {
  return `rec_${ulid()}`
}

export function genVehicleId() {
  return `veh_${ulid()}`
}
