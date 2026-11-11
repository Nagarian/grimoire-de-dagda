import {
  Accordion,
  Box,
  Button,
  createListCollection,
  Field,
  Input,
  Portal,
  Select,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getLocalizedBookTitle } from 'services/i18n'
import { getBookColorPalette } from 'components/ui/theme'
import { SettingsSection } from 'components/Settings/SettingsSection'
import type { StoryTrack } from 'services/storyProgress'
import { isBookId } from 'services/bookData'
import type { GameMode } from 'services/characterSheet'
import { GameModeField } from 'components/CharacterSheet/Inputs/GameModeField'

const trackCollectionFor = (tracks: StoryTrack[]) =>
  createListCollection({
    items: tracks.map(track => ({ label: track.name, value: track.id })),
  })

type FormSubmitEvent = {
  preventDefault: () => void
}

export function TrackManagementPanel({
  tracks,
  activeTrack,
  bookId,
  error,
  onChangeTrack,
  onCreateTrack,
  onRenameTrack,
  onDeleteTrack,
}: {
  tracks: StoryTrack[]
  activeTrack?: StoryTrack
  bookId?: BookId
  error?: string
  onChangeTrack: (trackId: string) => void
  onCreateTrack: (name: string, bookId: BookId, gameMode: GameMode) => boolean
  onRenameTrack: (name: string) => boolean
  onDeleteTrack: () => boolean
}) {
  const { t } = useTranslation()
  const tomeCollection = createListCollection({
    items: books
      .filter(book => book.category === 'Tome')
      .map(book => ({
        label: getLocalizedBookTitle(book.id),
        value: book.id,
      })),
  })
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackBook, setNewTrackBook] = useState<BookId>('T01')
  const [newTrackGameMode, setNewTrackGameMode] = useState<GameMode>()
  const trackCollection = trackCollectionFor(tracks)
  function submitNewTrack(event: FormSubmitEvent) {
    event.preventDefault()
    if (
      newTrackGameMode &&
      onCreateTrack(newTrackName, newTrackBook, newTrackGameMode)
    ) {
      setNewTrackName('')
      setNewTrackGameMode(undefined)
    }
  }

  function deleteTrack() {
    if (
      activeTrack &&
      window.confirm(t('track.deleteConfirm', { name: activeTrack.name }))
    ) {
      onDeleteTrack()
    }
  }

  return (
    <SettingsSection title={t('settings.trackManagement')}>
      <Box
        display="flex"
        flexDirection="column"
        gap="4"
        colorPalette={getBookColorPalette(bookId)}
      >
        {error && (
          <Box role="alert" padding="3" bg="bg.error">
            <Text color="fg.error">{error}</Text>
          </Box>
        )}
        <Field.Root>
          <Field.Label>{t('track.active')}</Field.Label>
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
                <Select.ValueText placeholder={t('track.choose')} />
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

        <Accordion.Root multiple collapsible>
          <AccordionSection value="new-game" title={t('track.newGame')}>
            <Box
              as="form"
              display="flex"
              flexDirection="column"
              gap="3"
              marginTop="3"
              onSubmit={submitNewTrack}
            >
              <Field.Root>
                <Field.Label>{t('track.optionalName')}</Field.Label>
                <Input
                  value={newTrackName}
                  onChange={event => setNewTrackName(event.target.value)}
                  placeholder={t('track.numberedName', {
                    number: tracks.length + 1,
                  })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t('track.startingBook')}</Field.Label>
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
              <GameModeField
                bookId={newTrackBook}
                value={newTrackGameMode ?? null}
                onChange={mode => {
                  setNewTrackGameMode(mode)
                  return true
                }}
              />
              <Button type="submit" disabled={!newTrackGameMode}>
                {t('track.create')}
              </Button>
            </Box>
          </AccordionSection>
          <AccordionSection value="manage-track" title={t('track.manage')}>
            {activeTrack ? (
              <RenameTrackForm
                key={activeTrack.id}
                name={activeTrack.name}
                onRename={onRenameTrack}
                onDelete={deleteTrack}
              />
            ) : (
              <Text color="fg.muted">{t('track.createToManage')}</Text>
            )}
          </AccordionSection>
        </Accordion.Root>
        <Text fontSize="sm" color="fg.muted">
          {t('track.localStorageNotice')}
        </Text>
      </Box>
    </SettingsSection>
  )
}

function AccordionSection({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: ReactNode
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.ItemTrigger>
        <Text flex="1" textAlign="start" fontWeight="semibold">
          {title}
        </Text>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody>{children}</Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
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
  const { t } = useTranslation()
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
        <Field.Label>{t('track.name')}</Field.Label>
        <Input
          value={renameDraft}
          onChange={event => setRenameDraft(event.target.value)}
        />
      </Field.Root>
      <Button type="submit" variant="outline">
        {t('track.rename')}
      </Button>
      <Button
        type="button"
        variant="outline"
        color="fg.error"
        onClick={onDelete}
      >
        {t('track.delete')}
      </Button>
    </Box>
  )
}
