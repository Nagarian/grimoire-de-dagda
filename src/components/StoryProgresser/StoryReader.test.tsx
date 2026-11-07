import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getBookData } from 'services/bookData'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getStoryChoices } from 'services/storyNavigation'
import type { StoryChoice } from 'services/storyNavigation'
import { getStoryCheckboxSuggestions } from 'services/storyCheckboxes'
import { getMapPathSuggestions } from 'services/storyMap'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryPosition } from 'services/storyProgress'
import type { ChapterId } from 'services/chapterDsl'
import type { StoryTrack } from 'services/storyProgress'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import { createCharacterSheetState } from 'services/characterSheet'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { StoryReader } from './StoryReader'

const track: StoryTrack = {
  id: 'reader-track',
  name: 'Lecture',
  visits: [createStoryVisit({ chapterId: 'T01-1' }, 'start')],
  checkedCheckboxIds: [],
  revealedMapPathIds: [],
  characterSheet: createCharacterSheetState('T01', 'storytelling'),
  savepoints: {},
}

function endChapter(bookId: BookId): ChapterId {
  const endId = getBookData(bookId).endIds.at(0)
  if (!endId) {
    throw new Error(`Expected ${bookId} to have an ending chapter`)
  }
  return endId
}

describe('StoryReader', () => {
  it('renders chapter choices and delegates the selected choice', () => {
    const onChoose = vi.fn<(choice: StoryChoice) => void>()
    const position: StoryPosition = { chapterId: 'T01-1' }
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
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={vi.fn<(checkboxId: string) => void>()}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible()
    expect(screen.getByText('Que faites-vous ?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chapitre 61' }))
    expect(onChoose).toHaveBeenCalledWith(choices[0])
  })

  it('renders a chapter checkbox and delegates manual toggles', async () => {
    const user = userEvent.setup()
    const onToggleCheckbox = vi.fn<(checkboxId: string) => void>()
    const position: StoryPosition = { chapterId: 'T02-3' }
    const checkbox = getChapterStoryCheckboxes(position)[0]

    renderWithProviders(
      <StoryReader
        book={getBookData('T02')}
        position={position}
        choices={[]}
        isEnd={false}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={onToggleCheckbox}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: checkbox.label }))
    expect(onToggleCheckbox).toHaveBeenCalledWith(checkbox.id)
  })

  it('places line checkboxes beside their matching chapter choice', () => {
    const position: StoryPosition = { chapterId: 'T05-76' }
    const currentTrack = {
      ...track,
      visits: [createStoryVisit(position, 'start')],
    }
    const checkbox = getChapterStoryCheckboxes(position).find(
      candidate =>
        candidate.kind === 'line' &&
        candidate.destinationChapterId === 'T05-43',
    )
    if (!checkbox) {
      throw new Error('Expected a line checkbox for chapter 43')
    }

    renderWithProviders(
      <StoryReader
        book={getBookData('T05')}
        position={position}
        choices={getStoryChoices(position, currentTrack)}
        isEnd={false}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={vi.fn<(checkboxId: string) => void>()}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
      />,
    )

    const choiceGroup = screen.getByRole('group', {
      name: 'Choix Chapitre 43',
    })
    const lineCheckbox = within(choiceGroup).getByRole('checkbox', {
      name: 'Défi UN',
    })
    expect(lineCheckbox).toBeInTheDocument()
    expect(within(choiceGroup).queryByText('Défi UN')).not.toBeInTheDocument()
  })

  it('shows TC and TLC suggestions as actions in the choice section', () => {
    const position: StoryPosition = { chapterId: 'T02-104' }
    const suggestions = getStoryCheckboxSuggestions(position)
    const suggestedChapter = suggestions.find(
      suggestion => suggestion.checkbox.chapterId === 'T02-8',
    )
    const currentTrack = {
      ...track,
      visits: [createStoryVisit(position, 'start')],
    }
    const onToggleCheckbox = vi.fn<(checkboxId: string) => void>()
    if (!suggestedChapter) {
      throw new Error('Expected a checkbox suggestion for chapter 8')
    }

    renderWithProviders(
      <StoryReader
        book={getBookData('T02')}
        position={position}
        choices={getStoryChoices(position, currentTrack)}
        isEnd={false}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={onToggleCheckbox}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
      />,
    )

    const action = screen.getByRole('button', { name: 'Cocher le chapitre 8' })
    expect(action).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(action)
    expect(onToggleCheckbox).toHaveBeenCalledWith(suggestedChapter.checkbox.id)
  })

  it('shows a TC action even when it targets the current chapter checkbox', () => {
    const position: StoryPosition = { chapterId: 'T02-3' }
    const currentTrack = {
      ...track,
      visits: [createStoryVisit(position, 'start')],
    }
    const checkbox = getChapterStoryCheckboxes(position).find(
      item => item.kind === 'chapter',
    )
    const onToggleCheckbox = vi.fn<(checkboxId: string) => void>()
    if (!checkbox) {
      throw new Error('Expected a chapter checkbox on chapter 3')
    }

    renderWithProviders(
      <StoryReader
        book={getBookData('T02')}
        position={position}
        choices={getStoryChoices(position, currentTrack)}
        isEnd={false}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={onToggleCheckbox}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
      />,
    )

    const action = screen.getByRole('button', { name: 'Cocher le chapitre 3' })
    fireEvent.click(action)
    expect(onToggleCheckbox).toHaveBeenCalledWith(checkbox.id)
  })

  it('reveals an HM map path using a button in the chapter actions', () => {
    const position: StoryPosition = { chapterId: 'T05-29' }
    const suggestion = getMapPathSuggestions(position).find(
      item => item.targetChapterId === 'T05-329',
    )
    if (!suggestion) {
      throw new Error('Expected chapter 29 to reveal chapter 329')
    }

    const onRevealMapPath = vi.fn<(mapPathId: string) => void>()
    renderWithProviders(
      <StoryReader
        book={getBookData('T05')}
        position={position}
        choices={getStoryChoices(position, track)}
        isEnd={false}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={vi.fn<(checkboxId: string) => void>()}
        onRevealMapPath={onRevealMapPath}
      />,
    )

    const revealButton = screen.getByRole('button', {
      name: 'Révéler sur la carte : Le moulin noyé',
    })
    fireEvent.click(revealButton)
    expect(onRevealMapPath).toHaveBeenCalledWith(suggestion.id)
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
        position={{ chapterId: endChapter('T01') }}
        choices={[]}
        isEnd
        nextBook={nextBook}
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={onContinue}
        onReturn={vi.fn<() => void>()}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={vi.fn<(checkboxId: string) => void>()}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
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
        position={{ chapterId: endChapter('E01') }}
        choices={[]}
        isEnd
        returnLabel="T01 — chapitre 164"
        onChoose={vi.fn<(choice: StoryChoice) => void>()}
        onContinue={vi.fn<(book: (typeof books)[number]) => void>()}
        onReturn={onReturn}
        onJump={vi.fn<(position: StoryPosition) => boolean>(() => true)}
        checkedCheckboxIds={[]}
        revealedMapPathIds={[]}
        onToggleCheckbox={vi.fn<(checkboxId: string) => void>()}
        onRevealMapPath={vi.fn<(mapPathId: string) => void>()}
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
