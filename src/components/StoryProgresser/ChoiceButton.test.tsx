import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StoryChoice } from 'services/storyNavigation'
import { renderWithProviders } from 'test/renderWithProviders'
import { ChoiceButton } from './ChoiceButton'

describe('ChoiceButton', () => {
  it('calls onChoose for an available destination', () => {
    const onChoose = vi.fn<(choice: StoryChoice) => void>()
    const choice: StoryChoice = {
      id: 'choice-1',
      kind: 'destination',
      label: 'Chapitre 61',
      position: { bookId: 'T01', chapterId: '61' },
      via: 'choice',
    }

    renderWithProviders(<ChoiceButton choice={choice} onChoose={onChoose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chapitre 61' }))

    expect(onChoose).toHaveBeenCalledWith(choice)
  })

  it('explains unavailable destinations and does not invoke onChoose', () => {
    const onChoose = vi.fn<(choice: StoryChoice) => void>()
    const choice: StoryChoice = {
      id: 'choice-2',
      kind: 'unavailable',
      label: 'Chapitre introuvable',
      reason: 'Ce chapitre ne figure pas dans les données du livre.',
    }

    renderWithProviders(<ChoiceButton choice={choice} onChoose={onChoose} />)

    expect(
      screen.getByRole('button', { name: 'Chapitre introuvable' }),
    ).toBeDisabled()
    expect(
      screen.getByText('Ce chapitre ne figure pas dans les données du livre.'),
    ).toBeInTheDocument()
    expect(onChoose).not.toHaveBeenCalled()
  })
})
