import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { BookLayout } from 'services/graphLayout'
import { getBookLayout } from 'services/graphLayout'
import { renderWithProviders } from 'test/renderWithProviders'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StoryDisplayer } from './index'
import type { Rect } from './usePanZoom'

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('services/graphLayout', () => ({
  getBookLayout: vi.fn<typeof getBookLayout>(),
}))

vi.mock('./usePanZoom', () => ({
  usePanZoom: () => ({
    fit: vi.fn<() => void>(),
    zoomBy: vi.fn<(factor: number) => void>(),
    focusOn: vi.fn<(target: Rect) => void>(),
    centerOn: vi.fn<(x: number, y: number) => void>(),
    subscribe: vi.fn<(listener: (viewport: Rect) => void) => () => void>(() =>
      vi.fn<() => void>(),
    ),
  }),
}))

const layout: BookLayout = {
  width: 200,
  height: 200,
  nodes: [
    {
      id: 'T01-1',
      label: '1',
      shape: 'circle',
      classNames: [],
      badges: [],
      x: 20,
      y: 20,
      width: 60,
      height: 60,
    },
    {
      id: 'T01-7',
      label: '7',
      shape: 'circle',
      classNames: [],
      badges: [],
      x: 100,
      y: 100,
      width: 60,
      height: 60,
    },
  ],
  edges: [
    {
      id: 'hidden-T01-1-T01-7',
      source: 'T01-1',
      target: 'T01-7',
      hidden: true,
      points: [
        { x: 50, y: 80 },
        { x: 130, y: 100 },
      ],
    },
  ],
  groups: [],
  usedTypes: [],
}

describe('StoryDisplayer hidden paths', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    vi.mocked(getBookLayout).mockResolvedValue(layout)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('draws the hidden edge, conceals its target label, and reveals it in search results', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<StoryDisplayer bookId="T01" />)

    await screen.findByRole('img', { name: 'Arbre des chapitres' })
    await waitFor(() => {
      expect(container.querySelector('.story-edges path')).toBeInTheDocument()
    })
    expect(
      container.querySelector('#chapter-T01-7 .chapter-label'),
    ).toHaveClass('chapter-label-hidden')
    expect(container.querySelector('svg.story-graph')).not.toHaveClass(
      'reveal-hidden',
    )

    const revealButton = screen.getByRole('button', {
      name: 'Révéler les éléments cachés',
    })
    expect(revealButton).toHaveAttribute('aria-pressed', 'false')
    await user.click(revealButton)
    expect(container.querySelector('svg.story-graph')).toHaveClass(
      'reveal-hidden',
    )
    expect(
      container.querySelector('#chapter-T01-7 .chapter-label'),
    ).toHaveClass('chapter-label-hidden')
    expect(
      screen.getByRole('button', { name: 'Masquer les éléments cachés' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(
      screen.getByRole('button', { name: 'Aller à un chapitre' }),
    )
    await user.type(
      await screen.findByRole('spinbutton', { name: 'Numéro du chapitre' }),
      '7',
    )

    await waitFor(() => {
      expect(
        container.querySelector('.story-selection .chapter-label'),
      ).toHaveTextContent('7')
    })
  })

  it('renders book-colored group boundaries in the combined graph', async () => {
    vi.mocked(getBookLayout).mockResolvedValue({
      ...layout,
      groups: [
        {
          id: 'T01',
          color: '#053cd4',
          x: 10,
          y: 10,
          width: 180,
          height: 180,
        },
      ],
    })
    const { container } = renderWithProviders(
      <StoryDisplayer bookId="ALL_BOOKS" />,
    )

    await screen.findByRole('img', { name: 'Arbre des chapitres' })
    await waitFor(() => {
      expect(container.querySelector('.story-book-group rect')).toHaveAttribute(
        'fill',
        '#053cd4',
      )
    })
    expect(
      container.querySelector('.story-book-group-label'),
    ).toHaveTextContent('T01 — La harpe des quatres saisons')
  })
})
