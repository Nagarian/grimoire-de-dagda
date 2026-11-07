import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BookId } from 'services/books'
import { createStoryVisit } from 'services/storyProgress'
import { createCharacterSheetState } from 'services/characterSheet'
import type { GameMode } from 'services/characterSheet'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { TrackManagementPanel } from './TrackManagementPanel'

const track: StoryTrack = {
  id: 'track-1',
  name: 'Ma partie',
  visits: [createStoryVisit({ chapterId: 'T01-1' }, 'start')],
  checkedCheckboxIds: [],
  revealedMapPathIds: [],
  characterSheet: createCharacterSheetState('T01', 'storytelling'),
  savepoints: {},
}

function renderPanel(
  overrides: Partial<Parameters<typeof TrackManagementPanel>[0]> = {},
) {
  const props: Parameters<typeof TrackManagementPanel>[0] = {
    tracks: [track],
    activeTrack: track,
    onChangeTrack: vi.fn<(trackId: string) => void>(),
    onCreateTrack: vi.fn<
      (name: string, bookId: BookId, gameMode: GameMode) => boolean
    >(() => true),
    onRenameTrack: vi.fn<(name: string) => boolean>(() => true),
    onDeleteTrack: vi.fn<() => boolean>(() => true),
    ...overrides,
  }
  renderWithProviders(<TrackManagementPanel {...props} />)
  return props
}

describe('TrackManagementPanel', () => {
  it('keeps the active track visible and reports errors', () => {
    renderPanel({ error: 'Échec de sauvegarde' })

    expect(
      screen.getByRole('combobox', { name: 'Parcours actif' }),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Échec de sauvegarde')
  })

  it('creates a track and clears the form after success', async () => {
    const user = userEvent.setup()
    const props = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Nouvelle partie' }))
    await user.type(
      screen.getByLabelText('Nom (facultatif)'),
      'Nouvelle partie',
    )
    await user.click(screen.getByRole('radio', { name: 'Narratif' }))
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(props.onCreateTrack).toHaveBeenCalledWith(
      'Nouvelle partie',
      'T01',
      'storytelling',
    )
    expect(screen.getByLabelText('Nom (facultatif)')).toHaveValue('')
  }, 15_000)

  it('keeps form values when track creation fails', async () => {
    const user = userEvent.setup()
    const props = renderPanel({
      onCreateTrack: vi.fn<
        (name: string, bookId: BookId, gameMode: GameMode) => boolean
      >(() => false),
    })

    await user.click(screen.getByRole('button', { name: 'Nouvelle partie' }))
    await user.click(screen.getByRole('radio', { name: 'Narratif' }))
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(props.onCreateTrack).toHaveBeenCalledOnce()
  }, 15_000)

  it('renames and requests confirmation before deleting a track', async () => {
    const user = userEvent.setup()
    const props = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Gérer le parcours' }))
    const renameInput = screen.getByLabelText('Nom du parcours')

    await user.clear(renameInput)
    await user.type(renameInput, 'Renommée')
    await user.click(screen.getByRole('button', { name: 'Renommer' }))
    expect(props.onRenameTrack).toHaveBeenCalledWith('Renommée')

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await user.click(
      screen.getByRole('button', { name: 'Supprimer le parcours' }),
    )
    expect(props.onDeleteTrack).not.toHaveBeenCalled()

    vi.mocked(window.confirm).mockReturnValue(true)
    await user.click(
      screen.getByRole('button', { name: 'Supprimer le parcours' }),
    )
    expect(props.onDeleteTrack).toHaveBeenCalledOnce()
  })
})
