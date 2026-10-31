import {
  Box,
  Button,
  createListCollection,
  Dialog,
  Drawer,
  Field,
  Heading,
  IconButton,
  Input,
  Portal,
  Select,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuMenu, LuUndo2, LuX } from 'react-icons/lu'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [manualJumpOpen, setManualJumpOpen] = useState(false)
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
  const runtime = activeTrack
    ? getStoryTrackRuntime(activeTrack.visits)
    : undefined
  const nextTome = currentPosition
    ? tomeBooks[
        (tomeBooks.findIndex(book => book.id === currentPosition.bookId) + 1) %
          tomeBooks.length
      ]
    : undefined

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
    via: StoryVisitType,
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
      setMenuOpen(false)
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
    if (
      commit({
        ...progress,
        tracks,
        activeTrackId: tracks.at(0)?.id ?? null,
      })
    ) {
      setMenuOpen(false)
    }
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

  function openManualJump() {
    if (currentPosition) {
      setManualBook(currentPosition.bookId)
      setManualChapter(currentPosition.chapterId)
    }
    setManualJumpOpen(true)
  }

  function jumpToManualDestination(event: FormSubmitEvent) {
    event.preventDefault()
    if (
      appendVisit({ bookId: manualBook, chapterId: manualChapter }, 'manual')
    ) {
      setManualJumpOpen(false)
    }
  }

  function chooseDestination(choice: StoryChoice) {
    if (choice.kind === 'destination') {
      appendVisit(choice.position, choice.via, choice.returnTo)
    }
  }

  function returnFromRoyaume() {
    const returnTo = runtime?.returnTo
    if (returnTo) {
      appendVisit(returnTo, 'ro-return')
    }
  }

  function changeTrack(trackId: string) {
    if (progress?.tracks.some(track => track.id === trackId)) {
      commit({ ...progress, activeTrackId: trackId })
    }
  }

  if (!progress) {
    return (
      <Box padding="4" role="alert">
        <Text color="fg.error">
          {storageError ?? 'Impossible de charger les parcours enregistrés.'}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      height="100%"
      minHeight="0"
      width="100%"
      minWidth="0"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box
        as="header"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="3"
        paddingX={{ base: '3', md: '6' }}
        paddingY="2"
        borderBottomWidth="1px"
      >
        <Box minWidth="0">
          <Text fontSize="sm" color="fg.muted" truncate>
            {activeTrack?.name ?? 'Votre aventure'}
          </Text>
          <Text fontWeight="semibold" truncate>
            {currentBook?.title ?? 'Choisissez votre départ'}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap="1" flexShrink="0">
          <Button
            variant="ghost"
            size="sm"
            disabled={!activeTrack || activeTrack.visits.length <= 1}
            onClick={undoVisit}
            aria-label="Annuler la dernière étape"
          >
            <LuUndo2 />
            <Text hideBelow="sm">Annuler</Text>
          </Button>
          <IconButton
            aria-label="Ouvrir le menu du parcours"
            variant="ghost"
            onClick={() => setMenuOpen(true)}
          >
            <LuMenu />
          </IconButton>
        </Box>
      </Box>

      {storageError && !menuOpen && (
        <Box role="alert" paddingX="4" paddingY="2" bg="bg.error">
          <Text color="fg.error">{storageError}</Text>
        </Box>
      )}

      <Box
        as="main"
        flex="1"
        minHeight="0"
        overflowY="auto"
        paddingX={{ base: '3', sm: '5', md: '8' }}
        paddingY={{ base: '4', md: '8' }}
      >
        <Box
          width="100%"
          maxWidth="breakpoint-md"
          marginX="auto"
          minHeight="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          gap={{ base: '5', md: '8' }}
        >
          {activeTrack && currentPosition && currentBook && currentChapter ? (
            <>
              <Box
                textAlign="center"
                padding={{ base: '5', md: '8' }}
                borderWidth="1px"
                borderRadius="xl"
                bg="bg.panel"
                boxShadow="sm"
              >
                <Text
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="fg.muted"
                  fontSize="sm"
                >
                  {currentPosition.bookId}
                </Text>
                <Heading size="2xl" marginTop="2">
                  {currentPosition.chapterId === 'MAP'
                    ? 'Carte du monde'
                    : `Chapitre ${currentPosition.chapterId}`}
                </Heading>
                {currentPosition.chapterId === 'MAP' && (
                  <Text marginTop="2">{currentBook.title}</Text>
                )}
              </Box>

              {currentChoices.length > 0 && (
                <Box display="flex" flexDirection="column" gap="3">
                  <Text
                    textAlign="center"
                    fontSize="sm"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    Que faites-vous ?
                  </Text>
                  {currentChoices.map(choice => (
                    <ChoiceButton
                      key={choice.id}
                      choice={choice}
                      onChoose={chooseDestination}
                    />
                  ))}
                </Box>
              )}

              {activeEnd && currentPosition.bookId !== 'E01' && nextTome && (
                <Button
                  colorPalette="orange"
                  size="lg"
                  onClick={() =>
                    appendVisit(
                      {
                        bookId: nextTome.id,
                        chapterId: getBookData(nextTome.id).startId,
                      },
                      'choice',
                    )
                  }
                >
                  Continuer vers {nextTome.title}
                </Button>
              )}

              {currentPosition.bookId === 'E01' &&
                activeEnd &&
                runtime?.returnTo && (
                  <Button
                    colorPalette="orange"
                    size="lg"
                    onClick={returnFromRoyaume}
                  >
                    Revenir à {getDestinationLabel(runtime.returnTo)}
                  </Button>
                )}

              {activeEnd &&
                currentPosition.bookId === 'E01' &&
                !runtime?.returnTo && (
                  <Text textAlign="center" color="fg.muted">
                    Fin de cette extension.
                  </Text>
                )}

              <Button
                variant="ghost"
                alignSelf="center"
                onClick={openManualJump}
              >
                Aller à un autre chapitre…
              </Button>
            </>
          ) : (
            <Box textAlign="center" padding="6">
              <Heading size="xl">Commencez votre aventure</Heading>
              <Text marginTop="3" color="fg.muted">
                Créez un parcours pour choisir votre tome de départ.
              </Text>
              <Button
                marginTop="5"
                colorPalette="orange"
                size="lg"
                onClick={() => setMenuOpen(true)}
              >
                Créer un parcours
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Drawer.Root
        open={menuOpen}
        onOpenChange={details => setMenuOpen(details.open)}
        placement="end"
        size="sm"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Menu du parcours</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <IconButton
                    aria-label="Fermer le menu"
                    variant="ghost"
                    size="sm"
                  >
                    <LuX />
                  </IconButton>
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body display="flex" flexDirection="column" gap="5">
                {storageError && (
                  <Box role="alert" padding="3" bg="bg.error">
                    <Text color="fg.error">{storageError}</Text>
                  </Box>
                )}
                <Field.Root>
                  <Field.Label>Parcours actif</Field.Label>
                  <Select.Root
                    collection={trackCollection}
                    value={activeTrack ? [activeTrack.id] : []}
                    onValueChange={event => {
                      const trackId = event.value.at(0)
                      if (trackId) {
                        changeTrack(trackId)
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

                <Box borderTopWidth="1px" paddingTop="4">
                  <Heading size="md">Nouvelle partie</Heading>
                  <Box
                    as="form"
                    display="flex"
                    flexDirection="column"
                    gap="3"
                    marginTop="3"
                    onSubmit={createTrack}
                  >
                    <Field.Root>
                      <Field.Label>Nom (facultatif)</Field.Label>
                      <Input
                        value={newTrackName}
                        onChange={event => setNewTrackName(event.target.value)}
                        placeholder={`Parcours ${progress.tracks.length + 1}`}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Tome de départ</Field.Label>
                      <Select.Root
                        collection={tomeCollection}
                        value={[newTrackBook]}
                        onValueChange={event => {
                          const selected = event.value.at(0)
                          if (
                            selected &&
                            isBookId(selected) &&
                            selected !== 'E01'
                          ) {
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
                    <Button type="submit" colorPalette="orange">
                      Créer le parcours
                    </Button>
                  </Box>
                </Box>

                {activeTrack && (
                  <Box borderTopWidth="1px" paddingTop="4">
                    <Heading size="md">Gérer le parcours</Heading>
                    <Box
                      as="form"
                      display="flex"
                      flexDirection="column"
                      gap="3"
                      marginTop="3"
                      onSubmit={renameTrack}
                    >
                      <Field.Root>
                        <Field.Label>Nom du parcours</Field.Label>
                        <Input
                          value={renameValue}
                          onChange={event =>
                            setRenameDraft({
                              trackId: activeTrack.id,
                              value: event.target.value,
                            })
                          }
                        />
                      </Field.Root>
                      <Button type="submit" variant="outline">
                        Renommer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        colorPalette="red"
                        onClick={deleteTrack}
                      >
                        Supprimer le parcours
                      </Button>
                    </Box>
                  </Box>
                )}

                {activeTrack && (
                  <Box borderTopWidth="1px" paddingTop="4">
                    <Heading size="md">Historique</Heading>
                    <Box
                      as="ol"
                      paddingStart="5"
                      marginTop="2"
                      maxHeight="30vh"
                      overflowY="auto"
                    >
                      {activeTrack.visits.map((visit, index) => (
                        <Box
                          as="li"
                          key={`${visit.bookId}-${visit.chapterId}-${index}`}
                          aria-current={
                            index === activeTrack.visits.length - 1
                              ? 'location'
                              : undefined
                          }
                          paddingY="1"
                        >
                          {getDestinationLabel(visit)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Drawer.Body>
              <Drawer.Footer>
                <Text fontSize="sm" color="fg.muted">
                  Votre progression est enregistrée sur cet appareil.
                </Text>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Dialog.Root
        open={manualJumpOpen}
        onOpenChange={details => setManualJumpOpen(details.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Aller à un autre chapitre</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton aria-label="Fermer" variant="ghost" size="sm">
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <Box
                  as="form"
                  display="flex"
                  flexDirection="column"
                  gap="3"
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
                  <Dialog.Footer paddingX="0">
                    <Button type="submit" colorPalette="orange" width="100%">
                      Ajouter au parcours
                    </Button>
                  </Dialog.Footer>
                </Box>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
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
        <Button width="100%" disabled title={choice.reason}>
          {choice.label}
        </Button>
        <Text fontSize="sm" color="fg.error" marginTop="1">
          {choice.reason}
        </Text>
      </Box>
    )
  }

  return (
    <Button
      size="lg"
      width="100%"
      minHeight="12"
      colorPalette="orange"
      variant="outline"
      onClick={() => onChoose(choice)}
    >
      {choice.label}
    </Button>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Une erreur inconnue est survenue pendant la sauvegarde.'
}
