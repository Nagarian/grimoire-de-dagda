import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getBookData } from 'services/bookData'
import { createStoryVisit, saveStoryProgress } from 'services/storyProgress'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('components/StoryDisplayer', () => ({
  StoryDisplayer: () => null,
}))

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults the visualizer to the active story book', async () => {
    const user = userEvent.setup()
    const startId = getBookData('T03').startId
    saveStoryProgress({
      version: 2,
      activeTrackId: 'active-track',
      tracks: [
        {
          id: 'active-track',
          name: 'Ma partie',
          visits: [
            createStoryVisit({ bookId: 'T03', chapterId: startId }, 'start'),
          ],
          checkedCheckboxIds: [],
        },
      ],
    })

    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Book Tree Vizualizer' }))

    expect(screen.getByRole('combobox')).toHaveTextContent(
      getBookData('T03').title,
    )
  })
})
