import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Settings } from 'pages/Settings'
import { renderWithProviders } from 'test/renderWithProviders'

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
})
