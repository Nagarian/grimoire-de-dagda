import { UIProvider } from 'components/ui/UIProvider'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoryProgresser } from 'pages/StoryProgresser'
import { describe, expect, it } from 'vitest'

describe('StoryProgresser page', () => {
  it('composes the initial reader and opens the track drawer', async () => {
    const user = userEvent.setup()
    render(
      <UIProvider>
        <StoryProgresser />
      </UIProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Commencez votre aventure' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Créer un parcours' }))

    expect(
      await screen.findByRole('heading', { name: 'Menu du parcours' }),
    ).toBeVisible()
  })
})
