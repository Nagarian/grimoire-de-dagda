import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import { createCharacterSheetState } from 'services/characterSheet'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryTrack } from 'services/storyProgress'
import { renderWithProviders } from 'test/renderWithProviders'
import { StoryProgressDetailsDrawer } from './StoryProgressDetailsDrawer'

const track: StoryTrack = {
  id: 'track-1',
  name: 'Ma partie',
  visits: [
    createStoryVisit({ chapterId: 'T01-1' }, 'start'),
    createStoryVisit({ chapterId: 'T01-2' }, 'choice'),
  ],
  checkedCheckboxIds: [],
  revealedMapPathIds: [],
  characterSheet: createCharacterSheetState('T01', 'storytelling'),
}

describe('StoryProgressDetailsDrawer', () => {
  it('shows the history and checked checkbox controls', async () => {
    const user = userEvent.setup()
    const checkbox = getChapterStoryCheckboxes({ chapterId: 'T02-3' })[0]
    const onToggleCheckbox = vi.fn<(checkboxId: string) => boolean>(() => true)

    renderWithProviders(
      <StoryProgressDetailsDrawer
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        activeTrack={{
          ...track,
          checkedCheckboxIds: [checkbox.id],
        }}
        bookId="T01"
        onToggleCheckbox={onToggleCheckbox}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Historique' }))
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 1'),
    ).toBeVisible()
    expect(
      screen.getByText('La harpe des quatres saisons — chapitre 2'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Cases cochées' }))
    const checkboxInput = screen.getByRole('checkbox', {
      name: checkbox.label,
    })
    expect(checkboxInput).toBeChecked()
    await user.click(checkboxInput)
    expect(onToggleCheckbox).toHaveBeenCalledWith(checkbox.id)
  })
})
