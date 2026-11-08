import type { ChapterId } from 'services/chapterDsl'
import type { BookId } from 'services/books'
import {
  getBookData,
  getBookIdFromChapterId,
  isChapterId,
  isBookId,
  toChapterId,
} from 'services/bookData'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'
import { getAllMapPathIds } from 'services/storyMap'
import type {
  BookCharacterSheet,
  CharacterSheetState,
} from 'services/characterSheet'
import {
  createBlankBookSheet,
  isCharacterSheetState,
} from 'services/characterSheet'

export type StoryPosition = {
  chapterId: ChapterId
}

export type StoryVisitType =
  | 'start'
  | 'choice'
  | 'manual'
  | 'ro-entry'
  | 'ro-return'

export type StoryVisit = {
  chapterId: ChapterId
  via: StoryVisitType
  setLocalisation?: ChapterId
  returnTo?: ChapterId
}

export type StoryTrack = {
  id: string
  name: string
  visits: StoryVisit[]
  checkedCheckboxIds: string[]
  revealedMapPathIds: string[]
  characterSheet: CharacterSheetState
  savepoints: Partial<Record<BookId, (CharacterSavepoint | null)[]>>
}

export const storyProgressPages = [
  'story-progresser',
  'character-sheet',
  'book-visualizer',
  'settings',
] as const
export type StoryProgressPage = (typeof storyProgressPages)[number]

export const storyDetailsAccordionSections = [
  'checked-boxes',
  'history',
] as const
export type StoryDetailsAccordionSection =
  (typeof storyDetailsAccordionSections)[number]

export function isStoryDetailsAccordionSection(
  value: unknown,
): value is StoryDetailsAccordionSection {
  return storyDetailsAccordionSections.some(section => section === value)
}

export type StoryProgressUiState = {
  currentPage: StoryProgressPage
  storyDetailsAccordion: StoryDetailsAccordionSection[]
}

export const defaultStoryProgressUiState: StoryProgressUiState = {
  currentPage: 'story-progresser',
  storyDetailsAccordion: [],
}

export type CharacterSavepoint = {
  bookId: BookId
  chapterId: ChapterId
  sheet: BookCharacterSheet
}

export type StoryProgressData = {
  version: 7
  activeTrackId: string | null
  tracks: StoryTrack[]
  uiState: StoryProgressUiState
}

export type StoryTrackRuntime = {
  localisation?: ChapterId
  returnTo?: ChapterId
}

const storageKey = 'grimoire-de-dagda:story-progress'
let validCheckboxIds: Set<string> | undefined
const storyTrackRuntimeCache = new WeakMap<StoryVisit[], StoryTrackRuntime>()

export function loadStoryProgress(): StoryProgressData {
  const saved = window.localStorage.getItem(storageKey)
  if (saved === null) {
    return {
      version: 7,
      activeTrackId: null,
      tracks: [],
      uiState: defaultStoryProgressUiState,
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch {
    throw new Error('Les données de progression enregistrées sont illisibles.')
  }

  if (isVersionOneStoryProgressData(parsed)) {
    const migrated = migrateTracks(parsed, track => ({
      ...track,
      checkedCheckboxIds: [],
      revealedMapPathIds: [],
    }))
    return finishLegacyMigration(migrated)
  }

  if (isVersionTwoStoryProgressData(parsed)) {
    const migrated = migrateTracks(parsed, track => ({
      ...track,
      revealedMapPathIds: [],
    }))
    return finishLegacyMigration(migrated)
  }

  if (isVersionThreeStoryProgressData(parsed)) {
    return finishLegacyMigration(parsed)
  }

  if (isVersionFourStoryProgressData(parsed)) {
    return finishCharacterSheetMigration(parsed)
  }

  if (isVersionFiveStoryProgressData(parsed)) {
    return finishSavepointMigration(parsed)
  }

  if (isVersionSixStoryProgressData(parsed)) {
    return finishUiStateMigration(parsed)
  }

  if (!isStoryProgressData(parsed)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }

  return parsed
}

function finishLegacyMigration(
  progress: Record<string, unknown> & { tracks: unknown[] },
): StoryProgressData {
  const migrated = migrateUiState(
    migrateSavepoints(migrateCharacterSheets(migrateChapterIds(progress))),
  )
  if (!isStoryProgressData(migrated)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }
  saveStoryProgress(migrated)
  return migrated
}

function finishCharacterSheetMigration(
  progress: Record<string, unknown> & { tracks: unknown[] },
): StoryProgressData {
  const migrated = migrateUiState(
    migrateSavepoints(migrateCharacterSheets(progress)),
  )
  if (!isStoryProgressData(migrated)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }
  saveStoryProgress(migrated)
  return migrated
}

function finishSavepointMigration(
  progress: Record<string, unknown> & { tracks: unknown[] },
): StoryProgressData {
  const migrated = migrateUiState(migrateSavepoints(progress))
  if (!isStoryProgressData(migrated)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }
  saveStoryProgress(migrated)
  return migrated
}

export function saveStoryProgress(progress: StoryProgressData): void {
  if (!isStoryProgressData(progress)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }
  persistValidatedStoryProgress(progress)
}

// Internal updates derive from validated state and validate changed user data.
export function persistValidatedStoryProgress(
  progress: StoryProgressData,
): void {
  window.localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function getCurrentPosition(
  track: StoryTrack,
): StoryPosition | undefined {
  const visit = track.visits.at(-1)
  return visit ? { chapterId: visit.chapterId } : undefined
}

export function getStoryTrackRuntime(visits: StoryVisit[]): StoryTrackRuntime {
  const cached = storyTrackRuntimeCache.get(visits)
  if (cached) {
    return cached
  }

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

  storyTrackRuntimeCache.set(visits, runtime)
  return runtime
}

export function createStoryVisit(
  position: StoryPosition,
  via: StoryVisitType,
  returnTo?: ChapterId,
): StoryVisit {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const chapter = bookId
    ? getBookData(bookId).chaptersById.get(position.chapterId)
    : undefined
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }

  const localisation = chapter.tokens.find(
    token => token.kind === 'marker' && token.key === 'ROLOC',
  )
  const localChapterId =
    localisation?.kind === 'marker' ? localisation.args.at(0) : undefined
  const setLocalisation = localChapterId
    ? toChapterId('E01', localChapterId)
    : undefined

  return {
    ...position,
    via,
    ...(setLocalisation !== undefined && { setLocalisation }),
    ...(returnTo !== undefined && { returnTo }),
  }
}

function isStoryProgressData(value: unknown): value is StoryProgressData {
  if (
    !isRecord(value) ||
    value.version !== 7 ||
    !Array.isArray(value.tracks) ||
    !isStoryProgressUiState(value.uiState)
  ) {
    return false
  }

  validCheckboxIds ??= new Set(
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
      !Array.isArray(candidate.revealedMapPathIds) ||
      !isCharacterSavepoints(candidate.savepoints) ||
      !isCharacterSheetState(candidate.characterSheet)
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

    let activeReturn: ChapterId | undefined
    for (let index = 0; index < candidate.visits.length; index += 1) {
      const visit = candidate.visits[index]
      if (!isRecord(visit) || !isChapterId(visit.chapterId)) {
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
          !isChapterId(visit.setLocalisation))
      ) {
        return false
      }

      if (visit.via === 'ro-entry') {
        if (!isChapterId(visit.returnTo)) {
          return false
        }
        activeReturn = visit.returnTo
      } else if (visit.via === 'ro-return') {
        if (
          !activeReturn ||
          activeReturn !== visit.chapterId ||
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

function isVersionThreeStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 3 && Array.isArray(value.tracks)
}

function isVersionFourStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 4 && Array.isArray(value.tracks)
}

function isVersionFiveStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 5 && Array.isArray(value.tracks)
}

function isVersionSixStoryProgressData(
  value: unknown,
): value is Record<string, unknown> & { tracks: unknown[] } {
  return isRecord(value) && value.version === 6 && Array.isArray(value.tracks)
}

function migrateTracks(
  progress: Record<string, unknown> & { tracks: unknown[] },
  migrateTrack: (track: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> & { tracks: unknown[] } {
  return {
    ...progress,
    version: 3,
    tracks: progress.tracks.map(track =>
      isRecord(track) ? migrateTrack(track) : track,
    ),
  }
}

function migrateChapterIds(
  progress: Record<string, unknown> & { tracks: unknown[] },
): Record<string, unknown> & { tracks: unknown[] } {
  return {
    ...progress,
    version: 4,
    tracks: progress.tracks.map(track => {
      if (!isRecord(track)) {
        return track
      }

      return {
        ...track,
        visits: Array.isArray(track.visits)
          ? track.visits.map(migrateVisit)
          : track.visits,
        checkedCheckboxIds: Array.isArray(track.checkedCheckboxIds)
          ? track.checkedCheckboxIds.map(migrateCheckboxId)
          : track.checkedCheckboxIds,
        revealedMapPathIds: Array.isArray(track.revealedMapPathIds)
          ? track.revealedMapPathIds.map(migrateMapPathId)
          : track.revealedMapPathIds,
      }
    }),
  }
}

function migrateCharacterSheets(
  progress: Record<string, unknown> & { tracks: unknown[] },
): Record<string, unknown> & { tracks: unknown[] } {
  return {
    ...progress,
    version: 5,
    tracks: progress.tracks.map(track => {
      if (!isRecord(track) || !Array.isArray(track.visits)) {
        return track
      }

      const visitedBookIds = new Set(
        track.visits.flatMap(visit => {
          if (!isRecord(visit) || typeof visit.chapterId !== 'string') {
            return []
          }
          const bookId = getBookIdFromChapterId(visit.chapterId)
          return bookId ? [bookId] : []
        }),
      )
      const sheets: Partial<Record<BookId, BookCharacterSheet>> = {}
      for (const bookId of visitedBookIds) {
        sheets[bookId] = createBlankBookSheet(bookId)
      }

      const runtime = getStoryTrackRuntime(
        track.visits.filter(
          (visit): visit is StoryVisit =>
            isRecord(visit) &&
            typeof visit.chapterId === 'string' &&
            isChapterId(visit.chapterId) &&
            (visit.via === 'start' ||
              visit.via === 'choice' ||
              visit.via === 'manual' ||
              visit.via === 'ro-entry' ||
              visit.via === 'ro-return'),
        ),
      )
      const e01Sheet = sheets.E01
      if (e01Sheet?.bookId === 'E01') {
        e01Sheet.localisation = runtime.localisation ?? null
      }

      return {
        ...track,
        characterSheet: {
          gameMode: null,
          sheets,
        } satisfies CharacterSheetState,
      }
    }),
  }
}

function migrateSavepoints(
  progress: Record<string, unknown> & { tracks: unknown[] },
): Record<string, unknown> & { tracks: unknown[] } {
  return {
    ...progress,
    version: 6,
    tracks: progress.tracks.map(track => {
      if (!isRecord(track)) {
        return track
      }

      const savepoints: Partial<Record<BookId, (CharacterSavepoint | null)[]>> =
        {}
      const characterSheet = isRecord(track.characterSheet)
        ? track.characterSheet
        : undefined
      const sheets =
        characterSheet && isRecord(characterSheet.sheets)
          ? characterSheet.sheets
          : undefined
      const legacyT01 = sheets && isRecord(sheets.T01) ? sheets.T01 : undefined
      const legacySavepoints = legacyT01?.savepoints

      if (
        legacyT01 &&
        Array.isArray(legacySavepoints) &&
        legacySavepoints.length === 3
      ) {
        const migrated = legacySavepoints.map(savepoint => {
          if (!isRecord(savepoint) || !isRecord(savepoint.sheet)) {
            return null
          }
          const sheet: Record<string, unknown> = {
            ...savepoint.sheet,
            savepoints: legacyT01.savepoints,
          }
          return {
            bookId: 'T01',
            chapterId: savepoint.resumeChapterId,
            sheet,
          }
        })
        const candidate = { T01: migrated }
        if (
          migrated.some(savepoint => savepoint !== null) &&
          isCharacterSavepoints(candidate)
        ) {
          savepoints.T01 = candidate.T01
        }
      }

      return { ...track, savepoints }
    }),
  }
}

function finishUiStateMigration(
  progress: Record<string, unknown> & { tracks: unknown[] },
): StoryProgressData {
  const migrated = migrateUiState(progress)
  if (!isStoryProgressData(migrated)) {
    throw new Error(
      'Les données de progression enregistrées ne sont pas valides.',
    )
  }
  saveStoryProgress(migrated)
  return migrated
}

function migrateUiState(
  progress: Record<string, unknown> & { tracks: unknown[] },
): Record<string, unknown> & { tracks: unknown[] } {
  return {
    ...progress,
    version: 7,
    uiState: defaultStoryProgressUiState,
    tracks: progress.tracks.map(track => {
      if (!isRecord(track)) {
        return track
      }

      const characterSheet = isRecord(track.characterSheet)
        ? track.characterSheet
        : undefined
      const sheets =
        characterSheet && isRecord(characterSheet.sheets)
          ? characterSheet.sheets
          : undefined

      const savepoints = isRecord(track.savepoints)
        ? Object.fromEntries(
            Object.entries(track.savepoints).map(([bookId, bookSavepoints]) => [
              bookId,
              bookId === 'T05' && Array.isArray(bookSavepoints)
                ? bookSavepoints.map(savepoint =>
                    isRecord(savepoint)
                      ? {
                          ...savepoint,
                          sheet: addMemoriesSortPreference(savepoint.sheet),
                        }
                      : savepoint,
                  )
                : bookSavepoints,
            ]),
          )
        : track.savepoints

      return {
        ...track,
        ...(characterSheet &&
          sheets && {
            characterSheet: {
              ...characterSheet,
              sheets: {
                ...sheets,
                ...(isRecord(sheets.T05) &&
                  sheets.T05.bookId === 'T05' && {
                    T05: addMemoriesSortPreference(sheets.T05),
                  }),
              },
            },
          }),
        savepoints,
      }
    }),
  }
}

function addMemoriesSortPreference(value: unknown): unknown {
  if (!isRecord(value) || value.bookId !== 'T05') {
    return value
  }
  return {
    ...value,
    sortMemories:
      typeof value.sortMemories === 'boolean' ? value.sortMemories : false,
  }
}

function isStoryProgressUiState(value: unknown): value is StoryProgressUiState {
  if (
    !isRecord(value) ||
    !isStoryProgressPage(value.currentPage) ||
    !Array.isArray(value.storyDetailsAccordion)
  ) {
    return false
  }
  const openSections = new Set<string>()
  for (const section of value.storyDetailsAccordion) {
    if (
      typeof section !== 'string' ||
      !storyDetailsAccordionSections.some(allowed => allowed === section) ||
      openSections.has(section)
    ) {
      return false
    }
    openSections.add(section)
  }
  return true
}

export function isStoryProgressPage(
  value: unknown,
): value is StoryProgressPage {
  return (
    typeof value === 'string' && storyProgressPages.some(page => page === value)
  )
}

function isCharacterSavepoints(
  value: unknown,
): value is Partial<Record<BookId, (CharacterSavepoint | null)[]>> {
  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(([rawBookId, bookSavepoints]) => {
    if (
      !isBookId(rawBookId) ||
      !Array.isArray(bookSavepoints) ||
      bookSavepoints.length !== 3
    ) {
      return false
    }

    return bookSavepoints.every(savepoint => {
      if (savepoint === null) {
        return true
      }
      if (
        !isRecord(savepoint) ||
        savepoint.bookId !== rawBookId ||
        !isChapterId(savepoint.chapterId) ||
        getBookIdFromChapterId(savepoint.chapterId) !== rawBookId ||
        !isRecord(savepoint.sheet) ||
        savepoint.sheet.bookId !== rawBookId
      ) {
        return false
      }

      return isCharacterSheetState({
        gameMode: null,
        sheets: { [rawBookId]: savepoint.sheet },
      })
    })
  })
}

function migrateCheckboxId(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      typeof parsed[0] === 'string' &&
      isBookId(parsed[0]) &&
      typeof parsed[1] === 'string' &&
      typeof parsed[2] === 'string' &&
      typeof parsed[3] === 'string'
    ) {
      return JSON.stringify([`${parsed[0]}-${parsed[1]}`, parsed[2], parsed[3]])
    }
  } catch {
    return value
  }

  return value
}

function migrateVisit(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }

  const { bookId, chapterId, returnTo, setLocalisation, ...visit } = value
  if (typeof bookId !== 'string' || typeof chapterId !== 'string') {
    return value
  }

  return {
    ...visit,
    chapterId: `${bookId}-${chapterId}`,
    ...(typeof returnTo === 'object' &&
    returnTo !== null &&
    isRecord(returnTo) &&
    typeof returnTo.bookId === 'string' &&
    typeof returnTo.chapterId === 'string'
      ? { returnTo: `${returnTo.bookId}-${returnTo.chapterId}` }
      : returnTo !== undefined && { returnTo }),
    ...(setLocalisation !== undefined && {
      setLocalisation:
        typeof setLocalisation === 'string'
          ? `E01-${setLocalisation}`
          : setLocalisation,
    }),
  }
}

function migrateMapPathId(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      isBookId(parsed[0]) &&
      typeof parsed[1] === 'string'
    ) {
      return `${parsed[0]}-${parsed[1]}`
    }
  } catch {
    return value
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
