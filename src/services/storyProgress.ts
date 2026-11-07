import type { BookId } from 'services/books'
import { getBookData, isBookId } from 'services/bookData'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'
import { getAllMapPathIds } from 'services/storyMap'

export type StoryPosition = {
  bookId: BookId
  chapterId: string
}

export type StoryVisitType =
  | 'start'
  | 'choice'
  | 'manual'
  | 'ro-entry'
  | 'ro-return'

export type StoryVisit = StoryPosition & {
  via: StoryVisitType
  setLocalisation?: string
  returnTo?: StoryPosition
}

export type StoryTrack = {
  id: string
  name: string
  visits: StoryVisit[]
  checkedCheckboxIds: string[]
  revealedMapPathIds: string[]
}

export type StoryProgressData = {
  version: 3
  activeTrackId: string | null
  tracks: StoryTrack[]
}

export type StoryTrackRuntime = {
  localisation?: string
  returnTo?: StoryPosition
}

const storageKey = 'grimoire-de-dagda:story-progress'

export function loadStoryProgress(): StoryProgressData {
  const saved = window.localStorage.getItem(storageKey)
  if (saved === null) {
    return { version: 3, activeTrackId: null, tracks: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch {
    throw new Error('Les données de progression enregistrées sont illisibles.')
  }

  if (isVersionOneStoryProgressData(parsed)) {
    const migrated: unknown = migrateTracks(parsed, track => ({
      ...track,
      checkedCheckboxIds: [],
      revealedMapPathIds: [],
    }))
    if (!isStoryProgressData(migrated)) {
      throw new Error(
        'Les données de progression enregistrées ne sont pas valides.',
      )
    }
    saveStoryProgress(migrated)
    return migrated
  }

  if (isVersionTwoStoryProgressData(parsed)) {
    const migrated: unknown = migrateTracks(parsed, track => ({
      ...track,
      revealedMapPathIds: [],
    }))
    if (!isStoryProgressData(migrated)) {
      throw new Error(
        'Les données de progression enregistrées ne sont pas valides.',
      )
    }
    saveStoryProgress(migrated)
    return migrated
  }

  if (!isStoryProgressData(parsed)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }

  return parsed
}

export function saveStoryProgress(progress: StoryProgressData): void {
  window.localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function getCurrentPosition(
  track: StoryTrack,
): StoryPosition | undefined {
  const visit = track.visits.at(-1)
  return visit
    ? { bookId: visit.bookId, chapterId: visit.chapterId }
    : undefined
}

export function getStoryTrackRuntime(visits: StoryVisit[]): StoryTrackRuntime {
  const runtime: StoryTrackRuntime = {}

  for (const visit of visits) {
    if (visit.setLocalisation !== undefined) {
      runtime.localisation = visit.setLocalisation
    }

    if (visit.via === 'ro-entry') {
      runtime.returnTo = visit.returnTo
    } else if (visit.via === 'ro-return') {
      runtime.returnTo = undefined
    }
  }

  return runtime
}

export function createStoryVisit(
  position: StoryPosition,
  via: StoryVisitType,
  returnTo?: StoryPosition,
): StoryVisit {
  const chapter = getBookData(position.bookId).chaptersById.get(
    position.chapterId,
  )
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.bookId}-${position.chapterId}`)
  }

  const localisation = chapter.tokens.find(
    token => token.kind === 'marker' && token.key === 'ROLOC',
  )
  const setLocalisation =
    localisation?.kind === 'marker' ? localisation.args.at(0) : undefined

  return {
    ...position,
    via,
    ...(setLocalisation !== undefined && { setLocalisation }),
    ...(returnTo !== undefined && { returnTo }),
  }
}

function isStoryProgressData(value: unknown): value is StoryProgressData {
  if (!isRecord(value) || value.version !== 3 || !Array.isArray(value.tracks)) {
    return false
  }

  const validCheckboxIds = new Set(
    getAllStoryCheckboxes().map(checkbox => checkbox.id),
  )
  const validMapPathIds = getAllMapPathIds()
  const ids = new Set<string>()
  for (const candidate of value.tracks) {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      candidate.id.length === 0 ||
      ids.has(candidate.id) ||
      typeof candidate.name !== 'string' ||
      candidate.name.trim() === '' ||
      !Array.isArray(candidate.visits) ||
      candidate.visits.length === 0 ||
      !Array.isArray(candidate.checkedCheckboxIds) ||
      !Array.isArray(candidate.revealedMapPathIds)
    ) {
      return false
    }
    ids.add(candidate.id)

    const checkedIds = new Set<string>()
    for (const checkboxId of candidate.checkedCheckboxIds) {
      if (
        typeof checkboxId !== 'string' ||
        checkedIds.has(checkboxId) ||
        !validCheckboxIds.has(checkboxId)
      ) {
        return false
      }
      checkedIds.add(checkboxId)
    }

    const revealedMapPathIds = new Set<string>()
    for (const mapPathId of candidate.revealedMapPathIds) {
      if (
        typeof mapPathId !== 'string' ||
        revealedMapPathIds.has(mapPathId) ||
        !validMapPathIds.has(mapPathId)
      ) {
        return false
      }
      revealedMapPathIds.add(mapPathId)
    }

    let activeReturn: StoryPosition | undefined
    for (let index = 0; index < candidate.visits.length; index += 1) {
      const visit = candidate.visits[index]
      if (
        !isRecord(visit) ||
        !isPosition({
          bookId: visit.bookId,
          chapterId: visit.chapterId,
        })
      ) {
        return false
      }

      if (
        visit.via !== 'start' &&
        visit.via !== 'choice' &&
        visit.via !== 'manual' &&
        visit.via !== 'ro-entry' &&
        visit.via !== 'ro-return'
      ) {
        return false
      }
      if (index === 0 && visit.via !== 'start') {
        return false
      }
      if (
        visit.setLocalisation !== undefined &&
        (typeof visit.setLocalisation !== 'string' ||
          !getBookData('E01').chaptersById.has(visit.setLocalisation))
      ) {
        return false
      }

      if (visit.via === 'ro-entry') {
        if (!isPosition(visit.returnTo)) {
          return false
        }
        activeReturn = visit.returnTo
      } else if (visit.via === 'ro-return') {
        if (
          !activeReturn ||
          activeReturn.bookId !== visit.bookId ||
          activeReturn.chapterId !== visit.chapterId ||
          visit.returnTo !== undefined
        ) {
          return false
        }
        activeReturn = undefined
      } else if (visit.returnTo !== undefined) {
        return false
      }
    }
  }

  if (
    value.activeTrackId !== null &&
    (typeof value.activeTrackId !== 'string' || !ids.has(value.activeTrackId))
  ) {
    return false
  }

  return (
    (value.tracks.length === 0 && value.activeTrackId === null) ||
    (value.tracks.length > 0 && value.activeTrackId !== null)
  )
}

function isVersionOneStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 1 && Array.isArray(value.tracks)
}

function isVersionTwoStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 2 && Array.isArray(value.tracks)
}

function migrateTracks(
  progress: Record<string, unknown> & { tracks: unknown[] },
  migrateTrack: (track: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...progress,
    version: 3,
    tracks: progress.tracks.map(track =>
      isRecord(track) ? migrateTrack(track) : track,
    ),
  }
}

function isPosition(value: unknown): value is StoryPosition {
  if (
    !isRecord(value) ||
    typeof value.bookId !== 'string' ||
    !isBookId(value.bookId) ||
    typeof value.chapterId !== 'string'
  ) {
    return false
  }

  return getBookData(value.bookId).chaptersById.has(value.chapterId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
