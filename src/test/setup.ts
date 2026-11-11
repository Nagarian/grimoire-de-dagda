import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { i18n } from 'services/i18n'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn<typeof window.matchMedia>().mockImplementation(media => ({
    matches: false,
    media,
    onchange: null,
    addListener: vi.fn<MediaQueryList['addListener']>(),
    removeListener: vi.fn<MediaQueryList['removeListener']>(),
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
    dispatchEvent: vi.fn<MediaQueryList['dispatchEvent']>(),
  })),
})

beforeEach(async () => {
  await i18n.changeLanguage('fr')
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
})
