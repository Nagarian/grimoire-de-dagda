import {
  Box,
  Button,
  Drawer,
  Heading,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuX } from 'react-icons/lu'
import { getBookColorPalette } from 'components/ui/theme'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getLocalizedBookTitle } from 'services/i18n'
import type { ChapterId } from 'services/chapterDsl'
import type { CharacterSavepoint, StoryTrack } from 'services/storyProgress'

export function CharacterSheetMenu({
  open,
  onOpenChange,
  activeTrack,
  currentBookId,
  savepointChapterId,
  error,
  onSaveAtSavepoint,
  onRestoreSavepoint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTrack: StoryTrack
  currentBookId?: BookId
  savepointChapterId?: ChapterId
  error?: string
  onSaveAtSavepoint: (slotIndex: number, chapterId?: ChapterId) => boolean
  onRestoreSavepoint: (bookId: BookId, slotIndex: number) => boolean
}) {
  const { t } = useTranslation()
  const registeredSheets = books.flatMap(book => {
    const sheet = activeTrack.characterSheet.sheets[book.id]
    return sheet ? [{ book, sheet }] : []
  })
  const canUseSavepoints = activeTrack.characterSheet.gameMode === 'simplified'

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
          <Drawer.Content colorPalette={getBookColorPalette(currentBookId)}>
            <Drawer.Header>
              <Drawer.Title>{t('characterSheet.sheets')}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton
                  aria-label={t('common.closeMenu')}
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body display="flex" flexDirection="column" gap="6">
              {error && (
                <Box role="alert" padding="3" bg="bg.error">
                  <Text color="fg.error">{error}</Text>
                </Box>
              )}
              <Box as="section" display="flex" flexDirection="column" gap="3">
                <Heading as="h2" size="md">
                  {t('characterSheet.savedSheets')}
                </Heading>
                {registeredSheets.length > 0 ? (
                  <Box as="ul" display="flex" flexDirection="column" gap="2">
                    {registeredSheets.map(({ book }) => (
                      <Box
                        as="li"
                        key={book.id}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap="3"
                        borderWidth="1px"
                        borderRadius="md"
                        padding="3"
                      >
                        <Text>{getLocalizedBookTitle(book.id)}</Text>
                        {book.id === currentBookId && (
                          <Text fontSize="sm" color="fg.muted">
                            {t('common.current')}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Text color="fg.muted">
                    {t('characterSheet.noSavedSheets')}
                  </Text>
                )}
              </Box>

              <Box as="section" display="flex" flexDirection="column" gap="3">
                <Heading as="h2" size="md">
                  {t('characterSheet.saves')}
                </Heading>
                {!canUseSavepoints && (
                  <Text fontSize="sm" color="fg.muted">
                    {t('characterSheet.savesOnlySimplified')}
                  </Text>
                )}
                {registeredSheets.map(({ book }) => (
                  <SavepointMenuSection
                    key={book.id}
                    bookId={book.id}
                    chapterSaves={activeTrack.savepoints[book.id] ?? []}
                    isCurrentBook={book.id === currentBookId}
                    canUseSavepoints={canUseSavepoints}
                    savepointChapterId={savepointChapterId}
                    onSave={onSaveAtSavepoint}
                    onRestore={onRestoreSavepoint}
                  />
                ))}
              </Box>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

function SavepointMenuSection({
  bookId,
  chapterSaves,
  isCurrentBook,
  canUseSavepoints,
  savepointChapterId,
  onSave,
  onRestore,
}: {
  bookId: BookId
  chapterSaves: (CharacterSavepoint | null)[]
  isCurrentBook: boolean
  canUseSavepoints: boolean
  savepointChapterId?: ChapterId
  onSave: (slotIndex: number, chapterId?: ChapterId) => boolean
  onRestore: (bookId: BookId, slotIndex: number) => boolean
}) {
  const { t } = useTranslation()
  return (
    <Box display="flex" flexDirection="column" gap="2">
      <Heading as="h3" size="sm">
        {getLocalizedBookTitle(bookId)}
      </Heading>
      {Array.from({ length: 3 }, (_, slotIndex) => {
        const savepoint = chapterSaves[slotIndex]
        return savepoint ? (
          <Box
            key={slotIndex}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="3"
            borderWidth="1px"
            borderRadius="md"
            padding="3"
          >
            <Text>
              {t('characterSheet.saveSlotChapter', {
                slot: slotIndex + 1,
                chapter: savepoint.chapterId.replace(`${bookId}-`, ''),
              })}
            </Text>
            <Button
              variant="outline"
              disabled={!canUseSavepoints}
              onClick={() => onRestore(bookId, slotIndex)}
            >
              {t('characterSheet.restore')}
            </Button>
          </Box>
        ) : (
          isCurrentBook && (
            <Button
              key={slotIndex}
              variant="outline"
              disabled={!canUseSavepoints}
              onClick={() => onSave(slotIndex, savepointChapterId)}
            >
              {t('characterSheet.saveInSlot', { slot: slotIndex + 1 })}
            </Button>
          )
        )
      })}
    </Box>
  )
}
