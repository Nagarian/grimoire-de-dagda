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
    expect(getMapPathSuggestions({ chapterId: 'T05-29' })).toContainEqual({
      id: getMapPathId('T05-329'),
      targetChapterId: 'T05-329',
      label: 'Le moulin noyé',
    })
  })

  it('registers only HM target chapters as revealable map paths', () => {
    const allPathIds = getAllMapPathIds()

    expect(getAllMapPathIds()).toBe(allPathIds)
    expect(allPathIds.has(getMapPathId('T05-329'))).toBe(true)
    expect(allPathIds.has(getMapPathId('T05-Le moulin noyé'))).toBe(false)

    for (const book of books) {
      const data = getBookData(book.id)
      for (const chapter of data.chapters) {
        expect(() =>
          getMapPathSuggestions({ chapterId: chapter.id }),
        ).not.toThrow()
      }
    }
  })
})
