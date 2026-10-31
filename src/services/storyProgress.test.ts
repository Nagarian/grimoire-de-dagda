import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStoryVisit,
  getCurrentPosition,
  getStoryTrackRuntime,
  loadStoryProgress,
  saveStoryProgress,
} from 'services/storyProgress'
import type { StoryProgressData, StoryVisit } from 'services/storyProgress'

describe('story progress persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns an empty state when storage has no saved progress', () => {
    expect(loadStoryProgress()).toEqual({
      version: 1,
      activeTrackId: null,
      tracks: [],
    })
  })

  it('round-trips named tracks and ordered chapter visits', () => {
    const progress: StoryProgressData = {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Ma partie',
          visits: [
            createStoryVisit({ bookId: 'T01', chapterId: '1' }, 'start'),
          ],
        },
      ],
    }

    saveStoryProgress(progress)

    expect(loadStoryProgress()).toEqual(progress)
  })

  it('rejects malformed JSON and unsupported or invalid saved data', () => {
    window.localStorage.setItem('grimoire-de-dagda:story-progress', '{')
    expect(() => loadStoryProgress()).toThrow('illisibles')

    window.localStorage.setItem(
      'grimoire-de-dagda:story-progress',
      JSON.stringify({ version: 2, activeTrackId: null, tracks: [] }),
    )
    expect(() => loadStoryProgress()).toThrow('pas valides')

    window.localStorage.setItem(
      'grimoire-de-dagda:story-progress',
      JSON.stringify({
        version: 1,
        activeTrackId: 'track-1',
        tracks: [
          {
            id: 'track-1',
            name: 'Partie',
            visits: [{ bookId: 'T99', chapterId: '1', via: 'start' }],
          },
        ],
      }),
    )
    expect(() => loadStoryProgress()).toThrow('pas valides')
  })

  it('surfaces localStorage write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })

    expect(() =>
      saveStoryProgress({ version: 1, activeTrackId: null, tracks: [] }),
    ).toThrow('Storage disabled')
  })
})

describe('story track runtime', () => {
  it('returns the last visit as the current position', () => {
    const visits = [
      createStoryVisit({ bookId: 'T01', chapterId: '1' }, 'start'),
      createStoryVisit({ bookId: 'T01', chapterId: '61' }, 'choice'),
    ]

    const track = { id: 'track-1', name: 'Test', visits }
    expect(getCurrentPosition(track)).toEqual({
      bookId: 'T01',
      chapterId: '61',
    })
    expect(getCurrentPosition({ ...track, visits: [] })).toBeUndefined()
  })

  it('captures E01 localisation and preserves the active RO return', () => {
    const visits = [
      createStoryVisit({ bookId: 'T03', chapterId: '1' }, 'start'),
      {
        ...createStoryVisit({ bookId: 'E01', chapterId: '16' }, 'manual'),
      },
    ]

    expect(visits.at(-1)?.setLocalisation).toBe('12')
    expect(getStoryTrackRuntime(visits).localisation).toBe('12')
  })

  it('clears the return destination after an RO return', () => {
    const returnTo = { bookId: 'T03' as const, chapterId: '164' }
    const visits: StoryVisit[] = [
      createStoryVisit({ bookId: 'T03', chapterId: '1' }, 'start'),
      createStoryVisit({ bookId: 'E01', chapterId: '1' }, 'ro-entry', returnTo),
      createStoryVisit(returnTo, 'ro-return'),
    ]

    expect(getStoryTrackRuntime(visits).returnTo).toBeUndefined()
  })

  it('accepts a valid cross-book journey and a recorded localisation', () => {
    const returnTo = { bookId: 'T03' as const, chapterId: '164' }
    const progress: StoryProgressData = {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Test',
          visits: [
            createStoryVisit({ bookId: 'T03', chapterId: '1' }, 'start'),
            createStoryVisit(
              { bookId: 'E01', chapterId: '16' },
              'ro-entry',
              returnTo,
            ),
          ],
        },
      ],
    }

    saveStoryProgress(progress)
    expect(loadStoryProgress()).toEqual(progress)
  })
})

const startVisit = { bookId: 'T01', chapterId: '1', via: 'start' }
const invalidProgressPayloads: { name: string; value: unknown }[] = [
  { name: 'a null root', value: null },
  {
    name: 'a non-array tracks field',
    value: { version: 1, activeTrackId: null, tracks: {} },
  },
  {
    name: 'a non-object track',
    value: { version: 1, activeTrackId: 'track-1', tracks: [null] },
  },
  {
    name: 'an empty track id',
    value: {
      version: 1,
      activeTrackId: '',
      tracks: [{ id: '', name: 'Partie', visits: [startVisit] }],
    },
  },
  {
    name: 'a duplicate track id',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        { id: 'track-1', name: 'Une', visits: [startVisit] },
        { id: 'track-1', name: 'Deux', visits: [startVisit] },
      ],
    },
  },
  {
    name: 'a blank track name',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [{ id: 'track-1', name: ' ', visits: [startVisit] }],
    },
  },
  {
    name: 'a non-array visits field',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [{ id: 'track-1', name: 'Partie', visits: {} }],
    },
  },
  {
    name: 'an empty visit list',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [{ id: 'track-1', name: 'Partie', visits: [] }],
    },
  },
  {
    name: 'a non-object visit',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [{ id: 'track-1', name: 'Partie', visits: [null] }],
    },
  },
  {
    name: 'an unknown book',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ bookId: 'T99', chapterId: '1', via: 'start' }],
        },
      ],
    },
  },
  {
    name: 'an unknown chapter',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ bookId: 'T01', chapterId: 'unknown', via: 'start' }],
        },
      ],
    },
  },
  {
    name: 'an invalid visit type',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ ...startVisit, via: 'teleport' }],
        },
      ],
    },
  },
  {
    name: 'a track that does not start with a start visit',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ ...startVisit, via: 'choice' }],
        },
      ],
    },
  },
  {
    name: 'a non-string localisation',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ ...startVisit, setLocalisation: 12 }],
        },
      ],
    },
  },
  {
    name: 'an unknown localisation chapter',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [{ ...startVisit, setLocalisation: 'unknown' }],
        },
      ],
    },
  },
  {
    name: 'a royaume entry without a return position',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [
            startVisit,
            { bookId: 'E01', chapterId: '1', via: 'ro-entry' },
          ],
        },
      ],
    },
  },
  {
    name: 'a royaume return without an active entry',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [
            startVisit,
            { bookId: 'T03', chapterId: '164', via: 'ro-return' },
          ],
        },
      ],
    },
  },
  {
    name: 'a royaume return to a different position',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [
            startVisit,
            {
              bookId: 'E01',
              chapterId: '1',
              via: 'ro-entry',
              returnTo: { bookId: 'T03', chapterId: '164' },
            },
            { bookId: 'T03', chapterId: '165', via: 'ro-return' },
          ],
        },
      ],
    },
  },
  {
    name: 'a royaume return with another return position',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [
            startVisit,
            {
              bookId: 'E01',
              chapterId: '1',
              via: 'ro-entry',
              returnTo: { bookId: 'T03', chapterId: '164' },
            },
            {
              bookId: 'T03',
              chapterId: '164',
              via: 'ro-return',
              returnTo: { bookId: 'T01', chapterId: '1' },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'a non-entry visit with a return position',
    value: {
      version: 1,
      activeTrackId: 'track-1',
      tracks: [
        {
          id: 'track-1',
          name: 'Partie',
          visits: [
            startVisit,
            {
              bookId: 'T01',
              chapterId: '61',
              via: 'choice',
              returnTo: { bookId: 'T01', chapterId: '1' },
            },
          ],
        },
      ],
    },
  },
  {
    name: 'an active id not present in the tracks',
    value: {
      version: 1,
      activeTrackId: 'missing',
      tracks: [{ id: 'track-1', name: 'Partie', visits: [startVisit] }],
    },
  },
  {
    name: 'an active id with the wrong type',
    value: {
      version: 1,
      activeTrackId: 1,
      tracks: [{ id: 'track-1', name: 'Partie', visits: [startVisit] }],
    },
  },
  {
    name: 'an empty track list with an active id',
    value: { version: 1, activeTrackId: 'track-1', tracks: [] },
  },
  {
    name: 'a non-empty track list without an active id',
    value: {
      version: 1,
      activeTrackId: null,
      tracks: [{ id: 'track-1', name: 'Partie', visits: [startVisit] }],
    },
  },
]

describe('saved progress validation', () => {
  it.each(invalidProgressPayloads)('rejects $name', ({ value }) => {
    window.localStorage.setItem(
      'grimoire-de-dagda:story-progress',
      JSON.stringify(value),
    )

    expect(() => loadStoryProgress()).toThrow('pas valides')
  })
})
