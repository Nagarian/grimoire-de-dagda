import { act, renderHook } from '@testing-library/react'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import { getMapPathSuggestions } from 'services/storyMap'
import {
  getBookData,
  getBookIdFromChapterId,
  toChapterId,
} from 'services/bookData'
import { getStoryChoices } from 'services/storyNavigation'
import type { StoryChoice } from 'services/storyNavigation'
import type { ChapterId } from 'services/chapterDsl'
import type {
  E01CharacterSheet,
  T02CharacterSheet,
  T01CharacterSheet,
  T05CharacterSheet,
} from 'services/characterSheet'
import { books } from 'services/books'
import { createBlankBookSheet } from 'services/characterSheet'
import { useStoryProgress } from './useStoryProgress'
import { beforeEach, describe, expect, it } from 'vitest'

describe('useStoryProgress checkbox state', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('only saves in simplified mode and restores snapshots for other books', () => {
    const { result } = renderHook(() => useStoryProgress())
    act(() => {
      result.current.createTrack('Première partie', 'T02', 'storytelling')
    })

    expect(result.current.saveAtSavepoint(0)).toBe(false)
    act(() => {
      result.current.setGameMode('simplified')
    })

    const sheet = result.current.currentBookSheet
    if (sheet?.bookId !== 'T02') {
      throw new Error('Expected the T02 sheet')
    }
    act(() => {
      result.current.updateCharacterSheet({
        ...sheet,
        maxLife: 22,
        currentLife: 18,
      })
    })
    act(() => {
      expect(result.current.saveAtSavepoint(0)).toBe(true)
    })

    act(() => {
      result.current.updateCharacterSheet({
        ...(result.current.currentBookSheet as T02CharacterSheet),
        currentLife: 4,
      })
    })
    act(() => {
      result.current.jumpTo({ chapterId: 'T02-3' })
    })
    act(() => {
      result.current.setGameMode('storytelling')
    })
    expect(result.current.restoreSavepoint('T02', 0)).toBe(false)
    act(() => {
      result.current.setGameMode('simplified')
    })
    expect(result.current.activeTrack?.characterSheet.gameMode).toBe(
      'simplified',
    )
    expect(result.current.activeTrack?.savepoints.T02?.[0]).toBeDefined()
    act(() => {
      expect(result.current.restoreSavepoint('T02', 0)).toBe(true)
    })

    expect(result.current.currentPosition?.chapterId).toBe('T02-1')
    expect(result.current.currentBookSheet).toMatchObject({
      bookId: 'T02',
      maxLife: 22,
      currentLife: 18,
    })
    expect(result.current.activeTrack?.characterSheet.gameMode).toBe(
      'simplified',
    )
  })

  describe('useStoryProgress map path state', () => {
    beforeEach(() => {
      window.localStorage.clear()
    })

    it('saves revealed HM paths per track without changing navigation history', () => {
      const suggestion = getMapPathSuggestions({
        chapterId: 'T05-29',
      }).find(item => item.targetChapterId === 'T05-329')
      if (!suggestion) {
        throw new Error('Expected chapter 29 to reveal chapter 329')
      }

      const { result } = renderHook(() => useStoryProgress())
      act(() => {
        result.current.createTrack('Première partie', 'T05', 'storytelling')
      })
      const firstTrackId = result.current.activeTrack?.id
      if (!firstTrackId) {
        throw new Error('Expected the new track to be active')
      }
      const originalVisits = result.current.activeTrack?.visits
      act(() => {
        result.current.revealMapPath(suggestion.id)
      })

      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([
        suggestion.id,
      ])
      expect(result.current.activeTrack?.visits).toEqual(originalVisits)
      expect(
        JSON.parse(
          window.localStorage.getItem('grimoire-de-dagda:story-progress') ??
            '{}',
        ),
      ).toMatchObject({
        tracks: [{ revealedMapPathIds: [suggestion.id] }],
      })

      act(() => {
        result.current.createTrack('Deuxième partie', 'T01', 'storytelling')
      })
      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([])

      act(() => {
        result.current.changeTrack(firstTrackId)
      })
      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([
        suggestion.id,
      ])
    })
  })

  it('keeps checked boxes per track and outside navigation undo', () => {
    const checkbox = getChapterStoryCheckboxes({
      chapterId: 'T02-3',
    })[0]
    const { result } = renderHook(() => useStoryProgress())

    act(() => {
      result.current.createTrack('Première partie', 'T02', 'storytelling')
    })
    const firstTrackId = result.current.activeTrack?.id
    if (!firstTrackId) {
      throw new Error('Expected the new track to be active')
    }

    act(() => {
      result.current.toggleCheckbox(checkbox.id)
    })
    act(() => {
      result.current.jumpTo({ chapterId: 'T02-3' })
    })
    act(() => {
      result.current.undoVisit()
    })

    expect(result.current.activeTrack?.visits).toHaveLength(1)
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([
      checkbox.id,
    ])

    act(() => {
      result.current.createTrack('Deuxième partie', 'T01', 'storytelling')
    })
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([])

    act(() => {
      result.current.changeTrack(firstTrackId)
    })
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([
      checkbox.id,
    ])
  })

  it('converts main-tome sheets on first entry and keeps T05 isolated', () => {
    const { result } = renderHook(() => useStoryProgress())
    act(() => {
      result.current.createTrack('Première partie', 'T01', 'storytelling')
    })

    const t01Sheet = result.current.currentBookSheet as T01CharacterSheet
    act(() => {
      result.current.updateCharacterSheet({
        ...t01Sheet,
        maxLife: 20,
        currentLife: 15,
        dexterity: 8,
        skills: ['Pistage'],
        inventory: [{ title: 'Potion', quantity: 2 }],
      })
    })
    const endChapter = getBookData('T01').endIds[0]
    act(() => {
      result.current.jumpTo({ chapterId: endChapter })
    })
    act(() => {
      result.current.continueToBook(result.current.nextBook!)
    })

    expect(result.current.currentBookSheet).toMatchObject({
      bookId: 'T02',
      maxLife: 20,
      currentLife: 15,
      dexterity: 8,
      skills: ['Pistage'],
      inventory: [{ title: 'Potion', quantity: 2 }],
    })

    act(() => {
      result.current.jumpTo({ chapterId: 'T05-1' })
    })
    expect(result.current.currentBookSheet).toEqual(createBlankBookSheet('T05'))
    const t05Sheet = createBlankBookSheet('T05') as T05CharacterSheet
    act(() => {
      result.current.updateCharacterSheet({
        ...t05Sheet,
        body: 7,
      })
    })
    act(() => {
      result.current.jumpTo({ chapterId: 'T02-1' })
    })
    expect(result.current.currentBookSheet).toMatchObject({
      bookId: 'T02',
      maxLife: 20,
    })
    act(() => {
      result.current.jumpTo({ chapterId: 'T05-1' })
    })
    expect(result.current.currentBookSheet).toMatchObject({
      bookId: 'T05',
      body: 7,
    })
  })

  it('saves and restores a T01 sheet snapshot and resumes at its target', () => {
    const { result } = renderHook(() => useStoryProgress())
    act(() => {
      result.current.createTrack('Première partie', 'T01', 'simplified')
    })
    const sheet = result.current.currentBookSheet as T01CharacterSheet
    act(() => {
      result.current.updateCharacterSheet({
        ...sheet,
        maxLife: 18,
        currentLife: 12,
        inventory: [{ title: 'Bourse', quantity: 1 }],
      })
    })
    act(() => {
      result.current.saveAtSavepoint(0, 'T01-3')
    })
    act(() => {
      result.current.updateCharacterSheet({
        ...(result.current.currentBookSheet as T01CharacterSheet),
        currentLife: 3,
      })
    })
    act(() => {
      result.current.restoreSavepoint('T01', 0)
    })

    expect(result.current.currentPosition?.chapterId).toBe('T01-3')
    expect(result.current.activeTrack?.characterSheet).toMatchObject({
      gameMode: 'simplified',
      sheets: {
        T01: {
          maxLife: 18,
          currentLife: 12,
          inventory: [{ title: 'Bourse', quantity: 1 }],
        },
      },
    })
  })

  it('records RO capsules and blocks entry when all fifteen slots are full', () => {
    const { result } = renderHook(() => useStoryProgress())
    act(() => {
      result.current.createTrack('Première partie', 'T02', 'storytelling')
    })
    const track = result.current.activeTrack
    if (!track) {
      throw new Error('Expected the new track to be active')
    }

    let roChoice: StoryChoice | undefined
    let sourceChapterId: ChapterId | undefined
    for (const book of books.filter(book => book.category === 'Tome')) {
      for (const rawChapterId of getBookData(book.id).chaptersById.keys()) {
        const chapterId = toChapterId(
          book.id,
          rawChapterId.replace(`${book.id}-`, ''),
        )
        const choice = getStoryChoices({ chapterId }, track).find(
          candidate =>
            candidate.kind === 'destination' && candidate.via === 'ro-entry',
        )
        if (choice?.kind === 'destination' && choice.via === 'ro-entry') {
          roChoice = choice
          sourceChapterId = chapterId
          break
        }
      }
      if (roChoice) {
        break
      }
    }
    if (
      !roChoice ||
      roChoice.kind !== 'destination' ||
      roChoice.via !== 'ro-entry' ||
      !sourceChapterId
    ) {
      throw new Error('Expected an RO entry route in the registered books')
    }
    const originBook = roChoice.deathPosition
      ? getBookIdFromChapterId(roChoice.deathPosition)
      : undefined
    if (!roChoice.deathPosition || !roChoice.returnTo || !originBook) {
      throw new Error('Expected the RO route to contain capsule details')
    }

    act(() => {
      result.current.chooseDestination(roChoice)
    })
    const e01Sheet = result.current.currentBookSheet as E01CharacterSheet
    expect(e01Sheet.capsules).toHaveLength(1)
    expect(e01Sheet.capsules[0]).toMatchObject({
      originBook,
      deathChapter: roChoice.deathPosition?.replace(/^T\d+-/, ''),
      returnChapter: roChoice.returnTo?.replace(/^T\d+-/, ''),
    })

    act(() => {
      result.current.updateCharacterSheet({
        ...e01Sheet,
        capsules: Array.from({ length: 15 }, () => ({
          originBook: 'T02',
          deathChapter: '1',
          returnChapter: '2',
        })),
      })
    })
    act(() => {
      result.current.jumpTo({ chapterId: sourceChapterId })
    })
    expect(
      result.current.choices.find(
        choice => choice.kind === 'unavailable' && choice.reason.includes('15'),
      ),
    ).toBeDefined()
  })
})
