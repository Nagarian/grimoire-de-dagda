import type { BookRoute } from 'services/bookData'
import {
  getBookData,
  getBookIdFromChapterId,
  isChapterId,
} from 'services/bookData'
import type { ChapterId } from 'services/chapterDsl'
import { getChapterNumberFromId } from 'services/chapterDsl'
import type { StoryPosition, StoryTrack } from 'services/storyProgress'
import { getStoryTrackRuntime } from 'services/storyProgress'
import { getMapPathId } from 'services/storyMap'

export type StoryChoice =
  | {
      id: string
      label: string
      kind: 'destination'
      position: StoryPosition
      via: 'choice' | 'ro-entry'
      returnTo?: ChapterId
    }
  | {
      id: string
      label: string
      kind: 'unavailable'
      reason: string
      targetChapterId?: string
    }

export function getStoryChoices(
  position: StoryPosition,
  track: StoryTrack,
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
    storyChoice(route, `${position.chapterId}-${index}`, track),
  )
}

export function getDestinationLabel(position: StoryPosition): string {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const book = bookId ? getBookData(bookId) : undefined
  const chapter = book?.chaptersById.get(position.chapterId)
  if (!book || !chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }
  return chapter.number === 'MAP'
    ? `${book.title} — Carte du monde`
    : `${book.title} — chapitre ${chapter.number}`
}

function storyChoice(
  route: BookRoute,
  id: string,
  track: StoryTrack,
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
          label: `Chapitre ${getChapterNumberFromId(route.targetId)} (introuvable)`,
          kind: 'unavailable',
          reason: 'Ce chapitre ne figure pas dans les données du livre.',
          targetChapterId: route.targetId,
        },
      ]
    }
    return [
      {
        id,
        label:
          getChapterNumberFromId(route.targetId) === 'MAP'
            ? 'Carte du monde'
            : route.source === 'map-hidden' && route.mapLabel
              ? `Chapitre ${getChapterNumberFromId(route.targetId)} — ${route.mapLabel}`
              : `Chapitre ${getChapterNumberFromId(route.targetId)}`,
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
          label: `Lien vers ${route.targetId.split('-')[0]} — chapitre ${getChapterNumberFromId(route.targetId)}`,
          kind: 'unavailable',
          reason: 'Ce livre n’est pas enregistré dans l’application.',
        },
      ]
    }

    if (!isChapterId(route.targetId)) {
      const targetBook = getBookData(targetBookId)
      return [
        {
          id,
          label: `${targetBook.title} — chapitre ${getChapterNumberFromId(route.targetId)}`,
          kind: 'unavailable',
          reason: 'Ce chapitre ne figure pas dans les données du livre.',
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
  const runtime = getStoryTrackRuntime(track.visits)
  const targetChapterId = runtime.localisation ?? extension.startId
  if (!targetChapterId || !extension.chaptersById.has(targetChapterId)) {
    return [
      {
        id,
        label: `Entrer dans le Royaume des Ombres — chapitre ${targetChapterId}`,
        kind: 'unavailable',
        reason: 'La localisation enregistrée ne correspond pas à un chapitre.',
      },
    ]
  }

  if (!isChapterId(route.returnTo)) {
    return [
      {
        id,
        label: `Entrer dans le Royaume des Ombres — chapitre ${targetChapterId}`,
        kind: 'unavailable',
        reason: 'Le chapitre de résurrection ne figure pas dans les données.',
      },
    ]
  }

  return [
    {
      id,
      label:
        runtime.localisation === undefined
          ? `Entrer dans le Royaume des Ombres — chapitre ${getChapterNumberFromId(targetChapterId)}`
          : `Reprendre le Royaume des Ombres — chapitre ${getChapterNumberFromId(targetChapterId)}`,
      kind: 'destination',
      position: { chapterId: targetChapterId },
      via: 'ro-entry',
      returnTo: route.returnTo,
    },
  ]
}
