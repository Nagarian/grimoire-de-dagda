import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createCharacterSheetState } from 'services/characterSheet'
import { ALL_BOOKS_ID } from 'services/books'
import { createStoryVisit, saveStoryProgress } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookVisualizer } from './BookVisualizer'

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('components/StoryDisplayer', () => ({
  StoryDisplayer: ({
    bookId,
    chapterVisitCounts = new Map(),
    showVisitedChapterCounts,
    onVisitedChapterCountsToggle,
  }: {
    bookId: string
    chapterVisitCounts?: ReadonlyMap<string, number>
    showVisitedChapterCounts?: boolean
    onVisitedChapterCountsToggle?: () => void
  }) => (
    <div
      data-testid="selected-book"
      data-visit-counts={JSON.stringify([...chapterVisitCounts])}
      data-show-visited-colors={showVisitedChapterCounts}
    >
      {bookId}
      <button onClick={onVisitedChapterCountsToggle}>Toggle colors</button>
    </div>
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

  it('passes active-track visit counts and remembers the colorization option', async () => {
    const user = userEvent.setup()
    saveStoryProgress({
      version: 9,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Ma partie',
          visits: [
            createStoryVisit({ chapterId: 'T01-1' }, 'start'),
            createStoryVisit({ chapterId: 'T01-1' }, 'manual'),
            createStoryVisit({ chapterId: 'T01-1' }, 'manual'),
          ],
          checkedCheckboxIds: [],
          revealedMapPathIds: [],
          characterSheet: createCharacterSheetState('T01', 'storytelling'),
          savepoints: {},
        },
      ],
      uiState: {
        currentPage: 'book-visualizer',
        storyDetailsAccordion: [],
        showVisitedChapterCounts: false,
      },
    })

    renderWithProviders(<BookVisualizer defaultBookId="T01" />)

    const diagram = screen.getByTestId('selected-book')
    expect(diagram).toHaveAttribute(
      'data-visit-counts',
      JSON.stringify([['T01-1', 3]]),
    )
    expect(diagram).toHaveAttribute('data-show-visited-colors', 'false')

    await user.click(screen.getByRole('button', { name: 'Toggle colors' }))

    expect(screen.getByTestId('selected-book')).toHaveAttribute(
      'data-show-visited-colors',
      'true',
    )
    expect(
      JSON.parse(
        window.localStorage.getItem('grimoire-de-dagda:story-progress')!,
      ).uiState.showVisitedChapterCounts,
    ).toBe(true)
  })
})
