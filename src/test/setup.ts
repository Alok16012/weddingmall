import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Deterministic in-memory localStorage. Node 25 exposes a partial built-in
 * `localStorage` global that shadows jsdom's and lacks a working clear(), so we
 * install our own on globalThis for stable tests.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
})

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())
