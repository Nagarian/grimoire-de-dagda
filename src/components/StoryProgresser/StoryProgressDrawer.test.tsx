import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import type { BookId } from 'services/books'
import { createStoryVisit } from 'services/storyProgress'
import { createCharacterSheetState } from 'services/characterSheet'
import type { GameMode } from 'services/characterSheet'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { StoryProgressDrawer } from './StoryProgressDrawer'

const track: StoryTrack = {
  id: 'track-1',
  name: 'Ma partie',
  visits: [createStoryVisit({ chapterId: 'T01-1' }, 'start')],
  checkedCheckboxIds: [],
  revealedMapPathIds: [],
  characterSheet: createCharacterSheetState('T01', 'storytelling'),
}

function renderDrawer(
  overrides: Partial<Parameters<typeof StoryProgressDrawer>[0]> = {},
) {
  const props: Parameters<typeof StoryProgressDrawer>[0] = {
    open: true,
    onOpenChange: vi.fn<(open: boolean) => void>(),
    tracks: [track],
    activeTrack: track,
    onChangeTrack: vi.fn<(trackId: string) => void>(),
    onCreateTrack: vi.fn<
      (name: string, bookId: BookId, gameMode: GameMode) => boolean
    >(() => true),
    onRenameTrack: vi.fn<(name: string) => boolean>(() => true),
    onDeleteTrack: vi.fn<() => boolean>(() => true),
    onToggleCheckbox: vi.fn<(checkboxId: string) => boolean>(() => true),
    ...overrides,
  }
  renderWithProviders(<StoryProgressDrawer {...props} />)
  return props
}

describe('StoryProgressDrawer', () => {
  it('keeps the active track visible and hides history behind its accordion', async () => {
    const user = userEvent.setup()
    renderDrawer({ error: 'Échec de sauvegarde' })

    expect(
      screen.getByRole('combobox', { name: 'Parcours actif' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Historique' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await user.click(screen.getByRole('button', { name: 'Historique' }))
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 1'),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Échec de sauvegarde')
  })

  it('lists checked boxes in its accordion and delegates unchecking', async () => {
    const user = userEvent.setup()
    const checkbox = getChapterStoryCheckboxes({
      chapterId: 'T02-3',
    })[0]
    const onToggleCheckbox = vi.fn<(checkboxId: string) => boolean>(() => true)
    renderDrawer({
      activeTrack: { ...track, checkedCheckboxIds: [checkbox.id] },
      onToggleCheckbox,
    })

    await user.click(screen.getByRole('button', { name: 'Cases cochées' }))
    const checkboxInput = screen.getByRole('checkbox', {
      name: checkbox.label,
    })
    expect(checkboxInput).toBeChecked()
    await user.click(checkboxInput)
    expect(onToggleCheckbox).toHaveBeenCalledWith(checkbox.id)
  })

  it('creates a track and closes after a successful callback', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()

    await user.click(screen.getByRole('button', { name: 'Nouvelle partie' }))
    await user.type(
      screen.getByLabelText('Nom (facultatif)'),
      'Nouvelle partie',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Mode de jeu' }),
      'storytelling',
    )
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(props.onCreateTrack).toHaveBeenCalledWith(
      'Nouvelle partie',
      'T01',
      'storytelling',
    )
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not close when track creation fails', async () => {
    const user = userEvent.setup()
    const props = renderDrawer({
      onCreateTrack: vi.fn<
        (name: string, bookId: BookId, gameMode: GameMode) => boolean
      >(() => false),
    })

    await user.click(screen.getByRole('button', { name: 'Nouvelle partie' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Mode de jeu' }),
      'storytelling',
    )
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(props.onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('renames and requests confirmation before deleting a track', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()
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
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})
