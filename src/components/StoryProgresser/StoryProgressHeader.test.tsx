import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'test/renderWithProviders'
import { StoryProgressHeader } from './StoryProgressHeader'

describe('StoryProgressHeader', () => {
  it('shows fallback labels and disables undo without a previous visit', () => {
    renderWithProviders(
      <StoryProgressHeader canUndo={false} onUndo={vi.fn<() => void>()} />,
    )

    expect(screen.getByText('Votre aventure')).toBeInTheDocument()
    expect(screen.getByText('Choisissez votre départ')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Annuler la dernière étape' }),
    ).toBeDisabled()
  })

  it('renders the active track and book and calls the supplied actions', () => {
    const onUndo = vi.fn<() => void>()
    const onOpenProgressDetails = vi.fn<() => void>()
    renderWithProviders(
      <StoryProgressHeader
        trackName="Ma partie"
        bookTitle="Le livre"
        canUndo
        onUndo={onUndo}
        onOpenProgressDetails={onOpenProgressDetails}
      />,
    )

    expect(screen.getByText('Ma partie')).toBeInTheDocument()
    expect(screen.getByText('Le livre')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('button')
        .map(button => button.getAttribute('aria-label')),
    ).toEqual([
      'Annuler la dernière étape',
      'Afficher l’historique et les cases cochées',
    ])
    fireEvent.click(
      screen.getByRole('button', { name: 'Annuler la dernière étape' }),
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Afficher l’historique et les cases cochées',
      }),
    )

    expect(onUndo).toHaveBeenCalledOnce()
    expect(onOpenProgressDetails).toHaveBeenCalledOnce()
  })
})
