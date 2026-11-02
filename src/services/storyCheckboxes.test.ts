import { describe, expect, it } from 'vitest'
import { getBookData } from 'services/bookData'
import { books } from 'services/books'
import {
  getAllStoryCheckboxes,
  getChapterStoryCheckboxes,
  getStoryCheckboxSuggestions,
} from 'services/storyCheckboxes'

describe('story checkboxes', () => {
  it('finds chapter and line boxes while preserving labels exactly', () => {
    const checkboxes = getChapterStoryCheckboxes({
      bookId: 'T05',
      chapterId: '76',
    })

    expect(checkboxes.map(checkbox => [checkbox.kind, checkbox.label])).toEqual(
      [
        ['chapter', 'Chapitre 76'],
        ['line', 'Défi UN'],
        ['line', '8'],
      ],
    )
    expect(checkboxes.filter(item => item.kind === 'line')).toMatchObject([
      { destinationChapterId: '43' },
      { destinationChapterId: '8' },
    ])
  })

  it('resolves TC and TLC suggestions to their exact declared checkboxes', () => {
    const chapterSuggestion = getStoryCheckboxSuggestions({
      bookId: 'T02',
      chapterId: '104',
    }).find(suggestion => suggestion.checkbox.chapterId === '8')
    const lineSuggestion = getStoryCheckboxSuggestions({
      bookId: 'T05',
      chapterId: '43',
    }).find(suggestion => suggestion.checkbox.chapterId === '76')

    expect(chapterSuggestion).toMatchObject({
      source: 'TC',
      checkbox: { kind: 'chapter', chapterId: '8' },
    })
    expect(lineSuggestion).toMatchObject({
      source: 'TLC',
      checkbox: { kind: 'line', chapterId: '76', label: 'Défi UN' },
    })
  })

  it('uses the source chapter number for an unlabeled TLC reference', () => {
    const suggestion = getStoryCheckboxSuggestions({
      bookId: 'T05',
      chapterId: '253',
    }).find(item => item.checkbox.chapterId === '60')

    expect(suggestion?.checkbox.label).toBe('253')
  })

  it('builds checkbox definitions and resolves valid book suggestions', () => {
    for (const book of books) {
      const data = getBookData(book.id)
      for (const chapter of data.chapters) {
        expect(() =>
          getChapterStoryCheckboxes({
            bookId: book.id,
            chapterId: chapter.id,
          }),
        ).not.toThrow()
      }
    }

    expect(getAllStoryCheckboxes().length).toBeGreaterThan(0)

    const validSuggestionPositions = books.flatMap(book =>
      getBookData(book.id)
        .chapters.filter(
          chapter => !(book.id === 'T05' && chapter.id === '263'),
        )
        .map(chapter => ({ bookId: book.id, chapterId: chapter.id })),
    )
    for (const position of validSuggestionPositions) {
      expect(() => getStoryCheckboxSuggestions(position)).not.toThrow()
    }
  })

  it('reports the dangling T05 TLC marker with its chapter context', () => {
    expect(() =>
      getStoryCheckboxSuggestions({ bookId: 'T05', chapterId: '263' }),
    ).toThrow(
      'TLC marker in T05-263 points to missing line checkbox 263 in chapter 250',
    )
  })
})
