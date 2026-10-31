import {
  Box,
  Button,
  createListCollection,
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
import { LuX } from 'react-icons/lu'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getBookColorPalette } from 'components/ui/theme'
import type { StoryTrack } from 'services/storyProgress'
import { getDestinationLabel } from 'services/storyNavigation'
import { isBookId } from 'services/bookData'

const tomeCollection = createListCollection({
  items: books
    .filter(book => book.category === 'Tome')
    .map(book => ({ label: book.title, value: book.id })),
})

const trackCollectionFor = (tracks: StoryTrack[]) =>
  createListCollection({
    items: tracks.map(track => ({ label: track.name, value: track.id })),
  })

type FormSubmitEvent = {
  preventDefault: () => void
}

export function StoryProgressDrawer({
  open,
  onOpenChange,
  tracks,
  activeTrack,
  bookId,
  error,
  onChangeTrack,
  onCreateTrack,
  onRenameTrack,
  onDeleteTrack,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tracks: StoryTrack[]
  activeTrack?: StoryTrack
  bookId?: BookId
  error?: string
  onChangeTrack: (trackId: string) => void
  onCreateTrack: (name: string, bookId: BookId) => boolean
  onRenameTrack: (name: string) => boolean
  onDeleteTrack: () => boolean
}) {
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackBook, setNewTrackBook] = useState<BookId>('T01')
  const trackCollection = trackCollectionFor(tracks)

  function submitNewTrack(event: FormSubmitEvent) {
    event.preventDefault()
    if (onCreateTrack(newTrackName, newTrackBook)) {
      setNewTrackName('')
      onOpenChange(false)
    }
  }

  function deleteTrack() {
    if (
      activeTrack &&
      window.confirm(`Supprimer le parcours « ${activeTrack.name} » ?`)
    ) {
      if (onDeleteTrack()) {
        onOpenChange(false)
      }
    }
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={details => onOpenChange(details.open)}
      placement="end"
      size="sm"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content colorPalette={getBookColorPalette(bookId)}>
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
              {error && (
                <Box role="alert" padding="3" bg="bg.error">
                  <Text color="fg.error">{error}</Text>
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
                      onChangeTrack(trackId)
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
                  onSubmit={submitNewTrack}
                >
                  <Field.Root>
                    <Field.Label>Nom (facultatif)</Field.Label>
                    <Input
                      value={newTrackName}
                      onChange={event => setNewTrackName(event.target.value)}
                      placeholder={`Parcours ${tracks.length + 1}`}
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
                  <Button type="submit">Créer le parcours</Button>
                </Box>
              </Box>

              {activeTrack && (
                <>
                  <Box borderTopWidth="1px" paddingTop="4">
                    <Heading size="md">Gérer le parcours</Heading>
                    <RenameTrackForm
                      key={activeTrack.id}
                      name={activeTrack.name}
                      onRename={onRenameTrack}
                      onDelete={deleteTrack}
                    />
                  </Box>
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
                </>
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
  )
}

function RenameTrackForm({
  name,
  onRename,
  onDelete,
}: {
  name: string
  onRename: (name: string) => boolean
  onDelete: () => void
}) {
  const [renameDraft, setRenameDraft] = useState(name)

  function submit(event: FormSubmitEvent) {
    event.preventDefault()
    onRename(renameDraft)
  }

  return (
    <Box
      as="form"
      display="flex"
      flexDirection="column"
      gap="3"
      marginTop="3"
      onSubmit={submit}
    >
      <Field.Root>
        <Field.Label>Nom du parcours</Field.Label>
        <Input
          value={renameDraft}
          onChange={event => setRenameDraft(event.target.value)}
        />
      </Field.Root>
      <Button type="submit" variant="outline">
        Renommer
      </Button>
      <Button
        type="button"
        variant="outline"
        color="fg.error"
        onClick={onDelete}
      >
        Supprimer le parcours
      </Button>
    </Box>
  )
}
