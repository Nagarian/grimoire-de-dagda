import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CharacterSheetMenu } from 'components/CharacterSheet/CharacterSheetMenu'
import {
  createCharacterSheetState,
  createBlankBookSheet,
} from 'services/characterSheet'
import type { ChapterId } from 'services/chapterDsl'
import type { T01Savepoint } from 'services/characterSheet'
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

    const savepoint: T01Savepoint = {
      markerChapterId: toChapterId('T01', '10'),
      resumeChapterId: toChapterId('T01', '25'),
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
      },
      gameMode: 'storytelling',
    }
    const track: StoryTrack = {
      id: 'track-1',
      name: 'Ma partie',
      visits: [createStoryVisit({ chapterId: 'T01-10' }, 'start')],
      checkedCheckboxIds: [],
      revealedMapPathIds: [],
      characterSheet: {
        ...createCharacterSheetState('T01', 'storytelling'),
        sheets: {
          T01: { ...t01Sheet, savepoints: [savepoint, null, null] },
          T03: createBlankBookSheet('T03'),
        },
      },
    }
    const onSaveAtSavepoint = vi.fn<
      (
        markerChapterId: ChapterId,
        resumeChapterId: ChapterId,
        slotIndex: number,
      ) => boolean
    >(() => true)
    const onRestoreSavepoint = vi.fn<(slotIndex: number) => boolean>(() => true)

    renderWithProviders(
      <CharacterSheetMenu
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        activeTrack={track}
        currentBookId="T01"
        savepointContext={{
          markerChapterId: toChapterId('T01', '10'),
          resumeChapterId: toChapterId('T01', '25'),
        }}
        onSaveAtSavepoint={onSaveAtSavepoint}
        onRestoreSavepoint={onRestoreSavepoint}
      />,
    )

    expect(screen.getByText('Feuilles enregistrées')).toBeVisible()
    expect(screen.getByText('La harpe des quatres saisons')).toBeVisible()
    expect(screen.getByText('Les entrailles du temps')).toBeVisible()
    expect(screen.getByText('En cours')).toBeVisible()
    expect(screen.getByText('Sauvegardes du tome 1')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Remplacer la sauvegarde 1' }),
    ).toBeEnabled()
    expect(
      screen.getByText(/Sauvegarde 1 — chapitre 10, reprise au 25/),
    ).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer dans l’emplacement 2' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }))

    expect(onSaveAtSavepoint).toHaveBeenCalledWith(
      toChapterId('T01', '10'),
      toChapterId('T01', '25'),
      1,
    )
    expect(onRestoreSavepoint).toHaveBeenCalledWith(0)
  })
})
