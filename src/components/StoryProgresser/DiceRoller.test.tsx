import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'test/renderWithProviders'
import { describe, expect, it, vi } from 'vitest'
import { DiceRoller } from './DiceRoller'

function mockRandomWords(...words: number[]) {
  const pendingWords = [...words]
  vi.spyOn(window.crypto, 'getRandomValues').mockImplementation(array => {
    const word = pendingWords.shift()
    if (word === undefined) {
      throw new Error('No mocked random values remain')
    }

    new Uint32Array(array.buffer, array.byteOffset, 1)[0] = word
    return array
  })
}

function setReducedMotion(matches: boolean) {
  vi.mocked(window.matchMedia).mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn<MediaQueryList['addListener']>(),
    removeListener: vi.fn<MediaQueryList['removeListener']>(),
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
    dispatchEvent: vi.fn<MediaQueryList['dispatchEvent']>(),
  })
}

describe('DiceRoller', () => {
  it('rolls one die with animation and rejects out-of-range random values', async () => {
    setReducedMotion(false)
    mockRandomWords(0xffff_ffff, 4)

    renderWithProviders(<DiceRoller />)
    fireEvent.click(screen.getByRole('button', { name: 'Lancer les dés' }))
    await screen.findByRole('heading', { name: 'Lancer les dés' })
    fireEvent.click(screen.getByRole('button', { name: 'Lancer 1 dé' }))

    const die = screen.getByRole('img', { name: 'Dé en mouvement' })
    expect(die).toBeInTheDocument()
    expect(die.querySelectorAll('svg')).toHaveLength(6)
    expect(die).toHaveStyle({ perspective: '500px' })
    const cube = die.firstElementChild
    if (!cube) {
      throw new Error('Expected the die to contain a 3D cube')
    }
    expect(cube).toHaveStyle({ transformStyle: 'preserve-3d' })
    expect(screen.getByRole('status')).toHaveTextContent('Les dés roulent')
    expect(screen.getByRole('status')).not.toHaveTextContent('5')
    expect(screen.getByRole('button', { name: 'Lancer 1 dé' })).toBeDisabled()

    await waitFor(
      () => {
        expect(screen.getByRole('img', { name: 'Dé : 5' })).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent('Résultat : 5')
      },
      { timeout: 1_500 },
    )
    expect(screen.getByRole('button', { name: 'Lancer 1 dé' })).toBeEnabled()
  })

  it('rolls two dice and displays their sum without animation when reduced motion is preferred', async () => {
    setReducedMotion(true)
    mockRandomWords(0, 5)

    renderWithProviders(<DiceRoller />)
    fireEvent.click(screen.getByRole('button', { name: 'Lancer les dés' }))
    await screen.findByRole('heading', { name: 'Lancer les dés' })
    fireEvent.click(screen.getByRole('button', { name: 'Lancer 2 dés' }))

    const firstDie = screen.getByRole('img', { name: 'Dé : 1' })
    const secondDie = screen.getByRole('img', { name: 'Dé : 6' })
    expect(firstDie).toBeInTheDocument()
    expect(secondDie).toBeInTheDocument()
    const firstCube = firstDie.firstElementChild
    const secondCube = secondDie.firstElementChild
    if (!firstCube || !secondCube) {
      throw new Error('Expected both dice to contain 3D cubes')
    }
    expect(firstCube).toHaveStyle({ transformStyle: 'preserve-3d' })
    expect(secondCube).toHaveStyle({ transformStyle: 'preserve-3d' })
    expect(screen.getByRole('status')).toHaveTextContent('Total : 7')
    expect(screen.queryByText('Résultat : 1 et 6, total 7')).toBeNull()
    expect(screen.getByRole('button', { name: 'Lancer 1 dé' })).toBeEnabled()
  })
})
