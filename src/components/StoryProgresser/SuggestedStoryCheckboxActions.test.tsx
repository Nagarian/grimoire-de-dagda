import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getStoryCheckboxSuggestions } from 'services/storyCheckboxes'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { SuggestedStoryCheckboxActions } from './SuggestedStoryCheckboxActions'

describe('SuggestedStoryCheckboxActions', () => {
  it('renders secondary-style actions and reflects checked state', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn<(checkboxId: string) => void>()
    const suggestion = getStoryCheckboxSuggestions({
      bookId: 'T02',
      chapterId: '104',
    }).find(item => item.checkbox.chapterId === '8')
    if (!suggestion) {
      throw new Error('Expected a checkbox suggestion for chapter 8')
    }

    const { unmount } = renderWithProviders(
      <SuggestedStoryCheckboxActions
        suggestions={[suggestion]}
        checkedCheckboxIds={[]}
        onToggle={onToggle}
      />,
    )

    const checkAction = screen.getByRole('button', {
      name: 'Cocher le chapitre 8',
    })
    expect(checkAction).toHaveAttribute('aria-pressed', 'false')
    await user.click(checkAction)
    expect(onToggle).toHaveBeenCalledWith(suggestion.checkbox.id)

    unmount()
    renderWithProviders(
      <SuggestedStoryCheckboxActions
        suggestions={[suggestion]}
        checkedCheckboxIds={[suggestion.checkbox.id]}
        onToggle={onToggle}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Décocher le chapitre 8' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
