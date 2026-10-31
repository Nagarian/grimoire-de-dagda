import { fireEvent, screen } from '@testing-library/react'
import { getBookData } from 'services/bookData'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getStoryChoices } from 'services/storyNavigation'
import type { StoryChoice } from 'services/storyNavigation'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryPosition } from 'services/storyProgress'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { StoryReader } from './StoryReader'

const track: StoryTrack = {
  id: 'reader-track',
  name: 'Lecture',
  visits: [createStoryVisit({ bookId: 'T01', chapterId: '1' }, 'start')],
}

function endChapter(bookId: BookId): string {
  const endId = getBookData(bookId).endIds.at(0)
  if (!endId) {
    throw new Error(`Expected ${bookId} to have an ending chapter`)
  }
  return endId
}

describe('StoryReader', () => {
  it('renders chapter choices and delegates the selected choice', () => {
    const onChoose = vi.fn<(choice: StoryChoice) => void>()
    const position = { bookId: 'T01' as const, chapterId: '1' }
    const choices = getStoryChoices(position, track)

    renderWithProviders(
      <StoryReader
        book={getBookData('T01')}
        position={position}
        choices={choices}
        isEnd={false}
        onChoose={onChoose}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible()
    expect(screen.getByText('Que faites-vous ?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chapitre 61' }))
    expect(onChoose).toHaveBeenCalledWith(choices[0])
  })

  it('shows a tome continuation at the end of a tome', () => {
    const onContinue = vi.fn<(book: (typeof books)[number]) => void>()
    const nextBook = books.find(book => book.id === 'T02')
    if (!nextBook) {
      throw new Error('Expected T02 to be registered')
    }

    renderWithProviders(
      <StoryReader
        book={getBookData('T01')}
        position={{ bookId: 'T01', chapterId: endChapter('T01') }}
        choices={[]}
        isEnd
        nextBook={nextBook}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={onContinue}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
      />,
    )

    const continueButton = screen.getByRole('button', {
      name: `Continuer vers ${nextBook.title}`,
    })
    fireEvent.click(continueButton)
    expect(onContinue).toHaveBeenCalledWith(nextBook)
  })

  it('shows the return action for a completed extension with a return location', () => {
    const onReturn = vi.fn<() => void>()

    renderWithProviders(
      <StoryReader
        book={getBookData('E01')}
        position={{ bookId: 'E01', chapterId: endChapter('E01') }}
        choices={[]}
        isEnd
        returnLabel="T01 — chapitre 164"
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={onReturn}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Revenir à T01 — chapitre 164',
      }),
    )
    expect(onReturn).toHaveBeenCalledOnce()
  })
})
