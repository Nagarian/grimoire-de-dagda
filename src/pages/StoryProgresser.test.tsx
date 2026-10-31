import { UIProvider } from 'components/ui/UIProvider'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoryProgresser } from 'pages/StoryProgresser'
import { createStoryVisit, saveStoryProgress } from 'services/storyProgress'
import type { StoryProgressData } from 'services/storyProgress'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function renderStoryProgresser() {
  return render(
    <UIProvider>
      <StoryProgresser />
    </UIProvider>,
  )
}

describe('StoryProgresser', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts with an uncluttered prompt and keeps manual jump hidden', () => {
    renderStoryProgresser()

    expect(
      screen.getByRole('heading', { name: 'Commencez votre aventure' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Aller à un autre chapitre…' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Historique' }),
    ).not.toBeInTheDocument()
  })

  it('creates a named track, follows a choice, exposes history in the menu, and undoes', async () => {
    const user = userEvent.setup()
    renderStoryProgresser()

    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))
    await user.type(screen.getByLabelText('Nom (facultatif)'), 'Ma lecture')
    await user.click(screen.getByRole('button', { name: 'Créer le parcours' }))

    expect(
      await screen.findByRole('heading', { name: 'Chapitre 1' }),
    ).toBeInTheDocument()
    expect(
      window.localStorage.getItem('grimoire-de-dagda:story-progress'),
    ).toContain('Ma lecture')

    await user.click(screen.getByRole('button', { name: 'Chapitre 61' }))
    expect(
      await screen.findByRole('heading', { name: 'Chapitre 61' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Ouvrir le menu du parcours' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Historique' }),
    ).toBeVisible()
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 1'),
    ).toBeVisible()
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 61'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    await user.click(
      screen.getByRole('button', { name: 'Annuler la dernière étape' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Chapitre 1' }),
    ).toBeInTheDocument()
  })

  it('opens manual navigation only after the reader requests it', async () => {
    const progress: StoryProgressData = {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Ma lecture',
          visits: [
            createStoryVisit({ bookId: 'T01', chapterId: '1' }, 'start'),
          ],
        },
      ],
    }
    saveStoryProgress(progress)
    const user = userEvent.setup()
    renderStoryProgresser()

    expect(
      screen.queryByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Aller à un autre chapitre…' }),
    )

    expect(
      await screen.findByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).toBeVisible()
    expect(
      screen.getByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).toHaveTextContent('Livre')
  })

  it('keeps renaming and deleting track actions inside the menu', async () => {
    const user = userEvent.setup()
    renderStoryProgresser()
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))
    await user.type(screen.getByLabelText('Nom (facultatif)'), 'Avant')
    await user.click(screen.getByRole('button', { name: 'Créer le parcours' }))

    await user.click(
      screen.getByRole('button', { name: 'Ouvrir le menu du parcours' }),
    )
    const nameInput = screen.getByLabelText('Nom du parcours')
    await user.clear(nameInput)
    await user.type(nameInput, 'Après')
    await user.click(screen.getByRole('button', { name: 'Renommer' }))
    expect(screen.getByText('Après', { selector: 'p' })).toBeInTheDocument()

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(
      screen.getByRole('button', { name: 'Supprimer le parcours' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Commencez votre aventure' }),
    ).toBeInTheDocument()
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('shows storage errors instead of presenting a false successful save', async () => {
    const user = userEvent.setup()
    renderStoryProgresser()
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })

    await user.click(screen.getByRole('button', { name: 'Créer le parcours' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Storage disabled',
    )
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    expect(
      screen.getByRole('heading', { name: 'Commencez votre aventure' }),
    ).toBeInTheDocument()
  })
})
