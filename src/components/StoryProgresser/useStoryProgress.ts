import { useState } from 'react'
import type { BookId, Book } from 'services/books'
import { books } from 'services/books'
import { getBookData, getBookIdFromChapterId } from 'services/bookData'
import type { ChapterId } from 'services/chapterDsl'
import type { StoryChoice } from 'services/storyNavigation'
import { getDestinationLabel, getStoryChoices } from 'services/storyNavigation'
import type {
  BookCharacterSheet,
  CharacterSheetState,
  E01Capsule,
  GameMode,
  MainTomeId,
  T01CharacterSheet,
  T01Savepoint,
} from 'services/characterSheet'
import {
  convertMainTomeSheet,
  createBlankBookSheet,
  createCharacterSheetState,
  e01CapsuleLimit,
  isCharacterSheetState,
} from 'services/characterSheet'
import type {
  StoryPosition,
  StoryProgressData,
  StoryTrack,
} from 'services/storyProgress'
import {
  createStoryVisit,
  getCurrentPosition,
  getStoryTrackRuntime,
  loadStoryProgress,
  persistValidatedStoryProgress,
} from 'services/storyProgress'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'
import { getAllMapPathIds } from 'services/storyMap'

const tomeBooks = books.filter(book => book.category === 'Tome')

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Une erreur inconnue est survenue pendant la sauvegarde.'
}

export function useStoryProgress() {
  const [initialState] = useState(() => {
    try {
      return { progress: loadStoryProgress(), error: undefined }
    } catch (error) {
      return { progress: undefined, error: errorMessage(error) }
    }
  })
  const [progress, setProgress] = useState(initialState.progress)
  const [error, setError] = useState(initialState.error)
  const activeTrack = progress?.tracks.find(
    track => track.id === progress.activeTrackId,
  )
  const currentPosition = activeTrack
    ? getCurrentPosition(activeTrack)
    : undefined
  const currentBookId = currentPosition
    ? getBookIdFromChapterId(currentPosition.chapterId)
    : undefined
  const currentBook = currentBookId ? getBookData(currentBookId) : undefined
  const currentChapter = currentPosition
    ? currentBook?.chaptersById.get(currentPosition.chapterId)
    : undefined
  const runtime = activeTrack
    ? getStoryTrackRuntime(activeTrack.visits)
    : undefined
  const allChoices =
    activeTrack && currentPosition
      ? getStoryChoices(currentPosition, activeTrack, runtime)
      : []
  const capsulesFull =
    activeTrack?.characterSheet.sheets.E01?.bookId === 'E01' &&
    activeTrack.characterSheet.sheets.E01.capsules.length >= e01CapsuleLimit
  const choices = allChoices.map(choice =>
    capsulesFull && choice.kind === 'destination' && choice.via === 'ro-entry'
      ? {
          id: choice.id,
          label: choice.label,
          kind: 'unavailable' as const,
          reason:
            'Les 15 capsules sont utilisées. Supprimez-en une avant d’entrer dans le Royaume des Ombres.',
          targetChapterId: choice.position.chapterId,
        }
      : choice,
  )
  const isEnd = currentPosition
    ? currentBook?.endIds.includes(currentPosition.chapterId) === true
    : false
  const nextBook = currentBook
    ? tomeBooks[
        (tomeBooks.findIndex(book => book.id === currentBook.id) + 1) %
          tomeBooks.length
      ]
    : undefined

  function commit(next: StoryProgressData): boolean {
    try {
      persistValidatedStoryProgress(next)
      setProgress(next)
      setError(undefined)
      return true
    } catch (cause) {
      setError(errorMessage(cause))
      return false
    }
  }

  function updateTrack(
    trackId: string,
    update: (track: StoryTrack) => StoryTrack,
  ): boolean {
    if (!progress) {
      return false
    }

    return commit({
      ...progress,
      tracks: progress.tracks.map(track =>
        track.id === trackId ? update(track) : track,
      ),
    })
  }

  function appendVisit(
    position: StoryPosition,
    via: Parameters<typeof createStoryVisit>[1],
    returnTo?: ChapterId,
    capsule?: E01Capsule,
  ): boolean {
    if (!activeTrack) {
      return false
    }

    const visit = createStoryVisit(position, via, returnTo)
    return updateTrack(activeTrack.id, track => {
      const characterSheet = ensureBookSheet(track, position.chapterId)
      const sheets = { ...characterSheet.sheets }
      const e01Sheet = sheets.E01
      if (e01Sheet?.bookId === 'E01') {
        let nextE01Sheet = e01Sheet
        if (visit.setLocalisation !== undefined) {
          nextE01Sheet = {
            ...nextE01Sheet,
            localisation: visit.setLocalisation,
          }
        }
        if (capsule) {
          nextE01Sheet = {
            ...nextE01Sheet,
            capsules: [...nextE01Sheet.capsules, capsule],
          }
        }
        sheets.E01 = nextE01Sheet
      }

      return {
        ...track,
        visits: [...track.visits, visit],
        characterSheet: { ...characterSheet, sheets },
      }
    })
  }

  function createTrack(
    name: string,
    bookId: BookId,
    gameMode: GameMode,
  ): boolean {
    if (!progress) {
      return false
    }

    if (bookId === 'E01') {
      setError('Choisissez un tome pour commencer une partie.')
      return false
    }

    const book = getBookData(bookId)
    if (!book.startId) {
      setError(`Le livre ${book.title} ne contient pas de chapitre START.`)
      return false
    }

    const track: StoryTrack = {
      id: crypto.randomUUID(),
      name: name.trim() || `Parcours ${progress.tracks.length + 1}`,
      visits: [createStoryVisit({ chapterId: book.startId }, 'start')],
      checkedCheckboxIds: [],
      revealedMapPathIds: [],
      characterSheet: createCharacterSheetState(bookId, gameMode),
    }
    return commit({
      ...progress,
      activeTrackId: track.id,
      tracks: [...progress.tracks, track],
    })
  }

  function renameTrack(name: string): boolean {
    if (!activeTrack || name.trim() === '') {
      return false
    }

    return updateTrack(activeTrack.id, track => ({
      ...track,
      name: name.trim(),
    }))
  }

  function deleteTrack(): boolean {
    if (!progress || !activeTrack) {
      return false
    }

    const tracks = progress.tracks.filter(track => track.id !== activeTrack.id)
    return commit({
      ...progress,
      tracks,
      activeTrackId: tracks.at(0)?.id ?? null,
    })
  }

  function undoVisit(): boolean {
    if (!activeTrack || activeTrack.visits.length <= 1) {
      return false
    }

    const removedVisit = activeTrack.visits.at(-1)
    return updateTrack(activeTrack.id, track => {
      const visits = track.visits.slice(0, -1)
      const sheets = { ...track.characterSheet.sheets }
      const e01Sheet = sheets.E01
      if (removedVisit?.setLocalisation && e01Sheet?.bookId === 'E01') {
        sheets.E01 = {
          ...e01Sheet,
          localisation: getStoryTrackRuntime(visits).localisation ?? null,
        }
      }

      return {
        ...track,
        visits,
        characterSheet: { ...track.characterSheet, sheets },
      }
    })
  }

  function changeTrack(trackId: string): boolean {
    if (!progress?.tracks.some(track => track.id === trackId)) {
      return false
    }

    return commit({ ...progress, activeTrackId: trackId })
  }

  function chooseDestination(choice: StoryChoice): boolean {
    if (choice.kind !== 'destination') {
      return false
    }

    if (choice.via !== 'ro-entry') {
      return appendVisit(choice.position, choice.via, choice.returnTo)
    }

    const e01Sheet = activeTrack?.characterSheet.sheets.E01
    if (
      e01Sheet?.bookId === 'E01' &&
      e01Sheet.capsules.length >= e01CapsuleLimit
    ) {
      setError(
        'Les 15 capsules sont utilisées. Supprimez-en une avant d’entrer dans le Royaume des Ombres.',
      )
      return false
    }

    const originBook = choice.deathPosition
      ? getBookIdFromChapterId(choice.deathPosition)
      : undefined
    if (
      !choice.deathPosition ||
      !choice.returnTo ||
      !originBook ||
      originBook === 'E01'
    ) {
      setError('Les informations de cette capsule sont invalides.')
      return false
    }

    const capsule: E01Capsule = {
      originBook,
      deathChapter: choice.deathPosition.slice(
        choice.deathPosition.indexOf('-') + 1,
      ),
      returnChapter: choice.returnTo.slice(choice.returnTo.indexOf('-') + 1),
    }
    return appendVisit(choice.position, choice.via, choice.returnTo, capsule)
  }

  function continueToBook(book: Book): boolean {
    const chapterId = getBookData(book.id).startId
    return chapterId ? appendVisit({ chapterId }, 'choice') : false
  }

  function jumpTo(position: StoryPosition): boolean {
    return appendVisit(position, 'manual')
  }

  function returnFromExtension(): boolean {
    const returnTo = runtime?.returnTo
    return returnTo ? appendVisit({ chapterId: returnTo }, 'ro-return') : false
  }

  function updateCharacterSheet(sheet: BookCharacterSheet): boolean {
    if (!activeTrack || sheet.bookId !== currentBookId) {
      return false
    }

    const characterSheet: CharacterSheetState = {
      ...activeTrack.characterSheet,
      sheets: { ...activeTrack.characterSheet.sheets, [sheet.bookId]: sheet },
    }
    if (!isCharacterSheetState(characterSheet)) {
      setError(
        'La feuille contient une valeur invalide. Vérifiez les limites indiquées.',
      )
      return false
    }

    return updateTrack(activeTrack.id, track => ({
      ...track,
      characterSheet,
    }))
  }

  function setGameMode(gameMode: GameMode): boolean {
    if (!activeTrack) {
      return false
    }

    const characterSheet = { ...activeTrack.characterSheet, gameMode }
    return updateTrack(activeTrack.id, track => ({
      ...track,
      characterSheet,
    }))
  }

  function saveAtSavepoint(
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ): boolean {
    const candidate = activeTrack?.characterSheet.sheets.T01
    const sheet = candidate?.bookId === 'T01' ? candidate : undefined
    if (
      !activeTrack ||
      currentBookId !== 'T01' ||
      currentPosition?.chapterId !== markerChapterId ||
      !sheet ||
      slotIndex < 0 ||
      !Number.isInteger(slotIndex) ||
      slotIndex >= 3
    ) {
      return false
    }

    const snapshot = {
      bookId: sheet.bookId,
      maxLife: sheet.maxLife,
      currentLife: sheet.currentLife,
      dexterity: sheet.dexterity,
      luck: sheet.luck,
      skills: [...sheet.skills],
      weaponsAndFeatures: sheet.weaponsAndFeatures,
      inventory: sheet.inventory.map(item => ({ ...item })),
      inventoryOverflow: sheet.inventoryOverflow.map(item => ({ ...item })),
    }
    const savepoint: T01Savepoint = {
      markerChapterId,
      resumeChapterId,
      sheet: {
        ...snapshot,
      },
      gameMode: activeTrack.characterSheet.gameMode,
    }
    const savepoints = [...sheet.savepoints]
    savepoints[slotIndex] = savepoint
    return updateCharacterSheet({ ...sheet, savepoints })
  }

  function restoreSavepoint(slotIndex: number): boolean {
    const candidate = activeTrack?.characterSheet.sheets.T01
    const sheet = candidate?.bookId === 'T01' ? candidate : undefined
    const savepoint = sheet?.savepoints.at(slotIndex)
    if (!activeTrack || currentBookId !== 'T01' || !sheet || !savepoint) {
      return false
    }
    if (!getBookData('T01').chaptersById.has(savepoint.resumeChapterId)) {
      setError('Le chapitre de reprise de cette sauvegarde est introuvable.')
      return false
    }

    const restoredSheet: T01CharacterSheet = {
      ...savepoint.sheet,
      inventory: savepoint.sheet.inventory.map(item => ({ ...item })),
      inventoryOverflow: savepoint.sheet.inventoryOverflow.map(item => ({
        ...item,
      })),
      savepoints: sheet.savepoints,
    }
    const characterSheet: CharacterSheetState = {
      ...activeTrack.characterSheet,
      gameMode: savepoint.gameMode,
      sheets: { ...activeTrack.characterSheet.sheets, T01: restoredSheet },
    }
    const visit = createStoryVisit(
      { chapterId: savepoint.resumeChapterId },
      'manual',
    )
    return updateTrack(activeTrack.id, track => ({
      ...track,
      visits: [...track.visits, visit],
      characterSheet,
    }))
  }

  function removeE01Capsule(capsuleIndex: number): boolean {
    const sheet = activeTrack?.characterSheet.sheets.E01
    if (
      !activeTrack ||
      sheet?.bookId !== 'E01' ||
      capsuleIndex < 0 ||
      capsuleIndex >= sheet.capsules.length
    ) {
      return false
    }

    return updateCharacterSheet({
      ...sheet,
      capsules: sheet.capsules.filter((_, index) => index !== capsuleIndex),
    })
  }

  function toggleCheckbox(checkboxId: string): boolean {
    if (!activeTrack) {
      return false
    }

    if (!getAllStoryCheckboxes().some(checkbox => checkbox.id === checkboxId)) {
      setError('Cette case ne figure pas dans les données du livre.')
      return false
    }

    return updateTrack(activeTrack.id, track => ({
      ...track,
      checkedCheckboxIds: track.checkedCheckboxIds.includes(checkboxId)
        ? track.checkedCheckboxIds.filter(id => id !== checkboxId)
        : [...track.checkedCheckboxIds, checkboxId],
    }))
  }

  function revealMapPath(mapPathId: string): boolean {
    if (!activeTrack) {
      return false
    }

    if (!getAllMapPathIds().has(mapPathId)) {
      setError('Ce chemin ne figure pas dans les données de la carte.')
      return false
    }

    if (activeTrack.revealedMapPathIds.includes(mapPathId)) {
      return true
    }

    return updateTrack(activeTrack.id, track => ({
      ...track,
      revealedMapPathIds: [...track.revealedMapPathIds, mapPathId],
    }))
  }

  function getReturnLabel(): string | undefined {
    return runtime?.returnTo
      ? getDestinationLabel({ chapterId: runtime.returnTo })
      : undefined
  }

  return {
    activeTrack,
    changeTrack,
    choices,
    continueToBook,
    createTrack,
    currentBook,
    currentChapter,
    currentPosition,
    currentBookSheet: currentBookId
      ? activeTrack?.characterSheet.sheets[currentBookId]
      : undefined,
    deleteTrack,
    error,
    isEnd,
    jumpTo,
    nextBook,
    progress,
    renameTrack,
    returnFromExtension,
    returnLabel: getReturnLabel(),
    restoreSavepoint,
    revealMapPath,
    removeE01Capsule,
    saveAtSavepoint,
    setGameMode,
    toggleCheckbox,
    undoVisit,
    updateCharacterSheet,
    chooseDestination,
  }
}

function ensureBookSheet(
  track: StoryTrack,
  targetChapterId: ChapterId,
): CharacterSheetState {
  const targetBookId = getBookIdFromChapterId(targetChapterId)
  if (!targetBookId || track.characterSheet.sheets[targetBookId]) {
    return track.characterSheet
  }

  const sourceChapterId = getCurrentPosition(track)?.chapterId
  const sourceBookId = sourceChapterId
    ? getBookIdFromChapterId(sourceChapterId)
    : undefined
  const sourceSheet = sourceBookId
    ? track.characterSheet.sheets[sourceBookId]
    : undefined
  let sheet: BookCharacterSheet

  if (
    isMainTomeId(targetBookId) &&
    isMainTomeId(sourceBookId) &&
    isMainTomeSheet(sourceSheet)
  ) {
    sheet = convertMainTomeSheet(sourceSheet, targetBookId)
  } else {
    sheet = createBlankBookSheet(targetBookId)
  }

  if (sheet.bookId === 'E01') {
    sheet.localisation = getStoryTrackRuntime(track.visits).localisation ?? null
  }

  return {
    ...track.characterSheet,
    sheets: { ...track.characterSheet.sheets, [targetBookId]: sheet },
  }
}

function isMainTomeId(bookId: BookId | undefined): bookId is MainTomeId {
  return (
    bookId === 'T01' || bookId === 'T02' || bookId === 'T03' || bookId === 'T04'
  )
}

function isMainTomeSheet(
  sheet: BookCharacterSheet | undefined,
): sheet is Extract<BookCharacterSheet, { bookId: MainTomeId }> {
  return (
    sheet?.bookId === 'T01' ||
    sheet?.bookId === 'T02' ||
    sheet?.bookId === 'T03' ||
    sheet?.bookId === 'T04'
  )
}
