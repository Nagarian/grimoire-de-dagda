import { UIProvider } from 'components/ui/UIProvider'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoryProgresser } from 'pages/StoryProgresser'
import { describe, expect, it, vi } from 'vitest'

describe('StoryProgresser page', () => {
  it('directs the reader to settings to create or select a track', async () => {
    const user = userEvent.setup()
    const onOpenSettings = vi.fn<() => void>()
    render(
      <UIProvider>
        <StoryProgresser onOpenSettings={onOpenSettings} />
      </UIProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Commencez votre aventure' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Gérer les parcours dans les paramètres',
      }),
    )
    expect(onOpenSettings).toHaveBeenCalledOnce()
  })
})
