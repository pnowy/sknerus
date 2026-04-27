import { JsonAdapter } from './json-adapter'
import type { StorageAdapter } from './types'

function createStorage(): StorageAdapter {
  const type = process.env.STORAGE_TYPE ?? 'json'
  switch (type) {
    case 'json':
      return new JsonAdapter()
    default:
      throw new Error(`Unknown storage type: "${type}". Supported: "json"`)
  }
}

export const storage: StorageAdapter = createStorage()
export type { StorageAdapter }
