import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CharacterSheetMenu } from 'components/CharacterSheet/CharacterSheetMenu'
import {
  createCharacterSheetState,
  createBlankBookSheet,
} from 'services/characterSheet'
import type { BookId } from 'services/books'
import type { CharacterSavepoint } from 'services/storyProgress'
import { toChapterId } from 'services/bookData'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'

describe('CharacterSheetMenu', () => {
  it('lists every sheet on the track and exposes save and restore actions', () => {
    const t01Sheet = createBlankBookSheet('T01')
    if (t01Sheet.bookId !== 'T01') {
      throw new Error('Expected the T01 sheet')
    }

    const savepoint: CharacterSavepoint = {
      bookId: 'T01',
      chapterId: toChapterId('T01', '10'),
      sheet: {
        bookId: 'T01',
        maxLife: 10,
        currentLife: 8,
        dexterity: 4,
        luck: 3,
        skills: ['Pisteur'],
        weaponsAndFeatures: '',
        inventory: [],
        inventoryOverflow: [],
        savepoints: [null, null, null],
      },
    }
    const track: StoryTrack = {
      id: 'track-1',
      name: 'Ma partie',
      visits: [createStoryVisit({ chapterId: 'T01-10' }, 'start')],
      checkedCheckboxIds: [],
      revealedMapPathIds: [],
      characterSheet: {
        ...createCharacterSheetState('T01', 'simplified'),
        sheets: {
          T01: { ...t01Sheet, savepoints: [null, null, null] },
          T03: createBlankBookSheet('T03'),
        },
      },
      savepoints: { T01: [savepoint, null, null] },
    }
    const onSaveAtSavepoint = vi.fn<(slotIndex: number) => boolean>(() => true)
    const onRestoreSavepoint = vi.fn<
      (bookId: BookId, slotIndex: number) => boolean
    >(() => true)

    renderWithProviders(
      <CharacterSheetMenu
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        activeTrack={track}
        currentBookId="T01"
        onSaveAtSavepoint={onSaveAtSavepoint}
        onRestoreSavepoint={onRestoreSavepoint}
      />,
    )

    expect(screen.getByText('Feuilles enregistrées')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'La harpe des quatres saisons' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Les entrailles du temps' }),
    ).toBeVisible()
    expect(screen.getByText('En cours')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Sauvegardes' })).toBeVisible()
    expect(screen.getByText(/Emplacement 1 — chapitre 10/)).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer dans l’emplacement 2' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }))

    expect(onSaveAtSavepoint).toHaveBeenCalledWith(1, undefined)
    expect(onRestoreSavepoint).toHaveBeenCalledWith('T01', 0)
  })
})
