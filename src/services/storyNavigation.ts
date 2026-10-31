import type { BookRoute } from 'services/bookData'
import { getBookData, isBookId } from 'services/bookData'
import type { StoryPosition, StoryTrack } from 'services/storyProgress'
import { getStoryTrackRuntime } from 'services/storyProgress'

export type StoryChoice =
  | {
      id: string
      label: string
      kind: 'destination'
      position: StoryPosition
      via: 'choice' | 'ro-entry'
      returnTo?: StoryPosition
    }
  | {
      id: string
      label: string
      kind: 'unavailable'
      reason: string
    }

export function getStoryChoices(
  position: StoryPosition,
  track: StoryTrack,
): StoryChoice[] {
  const book = getBookData(position.bookId)
  const chapter = book.chaptersById.get(position.chapterId)
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.bookId}-${position.chapterId}`)
  }
  if (book.endIds.includes(chapter.id)) {
    return []
  }

  return chapter.routes.flatMap((route, index) => {
    const id = `${position.bookId}-${position.chapterId}-${index}`
    return storyChoice(route, id, track)
  })
}

export function getDestinationLabel(position: StoryPosition): string {
  const book = getBookData(position.bookId)
  return position.chapterId === 'MAP'
    ? `${book.title} — Carte du monde`
    : `${book.title} — chapitre ${position.chapterId}`
}

function storyChoice(
  route: BookRoute,
  id: string,
  track: StoryTrack,
): StoryChoice[] {
  if (route.kind === 'chapter') {
    if (
      route.hidden ||
      route.source === 'ro-return' ||
      route.source === 'map'
    ) {
      return []
    }

    const position: StoryPosition = {
      bookId: route.targetBookId,
      chapterId: route.targetChapterId,
    }
    if (!hasChapter(position)) {
      return [
        {
          id,
          label: `Chapitre ${route.targetChapterId} (introuvable)`,
          kind: 'unavailable',
          reason: 'Ce chapitre ne figure pas dans les données du livre.',
        },
      ]
    }
    return [
      {
        id,
        label:
          route.targetChapterId === 'MAP'
            ? 'Carte du monde'
            : `Chapitre ${route.targetChapterId}`,
        kind: 'destination',
        position,
        via: 'choice',
      },
    ]
  }

  if (route.kind === 'external-chapter') {
    if (!isBookId(route.targetBookId)) {
      return [
        {
          id,
          label: `Lien vers ${route.targetBookId} — chapitre ${route.targetChapterId}`,
          kind: 'unavailable',
          reason: 'Ce livre n’est pas enregistré dans l’application.',
        },
      ]
    }

    const position: StoryPosition = {
      bookId: route.targetBookId,
      chapterId: route.targetChapterId,
    }
    if (!hasChapter(position)) {
      return [
        {
          id,
          label: getDestinationLabel(position),
          kind: 'unavailable',
          reason: 'Ce chapitre ne figure pas dans les données du livre.',
        },
      ]
    }
    return [
      {
        id,
        label: getDestinationLabel(position),
        kind: 'destination',
        position,
        via: 'choice',
      },
    ]
  }

  const extension = getBookData('E01')
  const runtime = getStoryTrackRuntime(track.visits)
  const targetChapterId = runtime.localisation ?? extension.startId
  const position: StoryPosition = {
    bookId: 'E01',
    chapterId: targetChapterId,
  }
  if (!extension.chaptersById.has(targetChapterId)) {
    return [
      {
        id,
        label: `Entrer dans le Royaume des Ombres — chapitre ${targetChapterId}`,
        kind: 'unavailable',
        reason: 'La localisation enregistrée ne correspond pas à un chapitre.',
      },
    ]
  }

  if (!isBookId(route.returnTo.bookId)) {
    return [
      {
        id,
        label: `Entrer dans le Royaume des Ombres — chapitre ${targetChapterId}`,
        kind: 'unavailable',
        reason: `${route.returnTo.bookId} n’est pas enregistré dans l’application.`,
      },
    ]
  }

  const returnTo: StoryPosition = {
    bookId: route.returnTo.bookId,
    chapterId: route.returnTo.chapterId,
  }
  if (!hasChapter(returnTo)) {
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
          ? `Entrer dans le Royaume des Ombres — chapitre ${targetChapterId}`
          : `Reprendre le Royaume des Ombres — chapitre ${targetChapterId}`,
      kind: 'destination',
      position,
      via: 'ro-entry',
      returnTo,
    },
  ]
}

function hasChapter(position: StoryPosition): boolean {
  return getBookData(position.bookId).chaptersById.has(position.chapterId)
}
