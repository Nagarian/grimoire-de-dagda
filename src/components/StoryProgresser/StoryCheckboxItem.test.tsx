import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StoryCheckbox } from 'services/storyCheckboxes'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { StoryCheckboxItem } from './StoryCheckboxItem'

const checkbox: StoryCheckbox = {
  id: '["T02","3","chapter","Chapitre 3"]',
  chapterId: 'T02-3',
  kind: 'chapter',
  label: 'Case du chapitre 3',
}

describe('StoryCheckboxItem', () => {
  it('renders checked state and delegates user toggles', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn<(checkboxId: string) => void>()
    renderWithProviders(
      <StoryCheckboxItem
        checkbox={checkbox}
        checked
        description="Suggérée par ce chapitre"
        onToggle={onToggle}
      />,
    )

    const input = screen.getByRole('checkbox', { name: checkbox.label })
    expect(input).toBeChecked()
    expect(screen.getByText('Suggérée par ce chapitre')).toBeVisible()
    await user.click(input)
    expect(onToggle).toHaveBeenCalledWith(checkbox.id)
  })
})
