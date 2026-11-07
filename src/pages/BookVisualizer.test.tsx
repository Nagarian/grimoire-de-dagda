import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ALL_BOOKS_ID } from 'services/books'
import { renderWithProviders } from 'test/renderWithProviders'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookVisualizer } from './BookVisualizer'

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('components/StoryDisplayer', () => ({
  StoryDisplayer: ({ bookId }: { bookId: string }) => (
    <div data-testid="selected-book">{bookId}</div>
  ),
}))

describe('BookVisualizer', () => {
  const originalScrollTo = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollTo',
  )

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn<HTMLElement['scrollTo']>(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalScrollTo) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
    }
  })

  it('offers and displays the combined graph selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BookVisualizer />)

    await user.click(screen.getByRole('combobox'))
    await user.click(
      await screen.findByRole('option', { name: 'Tous les livres' }),
    )

    expect(screen.getByTestId('selected-book')).toHaveTextContent(ALL_BOOKS_ID)
  })
})
