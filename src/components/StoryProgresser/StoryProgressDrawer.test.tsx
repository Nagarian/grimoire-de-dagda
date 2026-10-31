import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BookId } from 'services/books'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { StoryProgressDrawer } from './StoryProgressDrawer'

const track: StoryTrack = {
  id: 'track-1',
  name: 'Ma partie',
  visits: [createStoryVisit({ bookId: 'T01', chapterId: '1' }, 'start')],
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
    onCreateTrack: vi.fn<(name: string, bookId: BookId) => boolean>(() => true),
    onRenameTrack: vi.fn<(name: string) => boolean>(() => true),
    onDeleteTrack: vi.fn<() => boolean>(() => true),
    ...overrides,
  }
  renderWithProviders(<StoryProgressDrawer {...props} />)
  return props
}

describe('StoryProgressDrawer', () => {
  it('shows track history and surfaces errors', () => {
    renderDrawer({ error: 'Échec de sauvegarde' })

    expect(screen.getByRole('heading', { name: 'Historique' })).toBeVisible()
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 1'),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Échec de sauvegarde')
  })

  it('creates a track and closes after a successful callback', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()

    await user.type(
      screen.getByLabelText('Nom (facultatif)'),
      'Nouvelle partie',
    )
    await user.click(screen.getByRole('button', { name: 'Créer le parcours' }))

    expect(props.onCreateTrack).toHaveBeenCalledWith('Nouvelle partie', 'T01')
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not close when track creation fails', async () => {
    const user = userEvent.setup()
    const props = renderDrawer({
      onCreateTrack: vi.fn<(name: string, bookId: BookId) => boolean>(
        () => false,
      ),
    })

    await user.click(screen.getByRole('button', { name: 'Créer le parcours' }))

    expect(props.onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('renames and requests confirmation before deleting a track', async () => {
    const user = userEvent.setup()
    const props = renderDrawer()
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
