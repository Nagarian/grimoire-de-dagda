import {
  Box,
  Button,
  createListCollection,
  Field,
  Heading,
  Input,
  Portal,
  Select,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getBookData, isBookId } from 'services/bookData'
import type { StoryChoice } from 'services/storyNavigation'
import { getDestinationLabel, getStoryChoices } from 'services/storyNavigation'
import type {
  StoryPosition,
  StoryProgressData,
  StoryTrack,
  StoryVisitType,
} from 'services/storyProgress'
import {
  createStoryVisit,
  getCurrentPosition,
  getStoryTrackRuntime,
  loadStoryProgress,
  saveStoryProgress,
} from 'services/storyProgress'

const bookCollection = createListCollection({
  items: books.map(book => ({ label: book.title, value: book.id })),
})

const tomeBooks = books.filter(book => book.category === 'Tome')
const tomeCollection = createListCollection({
  items: tomeBooks.map(book => ({ label: book.title, value: book.id })),
})

type FormSubmitEvent = {
  preventDefault: () => void
}

export function StoryProgresser() {
  const [initialState] = useState(() => {
    try {
      return { progress: loadStoryProgress(), error: undefined }
    } catch (error) {
      return { progress: undefined, error: errorMessage(error) }
    }
  })
  const [progress, setProgress] = useState(initialState.progress)
  const [storageError, setStorageError] = useState(initialState.error)
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackBook, setNewTrackBook] = useState<BookId>('T01')
  const [renameDraft, setRenameDraft] = useState<{
    trackId: string
    value: string
  }>()
  const [manualBook, setManualBook] = useState<BookId>('T01')
  const [manualChapter, setManualChapter] = useState('1')

  const activeTrack = progress?.tracks.find(
    track => track.id === progress.activeTrackId,
  )
  const renameValue =
    activeTrack && renameDraft?.trackId === activeTrack.id
      ? renameDraft.value
      : (activeTrack?.name ?? '')
  const currentPosition = activeTrack
    ? getCurrentPosition(activeTrack)
    : undefined
  const currentBook = currentPosition
    ? getBookData(currentPosition.bookId)
    : undefined
  const currentChapter = currentPosition
    ? currentBook?.chaptersById.get(currentPosition.chapterId)
    : undefined
  const currentChoices =
    activeTrack && currentPosition
      ? getStoryChoices(currentPosition, activeTrack)
      : []
  const activeEnd = currentPosition
    ? currentBook?.endIds.includes(currentPosition.chapterId) === true
    : false
  const trackCollection = createListCollection({
    items:
      progress?.tracks.map(track => ({ label: track.name, value: track.id })) ??
      [],
  })
  const manualBookData = getBookData(manualBook)
  const manualChapterCollection = createListCollection({
    items: manualBookData.chapters.map(chapter => ({
      label: chapter.id === 'MAP' ? 'Carte du monde' : `Chapitre ${chapter.id}`,
      value: chapter.id,
    })),
  })

  function commit(next: StoryProgressData): boolean {
    try {
      saveStoryProgress(next)
      setProgress(next)
      setStorageError(undefined)
      return true
    } catch (error) {
      setStorageError(errorMessage(error))
      return false
    }
  }

  function updateTrack(
    trackId: string,
    update: (track: StoryTrack) => StoryTrack,
  ) {
    if (!progress) {
      return
    }

    commit({
      ...progress,
      tracks: progress.tracks.map(track =>
        track.id === trackId ? update(track) : track,
      ),
    })
  }

  function appendVisit(
    position: StoryPosition,
    via: StoryVisitType,
    returnTo?: StoryPosition,
  ) {
    if (!progress || !activeTrack) {
      return
    }

    updateTrack(activeTrack.id, track => ({
      ...track,
      visits: [...track.visits, createStoryVisit(position, via, returnTo)],
    }))
  }

  function createTrack(event: FormSubmitEvent) {
    event.preventDefault()
    if (!progress) {
      return
    }

    const book = getBookData(newTrackBook)
    if (!book.startId) {
      setStorageError(
        `Le livre ${book.title} ne contient pas de chapitre START.`,
      )
      return
    }

    const trackNumber = progress.tracks.length + 1
    const track: StoryTrack = {
      id: crypto.randomUUID(),
      name: newTrackName.trim() || `Parcours ${trackNumber}`,
      visits: [
        createStoryVisit(
          { bookId: newTrackBook, chapterId: book.startId },
          'start',
        ),
      ],
    }
    if (
      commit({
        ...progress,
        activeTrackId: track.id,
        tracks: [...progress.tracks, track],
      })
    ) {
      setNewTrackName('')
      setManualBook(newTrackBook)
      setManualChapter(book.startId)
    }
  }

  function renameTrack(event: FormSubmitEvent) {
    event.preventDefault()
    if (!activeTrack || renameValue.trim() === '') {
      return
    }
    updateTrack(activeTrack.id, track => ({
      ...track,
      name: renameValue.trim(),
    }))
  }

  function deleteTrack() {
    if (!progress || !activeTrack) {
      return
    }
    if (!window.confirm(`Supprimer le parcours « ${activeTrack.name} » ?`)) {
      return
    }

    const tracks = progress.tracks.filter(track => track.id !== activeTrack.id)
    commit({
      ...progress,
      tracks,
      activeTrackId: tracks.at(0)?.id ?? null,
    })
  }

  function undoVisit() {
    if (!activeTrack || activeTrack.visits.length <= 1) {
      return
    }
    updateTrack(activeTrack.id, track => ({
      ...track,
      visits: track.visits.slice(0, -1),
    }))
  }

  function jumpToManualDestination(event: FormSubmitEvent) {
    event.preventDefault()
    appendVisit({ bookId: manualBook, chapterId: manualChapter }, 'manual')
  }

  function chooseDestination(choice: StoryChoice) {
    if (choice.kind !== 'destination') {
      return
    }
    appendVisit(choice.position, choice.via, choice.returnTo)
  }

  function chooseNextTome() {
    if (!currentPosition || !currentBook) {
      return
    }
    const nextIndex =
      (tomeBooks.findIndex(book => book.id === currentPosition.bookId) + 1) %
      tomeBooks.length
    const nextBook = tomeBooks[nextIndex]
    if (!nextBook) {
      return
    }
    const next = getBookData(nextBook.id)
    appendVisit({ bookId: next.id, chapterId: next.startId }, 'choice')
  }

  function returnFromRoyaume() {
    if (!activeTrack) {
      return
    }
    const returnTo = getStoryTrackRuntime(activeTrack.visits).returnTo
    if (returnTo) {
      appendVisit(returnTo, 'ro-return')
    }
  }

  if (!progress) {
    return (
      <Box padding="4">
        <Text role="alert" color="fg.error">
          {storageError ?? 'Impossible de charger les parcours enregistrés.'}
        </Text>
      </Box>
    )
  }

  const runtime = activeTrack
    ? getStoryTrackRuntime(activeTrack.visits)
    : undefined
  const nextTomeAvailable =
    activeEnd &&
    currentPosition !== undefined &&
    currentPosition.bookId !== 'E01'

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateRows="auto 1fr"
      gap="2"
      padding="2"
      overflow="hidden"
    >
      <Box>
        <Heading size="lg">Suivi de l’histoire</Heading>
        <Text>Suivez vos chapitres et vos passages d’un livre à l’autre.</Text>
        {storageError && (
          <Box role="alert" borderWidth="1px" padding="2" marginTop="2">
            <Text color="fg.error">{storageError}</Text>
          </Box>
        )}
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="minmax(0, 3fr) minmax(0, 2fr)"
        gap="3"
        minHeight="0"
        overflowY="auto"
      >
        <Box display="flex" flexDirection="column" gap="3">
          <Box display="flex" alignItems="end" gap="2">
            <Field.Root flex="1">
              <Field.Label>Parcours actif</Field.Label>
              <Select.Root
                collection={trackCollection}
                value={activeTrack ? [activeTrack.id] : []}
                onValueChange={event => {
                  const activeTrackId = event.value.at(0) ?? null
                  if (activeTrackId) {
                    const selectedTrack = progress.tracks.find(
                      track => track.id === activeTrackId,
                    )
                    const position = selectedTrack
                      ? getCurrentPosition(selectedTrack)
                      : undefined
                    if (position) {
                      setManualBook(position.bookId)
                      setManualChapter(position.chapterId)
                    }
                    commit({ ...progress, activeTrackId })
                  }
                }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Choisir un parcours" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {trackCollection.items.map(item => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            <Button
              variant="outline"
              disabled={!activeTrack || activeTrack.visits.length <= 1}
              onClick={undoVisit}
            >
              Annuler la dernière étape
            </Button>
          </Box>

          <Box borderWidth="1px" borderRadius="md" padding="3">
            <Heading size="md">Créer un parcours</Heading>
            <Box
              as="form"
              display="grid"
              gridTemplateColumns="1fr 1fr auto"
              gap="2"
              alignItems="end"
              marginTop="2"
              onSubmit={createTrack}
            >
              <Field.Root>
                <Field.Label>Nom (facultatif)</Field.Label>
                <Input
                  value={newTrackName}
                  onChange={event => setNewTrackName(event.target.value)}
                  placeholder="Parcours 1"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Tome de départ</Field.Label>
                <Select.Root
                  collection={tomeCollection}
                  value={[newTrackBook]}
                  onValueChange={event => {
                    const selected = event.value.at(0)
                    if (selected && isBookId(selected) && selected !== 'E01') {
                      setNewTrackBook(selected)
                    }
                  }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {tomeCollection.items.map(item => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Button type="submit">Créer</Button>
            </Box>
          </Box>

          {activeTrack && (
            <Box borderWidth="1px" borderRadius="md" padding="3">
              <Heading size="md">Renommer le parcours</Heading>
              <Box
                as="form"
                display="flex"
                gap="2"
                marginTop="2"
                onSubmit={renameTrack}
              >
                <Input
                  aria-label="Nom du parcours"
                  value={renameValue}
                  onChange={event =>
                    setRenameDraft({
                      trackId: activeTrack.id,
                      value: event.target.value,
                    })
                  }
                />
                <Button type="submit">Renommer</Button>
                <Button type="button" variant="outline" onClick={deleteTrack}>
                  Supprimer
                </Button>
              </Box>
            </Box>
          )}

          {activeTrack && currentPosition && currentChapter && currentBook && (
            <Box borderWidth="1px" borderRadius="md" padding="3">
              <Heading size="md">{currentBook.title}</Heading>
              <Text>
                {currentPosition.chapterId === 'MAP'
                  ? 'Carte du monde'
                  : `Chapitre ${currentPosition.chapterId}`}
              </Text>
              <Text color="fg.muted">
                {currentChapter.tokens
                  .filter(token => token.kind === 'marker')
                  .map(token => token.type.label)
                  .join(' · ')}
              </Text>

              {currentChoices.length > 0 && (
                <Box marginTop="3">
                  <Text fontWeight="bold">Chemins disponibles</Text>
                  <Box display="flex" flexWrap="wrap" gap="2" marginTop="2">
                    {currentChoices.map(choice => (
                      <ChoiceButton
                        key={choice.id}
                        choice={choice}
                        onChoose={chooseDestination}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {nextTomeAvailable && (
                <Button marginTop="3" onClick={chooseNextTome}>
                  Continuer vers le tome suivant
                </Button>
              )}

              {currentPosition.bookId === 'E01' &&
                activeEnd &&
                runtime?.returnTo && (
                  <Button marginTop="3" onClick={returnFromRoyaume}>
                    Revenir à {getDestinationLabel(runtime.returnTo)}
                  </Button>
                )}
            </Box>
          )}

          {activeTrack && (
            <Box borderWidth="1px" borderRadius="md" padding="3">
              <Heading size="md">Aller à un livre ou à un chapitre</Heading>
              <Text>
                Choisissez un livre puis le chapitre de destination. Ce saut
                manuel peut servir pour un chemin masqué ou une correction.
              </Text>
              <Box
                as="form"
                display="grid"
                gridTemplateColumns="1fr 1fr auto"
                gap="2"
                alignItems="end"
                marginTop="2"
                onSubmit={jumpToManualDestination}
              >
                <Field.Root>
                  <Field.Label>Livre</Field.Label>
                  <Select.Root
                    collection={bookCollection}
                    value={[manualBook]}
                    onValueChange={event => {
                      const selected = event.value.at(0)
                      if (
                        selected &&
                        isBookId(selected) &&
                        selected !== manualBook
                      ) {
                        const nextBook = getBookData(selected)
                        setManualBook(nextBook.id)
                        setManualChapter(nextBook.startId)
                      }
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {bookCollection.items.map(item => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Chapitre</Field.Label>
                  <Select.Root
                    collection={manualChapterCollection}
                    value={[manualChapter]}
                    onValueChange={event => {
                      const selected = event.value.at(0)
                      if (selected) {
                        setManualChapter(selected)
                      }
                    }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {manualChapterCollection.items.map(item => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
                <Button type="submit">Ajouter au parcours</Button>
              </Box>
            </Box>
          )}
        </Box>

        <Box borderWidth="1px" borderRadius="md" padding="3" minHeight="0">
          <Heading size="md">Historique du parcours</Heading>
          {activeTrack ? (
            <Box as="ol" paddingStart="5" overflowY="auto" maxHeight="100%">
              {activeTrack.visits.map((visit, index) => (
                <Box
                  as="li"
                  key={`${visit.bookId}-${visit.chapterId}-${index}`}
                  aria-current={index === activeTrack.visits.length - 1}
                  paddingY="1"
                >
                  {getDestinationLabel(visit)}
                </Box>
              ))}
            </Box>
          ) : (
            <Text marginTop="2">
              Créez un parcours pour commencer à suivre votre lecture.
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function ChoiceButton({
  choice,
  onChoose,
}: {
  choice: StoryChoice
  onChoose: (choice: StoryChoice) => void
}) {
  if (choice.kind === 'unavailable') {
    return (
      <Box>
        <Button disabled title={choice.reason}>
          {choice.label}
        </Button>
        <Text fontSize="sm" color="fg.error">
          {choice.reason}
        </Text>
      </Box>
    )
  }

  return <Button onClick={() => onChoose(choice)}>{choice.label}</Button>
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Une erreur inconnue est survenue pendant la sauvegarde.'
}
