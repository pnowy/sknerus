import { monotonicFactory } from 'ulid'

const ulid = monotonicFactory()

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

export function genSubscriptionId() {
  return `sub_${ulid()}`
}

export function genDeductionProfileId() {
  return `ded_${ulid()}`
}
