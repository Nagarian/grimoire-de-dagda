import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CharacterSheetDrawer } from './CharacterSheetDrawer'
import { createBlankBookSheet } from 'services/characterSheet'
import type {
  BookCharacterSheet,
  E01CharacterSheet,
  GameMode,
  T05CharacterSheet,
} from 'services/characterSheet'
import type { ChapterId } from 'services/chapterDsl'
import { renderWithProviders } from 'test/renderWithProviders'

function renderSheet(
  sheet: E01CharacterSheet | T05CharacterSheet,
  gameMode: 'storytelling' | 'simplified' | 'deadly' | null = 'storytelling',
) {
  const onUpdate = vi.fn<(sheet: BookCharacterSheet) => boolean>(() => true)
  renderWithProviders(
    <CharacterSheetDrawer
      open
      onOpenChange={vi.fn<(open: boolean) => void>()}
      bookId={sheet.bookId}
      sheet={sheet}
      gameMode={gameMode}
      onUpdate={onUpdate}
      onSetGameMode={vi.fn<(mode: GameMode) => boolean>(() => true)}
      onSaveAtSavepoint={vi.fn<
        (marker: ChapterId, resume: ChapterId, slot: number) => boolean
      >(() => true)}
      onRestoreSavepoint={vi.fn<(slot: number) => boolean>(() => true)}
      onRemoveCapsule={vi.fn<(index: number) => boolean>(() => true)}
    />,
  )
  return { onUpdate }
}

describe('CharacterSheetDrawer', () => {
  it('renders T05 sheet fields and applies the PDF stat limits', () => {
    const sheet = createBlankBookSheet('T05')
    if (sheet.bookId !== 'T05') {
      throw new Error('Expected the T05 sheet')
    }

    renderSheet(sheet)

    expect(screen.getByRole('combobox', { name: 'Mode de jeu' })).toHaveValue(
      'storytelling',
    )
    expect(screen.getByText('Histoire')).toBeVisible()
    expect(screen.getByLabelText('Corps')).toHaveAttribute('min', '4')
    expect(screen.getByLabelText('Corps')).toHaveAttribute('max', '10')
    expect(screen.getByText('Protection')).toBeVisible()
    expect(screen.getByText('Mémoires')).toBeVisible()
  })

  it('reports an invalid E01 localisation rather than silently ignoring it', () => {
    const sheet = createBlankBookSheet('E01')
    if (sheet.bookId !== 'E01') {
      throw new Error('Expected the E01 sheet')
    }
    const { onUpdate } = renderSheet(sheet, null)

    fireEvent.change(
      screen.getByLabelText('Prochain chapitre du Royaume des Ombres'),
      { target: { value: '9999' } },
    )

    expect(
      screen.getByText('Ce chapitre n’existe pas dans le Royaume des Ombres.'),
    ).toBeVisible()
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
