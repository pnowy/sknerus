import { ulid } from 'ulid'

export function getId({ prefix }: { prefix: string }) {
  return `${prefix}_${ulid()}`
}

export function genExpenseId() {
  return `exp_${ulid()}`
}
