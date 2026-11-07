import { getBookData } from 'services/bookData'
import { books } from 'services/books'
import { describe, expect, it } from 'vitest'
import {
  getAllMapPathIds,
  getMapPathId,
  getMapPathSuggestions,
} from './storyMap'

describe('story map paths', () => {
  it('extracts HM targets and labels from the current chapter', () => {
    expect(
      getMapPathSuggestions({ bookId: 'T05', chapterId: '29' }),
    ).toContainEqual({
      id: getMapPathId('T05', '329'),
      bookId: 'T05',
      targetChapterId: '329',
      label: 'Le moulin noyé',
    })
  })

  it('registers only HM target chapters as revealable map paths', () => {
    const allPathIds = getAllMapPathIds()

    expect(allPathIds.has(getMapPathId('T05', '329'))).toBe(true)
    expect(allPathIds.has(getMapPathId('T05', 'Le moulin noyé'))).toBe(false)

    for (const book of books) {
      const data = getBookData(book.id)
      for (const chapter of data.chapters) {
        expect(() =>
          getMapPathSuggestions({ bookId: book.id, chapterId: chapter.id }),
        ).not.toThrow()
      }
    }
  })
})
