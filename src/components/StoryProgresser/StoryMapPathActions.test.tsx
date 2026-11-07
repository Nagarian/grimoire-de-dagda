import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getMapPathSuggestions } from 'services/storyMap'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { StoryMapPathActions } from './StoryMapPathActions'

describe('StoryMapPathActions', () => {
  it('reveals a hidden map path and marks an already revealed path', async () => {
    const user = userEvent.setup()
    const onReveal = vi.fn<(mapPathId: string) => void>()
    const suggestion = getMapPathSuggestions({
      bookId: 'T05',
      chapterId: '29',
    }).find(item => item.targetChapterId === '329')
    if (!suggestion) {
      throw new Error('Expected chapter 29 to reveal chapter 329')
    }

    const { unmount } = renderWithProviders(
      <StoryMapPathActions
        suggestions={[suggestion]}
        revealedMapPathIds={[]}
        onReveal={onReveal}
      />,
    )
    const button = screen.getByRole('button', {
      name: 'Révéler sur la carte : Le moulin noyé',
    })
    await user.click(button)
    expect(onReveal).toHaveBeenCalledWith(suggestion.id)

    unmount()
    renderWithProviders(
      <StoryMapPathActions
        suggestions={[suggestion]}
        revealedMapPathIds={[suggestion.id]}
        onReveal={onReveal}
      />,
    )
    expect(
      screen.getByRole('button', {
        name: 'Chemin révélé sur la carte : Le moulin noyé',
      }),
    ).toBeDisabled()
  })
})
