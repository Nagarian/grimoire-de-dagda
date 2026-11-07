import { describe, expect, it } from 'vitest'
import { getBookData } from 'services/bookData'
import type { BookChapter, BookRoute } from 'services/bookData'
import { books } from 'services/books'
import { getDestinationLabel, getStoryChoices } from 'services/storyNavigation'
import { createStoryVisit } from 'services/storyProgress'
import type { StoryTrack } from 'services/storyProgress'
import type { StoryPosition } from 'services/storyProgress'
import { getMapPathId, getMapPathSuggestions } from 'services/storyMap'

const initialTrack: StoryTrack = {
  id: 'track-1',
  name: 'Test',
  visits: [createStoryVisit({ chapterId: 'T01-1' }, 'start')],
  checkedCheckboxIds: [],
  revealedMapPathIds: [],
}

describe('getStoryChoices', () => {
  it('offers same-book chapter paths as destinations', () => {
    const choices = getStoryChoices({ chapterId: 'T01-1' }, initialTrack)

    expect(choices.map(choice => choice.kind)).toEqual([
      'destination',
      'destination',
      'destination',
      'destination',
    ])
    expect(choices.map(choice => choice.label)).toContain('Chapitre 61')
  })

  it('does not expose hidden paths as normal choices', () => {
    const book = getBookData('T01')
    const chapter = book.chapters.find(chapter =>
      chapter.routes.some(route => route.kind === 'chapter' && route.hidden),
    )

    const source = requireChapter(chapter)
    const hiddenRoute = source.routes.find(
      (route): route is Extract<BookRoute, { kind: 'chapter' }> =>
        route.kind === 'chapter' && route.hidden,
    )
    expect(hiddenRoute).toBeDefined()
    expect(
      getStoryChoices({ chapterId: source.id }, initialTrack).some(
        choice =>
          choice.kind === 'destination' &&
          choice.position.chapterId === hiddenRoute?.targetId,
      ),
    ).toBe(false)
  })

  it('offers revealed HM paths as selectable map choices', () => {
    const suggestion = getMapPathSuggestions({
      chapterId: 'T05-29',
    }).find(item => item.targetChapterId === 'T05-329')
    if (!suggestion) {
      throw new Error('Expected chapter 29 to reveal the chapter 329 map path')
    }

    const mapPosition: StoryPosition = { chapterId: 'T05-MAP' }
    expect(
      getStoryChoices(mapPosition, initialTrack).some(
        choice =>
          choice.kind === 'destination' &&
          choice.position.chapterId === 'T05-329',
      ),
    ).toBe(false)

    const track: StoryTrack = {
      ...initialTrack,
      revealedMapPathIds: [suggestion.id],
    }
    expect(
      getStoryChoices(mapPosition, track).some(
        choice =>
          choice.kind === 'destination' &&
          choice.position.chapterId === 'T05-329',
      ),
    ).toBe(true)
    expect(
      getStoryChoices(mapPosition, track).find(
        choice =>
          choice.kind === 'destination' &&
          choice.position.chapterId === 'T05-329',
      ),
    ).toMatchObject({
      label: 'Chapitre 329 — Le moulin noyé',
    })
    expect(suggestion.id).toBe(getMapPathId('T05-329'))
  })

  it('enters E01 at chapter 1 before a localisation is recorded', () => {
    const book = getBookData('T03')
    const chapter = requireChapter(
      book.chapters.find(chapter =>
        chapter.tokens.some(
          token => token.kind === 'marker' && token.key === 'RO',
        ),
      ),
    )
    const choice = getStoryChoices(
      { chapterId: chapter.id },
      initialTrack,
    ).find(choice => choice.kind === 'destination')

    expect(choice).toMatchObject({
      kind: 'destination',
      position: { chapterId: 'E01-1' },
      via: 'ro-entry',
    })
  })

  it('uses the saved localisation on later RO entries', () => {
    const book = getBookData('T03')
    const chapter = requireChapter(
      book.chapters.find(chapter =>
        chapter.tokens.some(
          token => token.kind === 'marker' && token.key === 'RO',
        ),
      ),
    )
    const track: StoryTrack = {
      ...initialTrack,
      visits: [
        ...initialTrack.visits,
        createStoryVisit({ chapterId: 'E01-16' }, 'manual'),
      ],
    }

    expect(
      getStoryChoices({ chapterId: chapter.id }, track).find(
        choice => choice.kind === 'destination',
      ),
    ).toMatchObject({
      kind: 'destination',
      position: { chapterId: 'E01-12' },
    })
  })

  it('shows unregistered cross-book references as unavailable', () => {
    const book = getBookData('E01')
    const chapter = requireChapter(
      book.chapters.find(chapter =>
        chapter.tokens.some(
          token => token.kind === 'marker' && token.key === 'T07',
        ),
      ),
    )

    expect(
      getStoryChoices({ chapterId: chapter.id }, initialTrack),
    ).toContainEqual(
      expect.objectContaining({
        kind: 'unavailable',
        label: expect.stringContaining('T07'),
      }),
    )
  })

  it('does not offer choices from terminal chapters', () => {
    const book = getBookData('E01')

    const endId = book.endIds.at(0)
    if (!endId) {
      throw new Error('Expected the extension to contain an END chapter')
    }

    expect(getStoryChoices({ chapterId: endId }, initialTrack)).toEqual([])
  })

  it('handles routes in every registered chapter', () => {
    for (const book of books) {
      const data = getBookData(book.id)
      for (const chapter of data.chapters) {
        expect(() =>
          getStoryChoices({ chapterId: chapter.id }, initialTrack),
        ).not.toThrow()
      }
    }
  })

  it('rejects an unknown chapter and labels MAP destinations', () => {
    expect(() =>
      getStoryChoices({ chapterId: 'T01-missing' }, initialTrack),
    ).toThrow('Unknown chapter T01-missing')

    expect(getDestinationLabel({ chapterId: 'T05-MAP' })).toContain(
      'Carte du monde',
    )
    expect(getDestinationLabel({ chapterId: 'T01-1' })).toContain('chapitre 1')
  })
})

function requireChapter(chapter: BookChapter | undefined): BookChapter {
  if (!chapter) {
    throw new Error('Expected the book data to contain the test chapter')
  }
  return chapter
}
