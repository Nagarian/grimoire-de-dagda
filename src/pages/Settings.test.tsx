import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Settings } from 'pages/Settings'
import { renderWithProviders } from 'test/renderWithProviders'
import { i18n } from 'services/i18n'

describe('Settings page', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates a track directly from the settings page', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Settings />)

    const header = screen.getByRole('banner')
    expect(header).toHaveTextContent('Paramètres')
    expect(header.querySelectorAll('button')).toHaveLength(0)
    expect(
      screen.getByRole('heading', { name: 'Gestion des parcours' }),
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Gestion des parcours' }),
    ).toBeVisible()
    expect(screen.getByRole('region', { name: 'Apparence' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Nouvelle partie' }))
    await user.click(screen.getByRole('radio', { name: 'Narratif' }))
    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(
      screen.getByRole('combobox', { name: 'Parcours actif' }),
    ).toHaveTextContent('Parcours 1')
  }, 15_000)

  it('changes and persists the application language', async () => {
    renderWithProviders(<Settings />)

    await i18n.changeLanguage('en')

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Track management' }),
      ).toBeVisible(),
    )
    expect(
      screen.getByRole('combobox', { name: 'Application language' }),
    ).toHaveTextContent('English')
    expect(window.localStorage.getItem('grimoire-de-dagda:locale')).toBe('en')
  })
})
