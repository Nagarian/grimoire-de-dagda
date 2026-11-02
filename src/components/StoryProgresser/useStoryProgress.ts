import { useState } from 'react'
import type { BookId, Book } from 'services/books'
import { books } from 'services/books'
import { getBookData } from 'services/bookData'
import type { StoryChoice } from 'services/storyNavigation'
import { getDestinationLabel, getStoryChoices } from 'services/storyNavigation'
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
  saveStoryProgress,
} from 'services/storyProgress'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'

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
  const currentBook = currentPosition
    ? getBookData(currentPosition.bookId)
    : undefined
  const currentChapter = currentPosition
    ? currentBook?.chaptersById.get(currentPosition.chapterId)
    : undefined
  const choices =
    activeTrack && currentPosition
      ? getStoryChoices(currentPosition, activeTrack)
      : []
  const runtime = activeTrack
    ? getStoryTrackRuntime(activeTrack.visits)
    : undefined
  const isEnd = currentPosition
    ? currentBook?.endIds.includes(currentPosition.chapterId) === true
    : false
  const nextBook = currentPosition
    ? tomeBooks[
        (tomeBooks.findIndex(book => book.id === currentPosition.bookId) + 1) %
          tomeBooks.length
      ]
    : undefined

  function commit(next: StoryProgressData): boolean {
    try {
      saveStoryProgress(next)
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
    returnTo?: StoryPosition,
  ): boolean {
    if (!activeTrack) {
      return false
    }

    return updateTrack(activeTrack.id, track => ({
      ...track,
      visits: [...track.visits, createStoryVisit(position, via, returnTo)],
    }))
  }

  function createTrack(name: string, bookId: BookId): boolean {
    if (!progress) {
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
      visits: [createStoryVisit({ bookId, chapterId: book.startId }, 'start')],
      checkedCheckboxIds: [],
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

    return updateTrack(activeTrack.id, track => ({
      ...track,
      visits: track.visits.slice(0, -1),
    }))
  }

  function changeTrack(trackId: string): boolean {
    if (!progress?.tracks.some(track => track.id === trackId)) {
      return false
    }

    return commit({ ...progress, activeTrackId: trackId })
  }

  function chooseDestination(choice: StoryChoice): boolean {
    return choice.kind === 'destination'
      ? appendVisit(choice.position, choice.via, choice.returnTo)
      : false
  }

  function continueToBook(book: Book): boolean {
    const chapterId = getBookData(book.id).startId
    return chapterId
      ? appendVisit({ bookId: book.id, chapterId }, 'choice')
      : false
  }

  function jumpTo(position: StoryPosition): boolean {
    return appendVisit(position, 'manual')
  }

  function returnFromExtension(): boolean {
    const returnTo = runtime?.returnTo
    return returnTo ? appendVisit(returnTo, 'ro-return') : false
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

  function getReturnLabel(): string | undefined {
    return runtime?.returnTo ? getDestinationLabel(runtime.returnTo) : undefined
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
    deleteTrack,
    error,
    isEnd,
    jumpTo,
    nextBook,
    progress,
    renameTrack,
    returnFromExtension,
    returnLabel: getReturnLabel(),
    toggleCheckbox,
    undoVisit,
    chooseDestination,
  }
}
