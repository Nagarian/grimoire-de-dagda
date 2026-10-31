import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from 'test/renderWithProviders'
import { ManualChapterDialog } from './ManualChapterDialog'

describe('ManualChapterDialog', () => {
  it('stays closed until requested and submits the selected position', async () => {
    const user = userEvent.setup()
    const onJump = vi.fn<() => boolean>(() => true)
    renderWithProviders(
      <ManualChapterDialog
        currentPosition={{ bookId: 'T01', chapterId: '1' }}
        onJump={onJump}
      />,
    )

    expect(
      screen.queryByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Aller à un autre chapitre…' }),
    )
    expect(
      await screen.findByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Ajouter au parcours' }),
    )

    expect(onJump).toHaveBeenCalledWith({ bookId: 'T01', chapterId: '1' })
    expect(
      screen.queryByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).not.toBeInTheDocument()
  }, 15_000)

  it('keeps the dialog open when jumping fails', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ManualChapterDialog onJump={vi.fn<() => boolean>(() => false)} />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Aller à un autre chapitre…' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Ajouter au parcours' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Aller à un autre chapitre' }),
    ).toBeVisible()
  })
})
