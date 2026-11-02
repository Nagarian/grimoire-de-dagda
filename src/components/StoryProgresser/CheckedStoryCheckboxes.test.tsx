import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StoryCheckbox } from 'services/storyCheckboxes'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { CheckedStoryCheckboxes } from './CheckedStoryCheckboxes'

const checkboxes: StoryCheckbox[] = [
  {
    id: 'line-42',
    bookId: 'T02',
    chapterId: '42',
    kind: 'line',
    label: 'fanal brisé',
    destinationChapterId: '47',
  },
  {
    id: 'chapter-76',
    bookId: 'T02',
    chapterId: '76',
    kind: 'chapter',
    label: 'Chapitre 76',
  },
  {
    id: 'line-76-lala',
    bookId: 'T02',
    chapterId: '76',
    kind: 'line',
    label: 'Lala',
    destinationChapterId: '128',
  },
  {
    id: 'line-76-plouf',
    bookId: 'T02',
    chapterId: '76',
    kind: 'line',
    label: 'Plouf',
    destinationChapterId: '128',
  },
  {
    id: 'chapter-114',
    bookId: 'T02',
    chapterId: '114',
    kind: 'chapter',
    label: 'Chapitre 114',
  },
]

describe('CheckedStoryCheckboxes', () => {
  it('groups line boxes under their target chapter and shows unchecked siblings', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn<(checkboxId: string) => void>()
    const checkedCheckboxIds = [
      'line-42',
      'chapter-76',
      'line-76-plouf',
      'chapter-114',
    ]
    renderWithProviders(
      <CheckedStoryCheckboxes
        checkboxes={checkboxes}
        checkedCheckboxIds={checkedCheckboxIds}
        onToggle={onToggle}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'La confrérie de Nuada' }),
    ).toBeVisible()
    expect(screen.getByText('Chapitre 42')).toBeVisible()
    expect(screen.queryByText('Chapitre 47')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'fanal brisé' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Chapitre 76' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Lala' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Plouf' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Chapitre 114' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Lala' }))
    expect(onToggle).toHaveBeenCalledWith('line-76-lala')
  })

  it('explains when no boxes are checked', () => {
    renderWithProviders(
      <CheckedStoryCheckboxes
        checkboxes={[]}
        checkedCheckboxIds={[]}
        onToggle={vi.fn<(checkboxId: string) => void>()}
      />,
    )

    expect(screen.getByText('Aucune case cochée pour le moment.')).toBeVisible()
  })
})
