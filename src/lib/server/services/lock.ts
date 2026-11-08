let writeQueue = Promise.resolve()

export function withWriteLock<T>(write: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(write)
  writeQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}
