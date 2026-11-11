import type { BookRoute } from 'services/bookData'
import {
  getBookData,
  getBookIdFromChapterId,
  isChapterId,
} from 'services/bookData'
import type { ChapterId } from 'services/chapterDsl'
import { getChapterNumberFromId } from 'services/chapterDsl'
import type {
  StoryPosition,
  StoryTrack,
  StoryTrackRuntime,
} from 'services/storyProgress'
import { getStoryTrackRuntime } from 'services/storyProgress'
import { getMapPathId } from 'services/storyMap'
import {
  getBookAnnotationLabel,
  getChapterLabel,
  getDestinationLabel as translateDestinationLabel,
  i18n,
} from 'services/i18n'

export type StoryChoice =
  | {
      id: string
      label: string
      kind: 'destination'
      position: StoryPosition
      via: 'choice' | 'ro-entry'
      returnTo?: ChapterId
      deathPosition?: ChapterId
    }
  | {
      id: string
      label: string
      kind: 'unavailable'
      reason:
        | 'missingChapter'
        | 'unregisteredBook'
        | 'invalidLocalisation'
        | 'invalidCapsule'
        | 'capsulesFull'
      targetChapterId?: string
    }

export function getStoryChoices(
  position: StoryPosition,
  track: StoryTrack,
  runtime = getStoryTrackRuntime(track.visits),
): StoryChoice[] {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const book = bookId ? getBookData(bookId) : undefined
  const chapter = book?.chaptersById.get(position.chapterId)
  if (!book || !chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }
  if (book.endIds.includes(chapter.id)) {
    return []
  }

  return chapter.routes.flatMap((route, index) =>
    storyChoice(route, `${position.chapterId}-${index}`, track, runtime),
  )
}

export function getDestinationLabel(position: StoryPosition): string {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const book = bookId ? getBookData(bookId) : undefined
  const chapter = book?.chaptersById.get(position.chapterId)
  if (!book || !chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }
  return translateDestinationLabel(book.id, chapter.number)
}

function storyChoice(
  route: BookRoute,
  id: string,
  track: StoryTrack,
  runtime: StoryTrackRuntime,
): StoryChoice[] {
  if (route.kind === 'chapter') {
    if (route.source === 'ro-return') {
      return []
    }
    if (
      route.hidden &&
      (route.source !== 'map-hidden' ||
        !track.revealedMapPathIds.includes(getMapPathId(route.targetId)))
    ) {
      return []
    }

    if (!isChapterId(route.targetId)) {
      return [
        {
          id,
          label: i18n.t('chapter.missing', {
            number: getChapterNumberFromId(route.targetId),
          }),
          kind: 'unavailable',
          reason: 'missingChapter',
          targetChapterId: route.targetId,
        },
      ]
    }
    const targetBookId = getBookIdFromChapterId(route.targetId)
    if (!targetBookId) {
      throw new Error(`Unknown chapter ${route.targetId}`)
    }

    return [
      {
        id,
        label:
          getChapterNumberFromId(route.targetId) === 'MAP'
            ? i18n.t('chapter.map')
            : route.source === 'map-hidden' && route.mapLabelId
              ? `${getChapterLabel(getChapterNumberFromId(route.targetId))} — ${getBookAnnotationLabel(targetBookId, route.mapLabelId)}`
              : getChapterLabel(getChapterNumberFromId(route.targetId)),
        kind: 'destination',
        position: { chapterId: route.targetId },
        via: 'choice',
      },
    ]
  }

  if (route.kind === 'external-chapter') {
    const targetBookId = getBookIdFromChapterId(route.targetId)
    if (!targetBookId) {
      return [
        {
          id,
          label: i18n.t('chapter.unknownBookLink', {
            book: route.targetId.split('-')[0],
            chapter: getChapterLabel(getChapterNumberFromId(route.targetId)),
          }),
          kind: 'unavailable',
          reason: 'unregisteredBook',
        },
      ]
    }

    if (!isChapterId(route.targetId)) {
      const targetBook = getBookData(targetBookId)
      return [
        {
          id,
          label: translateDestinationLabel(
            targetBook.id,
            getChapterNumberFromId(route.targetId),
          ),
          kind: 'unavailable',
          reason: 'missingChapter',
        },
      ]
    }
    return [
      {
        id,
        label: getDestinationLabel({ chapterId: route.targetId }),
        kind: 'destination',
        position: { chapterId: route.targetId },
        via: 'choice',
      },
    ]
  }

  const extension = getBookData('E01')
  const e01Sheet = track.characterSheet.sheets.E01
  const localisation =
    e01Sheet?.bookId === 'E01' ? e01Sheet.localisation : runtime.localisation
  const targetChapterId = localisation ?? extension.startId
  if (!targetChapterId || !extension.chaptersById.has(targetChapterId)) {
    return [
      {
        id,
        label: i18n.t('reader.enterShadowRealm', {
          chapter: getChapterLabel(getChapterNumberFromId(targetChapterId)),
        }),
        kind: 'unavailable',
        reason: 'invalidLocalisation',
      },
    ]
  }

  if (!isChapterId(route.returnTo) || !isChapterId(route.deathPosition)) {
    return [
      {
        id,
        label: i18n.t('reader.enterShadowRealm', {
          chapter: getChapterLabel(getChapterNumberFromId(targetChapterId)),
        }),
        kind: 'unavailable',
        reason: 'invalidCapsule',
      },
    ]
  }

  return [
    {
      id,
      label:
        localisation === undefined || localisation === null
          ? i18n.t('reader.enterShadowRealm', {
              chapter: getChapterLabel(getChapterNumberFromId(targetChapterId)),
            })
          : i18n.t('reader.resumeShadowRealm', {
              chapter: getChapterLabel(getChapterNumberFromId(targetChapterId)),
            }),
      kind: 'destination',
      position: { chapterId: targetChapterId },
      via: 'ro-entry',
      returnTo: route.returnTo,
      deathPosition: route.deathPosition,
    },
  ]
}
