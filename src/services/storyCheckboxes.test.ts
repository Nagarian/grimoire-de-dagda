import { describe, expect, it } from 'vitest'
import { getBookData } from 'services/bookData'
import { books } from 'services/books'
import type { ChapterId } from 'services/chapterDsl'
import {
  getAllStoryCheckboxes,
  getChapterStoryCheckboxes,
  getStoryCheckboxSuggestions,
} from 'services/storyCheckboxes'

describe('story checkboxes', () => {
  it('finds chapter and line boxes while preserving labels exactly', () => {
    const checkboxes = getChapterStoryCheckboxes({
      chapterId: 'T05-76',
    })

    expect(checkboxes.map(checkbox => [checkbox.kind, checkbox.label])).toEqual(
      [
        ['chapter', 'Chapitre 76'],
        ['line', 'Défi UN'],
        ['line', '8'],
      ],
    )
    expect(checkboxes.filter(item => item.kind === 'line')).toMatchObject([
      { destinationChapterId: 'T05-43' },
      { destinationChapterId: 'T05-8' },
    ])
  })

  it('resolves TC and TLC suggestions to their exact declared checkboxes', () => {
    const chapterSuggestion = getStoryCheckboxSuggestions({
      chapterId: 'T02-104',
    }).find(suggestion => suggestion.checkbox.chapterId === 'T02-8')
    const lineSuggestion = getStoryCheckboxSuggestions({
      chapterId: 'T05-43',
    }).find(suggestion => suggestion.checkbox.chapterId === 'T05-76')

    expect(chapterSuggestion).toMatchObject({
      source: 'TC',
      checkbox: { kind: 'chapter', chapterId: 'T02-8' },
    })
    expect(lineSuggestion).toMatchObject({
      source: 'TLC',
      checkbox: { kind: 'line', chapterId: 'T05-76', label: 'Défi UN' },
    })
  })

  it('uses the source chapter number for an unlabeled TLC reference', () => {
    const suggestion = getStoryCheckboxSuggestions({
      chapterId: 'T05-253',
    }).find(item => item.checkbox.chapterId === 'T05-60')

    expect(suggestion?.checkbox.label).toBe('253')
  })

  it('resolves a labeled TLC reference to its declared line checkbox', () => {
    const suggestion = getStoryCheckboxSuggestions({
      chapterId: 'T05-186',
    })[0]

    expect(suggestion).toMatchObject({
      source: 'TLC',
      checkbox: { kind: 'line', chapterId: 'T05-186', label: '276' },
    })
  })

  it('builds checkbox definitions and resolves valid book suggestions', () => {
    for (const book of books) {
      const data = getBookData(book.id)
      for (const chapter of data.chapters) {
        expect(() =>
          getChapterStoryCheckboxes({
            chapterId: chapter.id,
          }),
        ).not.toThrow()
      }
    }

    expect(getAllStoryCheckboxes().length).toBeGreaterThan(0)
    expect(getAllStoryCheckboxes()).toBe(getAllStoryCheckboxes())

    const knownInvalidSuggestions = new Set(['T05-263'])
    const validSuggestionPositions = books.flatMap(book =>
      getBookData(book.id)
        .chapters.filter(chapter => !knownInvalidSuggestions.has(chapter.id))
        .map(chapter => ({ chapterId: chapter.id })),
    )
    for (const position of validSuggestionPositions) {
      expect(() => getStoryCheckboxSuggestions(position)).not.toThrow()
    }
  })

  it('reports dangling T05 TLC markers with their chapter context', () => {
    const knownInvalidSuggestions: { chapterId: ChapterId; message: string }[] =
      [
        {
          chapterId: 'T05-263',
          message:
            'TLC marker in T05-263 points to missing line checkbox 263 in chapter 250',
        },
      ]

    for (const { chapterId, message } of knownInvalidSuggestions) {
      expect(() => getStoryCheckboxSuggestions({ chapterId })).toThrow(message)
    }
  })
})
