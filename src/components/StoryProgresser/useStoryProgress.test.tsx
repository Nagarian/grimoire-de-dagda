import { act, renderHook } from '@testing-library/react'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import { getMapPathSuggestions } from 'services/storyMap'
import { useStoryProgress } from './useStoryProgress'
import { beforeEach, describe, expect, it } from 'vitest'

describe('useStoryProgress checkbox state', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('useStoryProgress map path state', () => {
    beforeEach(() => {
      window.localStorage.clear()
    })

    it('saves revealed HM paths per track without changing navigation history', () => {
      const suggestion = getMapPathSuggestions({
        chapterId: 'T05-29',
      }).find(item => item.targetChapterId === 'T05-329')
      if (!suggestion) {
        throw new Error('Expected chapter 29 to reveal chapter 329')
      }

      const { result } = renderHook(() => useStoryProgress())
      act(() => {
        result.current.createTrack('Première partie', 'T05')
      })
      const firstTrackId = result.current.activeTrack?.id
      if (!firstTrackId) {
        throw new Error('Expected the new track to be active')
      }
      const originalVisits = result.current.activeTrack?.visits
      act(() => {
        result.current.revealMapPath(suggestion.id)
      })

      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([
        suggestion.id,
      ])
      expect(result.current.activeTrack?.visits).toEqual(originalVisits)
      expect(
        JSON.parse(
          window.localStorage.getItem('grimoire-de-dagda:story-progress') ??
            '{}',
        ),
      ).toMatchObject({
        tracks: [{ revealedMapPathIds: [suggestion.id] }],
      })

      act(() => {
        result.current.createTrack('Deuxième partie', 'T01')
      })
      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([])

      act(() => {
        result.current.changeTrack(firstTrackId)
      })
      expect(result.current.activeTrack?.revealedMapPathIds).toEqual([
        suggestion.id,
      ])
    })
  })

  it('keeps checked boxes per track and outside navigation undo', () => {
    const checkbox = getChapterStoryCheckboxes({
      chapterId: 'T02-3',
    })[0]
    const { result } = renderHook(() => useStoryProgress())

    act(() => {
      result.current.createTrack('Première partie', 'T02')
    })
    const firstTrackId = result.current.activeTrack?.id
    if (!firstTrackId) {
      throw new Error('Expected the new track to be active')
    }

    act(() => {
      result.current.toggleCheckbox(checkbox.id)
    })
    act(() => {
      result.current.jumpTo({ chapterId: 'T02-3' })
    })
    act(() => {
      result.current.undoVisit()
    })

    expect(result.current.activeTrack?.visits).toHaveLength(1)
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([
      checkbox.id,
    ])

    act(() => {
      result.current.createTrack('Deuxième partie', 'T01')
    })
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([])

    act(() => {
      result.current.changeTrack(firstTrackId)
    })
    expect(result.current.activeTrack?.checkedCheckboxIds).toEqual([
      checkbox.id,
    ])
  })
})
