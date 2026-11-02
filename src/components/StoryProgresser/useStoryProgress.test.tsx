import { act, renderHook } from '@testing-library/react'
import { getChapterStoryCheckboxes } from 'services/storyCheckboxes'
import { useStoryProgress } from './useStoryProgress'
import { beforeEach, describe, expect, it } from 'vitest'

describe('useStoryProgress checkbox state', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('keeps checked boxes per track and outside navigation undo', () => {
    const checkbox = getChapterStoryCheckboxes({
      bookId: 'T02',
      chapterId: '3',
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
      result.current.jumpTo({ bookId: 'T02', chapterId: '3' })
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
