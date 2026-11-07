import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getBookData } from 'services/bookData'
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
      version: 6,
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
    })

    render(<App />)
    const characterSheetTab = screen.getByRole('tab', {
      name: 'Character Sheet',
    })
    expect(characterSheetTab.querySelector('svg')).toBeInTheDocument()
    expect(
      screen
        .getByRole('tab', { name: 'Story Progresser' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('tab', { name: 'Book Tree Vizualizer' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Settings' }).querySelector('svg'),
    ).toBeInTheDocument()

    await user.click(characterSheetTab)
    expect(
      screen
        .getByRole('banner')
        .querySelector('button[aria-label="Lancer les dés"]'),
    ).toBeInTheDocument()
    expect(screen.getByText(getBookData('T03').title)).toBeInTheDocument()
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

    await user.click(screen.getByRole('tab', { name: 'Story Progresser' }))
    expect(
      screen.queryByRole('button', { name: 'Lancer les dés' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Book Tree Vizualizer' }))

    expect(screen.getByRole('combobox')).toHaveTextContent(
      getBookData('T03').title,
    )
  }, 10_000)
})
