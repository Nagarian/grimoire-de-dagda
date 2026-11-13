import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getBookData } from 'services/bookData'
import { getLocalizedBookTitle } from 'services/i18n'
import { createStoryVisit, saveStoryProgress } from 'services/storyProgress'
import { createCharacterSheetState } from 'services/characterSheet'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('components/StoryDisplayer', () => ({
  StoryDisplayer: () => null,
}))

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows page icons and keeps the active book across pages', async () => {
    const user = userEvent.setup()
    const startId = getBookData('T03').startId
    if (!startId) {
      throw new Error('Expected T03 to have a START chapter')
    }
    saveStoryProgress({
      version: 8,
      activeTrackId: 'active-track',
      tracks: [
        {
          id: 'active-track',
          name: 'Ma partie',
          visits: [createStoryVisit({ chapterId: startId }, 'start')],
          checkedCheckboxIds: [],
          revealedMapPathIds: [],
          characterSheet: createCharacterSheetState('T03', 'storytelling'),
          savepoints: {},
        },
      ],
      uiState: {
        currentPage: 'story-progresser',
        storyDetailsAccordion: [],
      },
    })

    render(<App />)
    const characterSheetTab = screen.getByRole('tab', {
      name: 'Personnage',
    })
    expect(characterSheetTab.querySelector('svg')).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Progression' }).querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('tab', { name: 'Livres' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Paramètres' }).querySelector('svg'),
    ).toBeInTheDocument()

    await user.click(characterSheetTab)
    expect(
      screen
        .getByRole('banner')
        .querySelector('button[aria-label="Lancer les dés"]'),
    ).toBeInTheDocument()
    expect(screen.getByText(getLocalizedBookTitle('T03'))).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: 'Ouvrir les feuilles enregistrées et les sauvegardes',
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'Feuilles enregistrées' }),
    ).toBeVisible()
    expect(screen.getByText('En cours')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))

    await user.click(screen.getByRole('tab', { name: 'Progression' }))
    expect(
      screen.queryByRole('button', { name: 'Lancer les dés' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('tab', { name: 'Livres' }),
    )

    expect(screen.getByRole('combobox')).toHaveTextContent(
      getLocalizedBookTitle('T03'),
    )
    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem('grimoire-de-dagda:story-progress')!,
      )
      expect(saved.uiState.currentPage).toBe('book-visualizer')
    })
  }, 10_000)

  it('restores the last displayed page from the save', () => {
    saveStoryProgress({
      version: 8,
      activeTrackId: null,
      tracks: [],
      uiState: {
        currentPage: 'settings',
        storyDetailsAccordion: [],
      },
    })

    render(<App />)

    expect(screen.getByRole('tab', { name: 'Paramètres' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
