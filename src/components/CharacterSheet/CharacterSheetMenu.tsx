import {
  Box,
  Button,
  Drawer,
  Heading,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { getBookColorPalette } from 'components/ui/theme'
import type { ChapterId } from 'services/chapterDsl'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import type { T01Savepoint } from 'services/characterSheet'
import { getBookData } from 'services/bookData'
import type { StoryTrack } from 'services/storyProgress'
import type { SavepointContext } from './types'

export function CharacterSheetMenu({
  open,
  onOpenChange,
  activeTrack,
  currentBookId,
  error,
  savepointContext,
  onSaveAtSavepoint,
  onRestoreSavepoint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTrack: StoryTrack
  currentBookId?: BookId
  error?: string
  savepointContext?: SavepointContext
  onSaveAtSavepoint: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestoreSavepoint: (slotIndex: number) => boolean
}) {
  const registeredSheets = books.flatMap(book => {
    const sheet = activeTrack.characterSheet.sheets[book.id]
    return sheet ? [{ book, sheet }] : []
  })
  const t01Sheet = activeTrack.characterSheet.sheets.T01
  const savepoints =
    t01Sheet?.bookId === 'T01' ? t01Sheet.savepoints : undefined

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
              <Drawer.Title>Feuilles de personnage</Drawer.Title>
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
            <Drawer.Body display="flex" flexDirection="column" gap="6">
              {error && (
                <Box role="alert" padding="3" bg="bg.error">
                  <Text color="fg.error">{error}</Text>
                </Box>
              )}
              <Box as="section" display="flex" flexDirection="column" gap="3">
                <Heading as="h2" size="md">
                  Feuilles enregistrées
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
                        <Text>{getBookData(book.id).title}</Text>
                        {book.id === currentBookId && (
                          <Text fontSize="sm" color="fg.muted">
                            En cours
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Text color="fg.muted">Aucune feuille enregistrée.</Text>
                )}
              </Box>

              {savepoints && (
                <SavepointMenuSection
                  savepoints={savepoints}
                  context={
                    currentBookId === 'T01' ? savepointContext : undefined
                  }
                  canRestore={currentBookId === 'T01'}
                  onSave={onSaveAtSavepoint}
                  onRestore={onRestoreSavepoint}
                />
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

function SavepointMenuSection({
  savepoints,
  context,
  canRestore,
  onSave,
  onRestore,
}: {
  savepoints: (T01Savepoint | null)[]
  context?: SavepointContext
  canRestore: boolean
  onSave: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestore: (slotIndex: number) => boolean
}) {
  return (
    <Box as="section" display="flex" flexDirection="column" gap="3">
      <Heading as="h2" size="md">
        Sauvegardes du tome 1
      </Heading>
      {context ? (
        <Box display="flex" flexDirection="column" gap="2">
          <Text fontSize="sm" color="fg.muted">
            Cette sauvegarde reprendra au chapitre{' '}
            {context.resumeChapterId.replace('T01-', '')}.
          </Text>
          {Array.from({ length: 3 }, (_, slotIndex) => {
            const occupied = Boolean(savepoints[slotIndex])
            return (
              <Button
                key={slotIndex}
                variant="outline"
                onClick={() => {
                  if (
                    occupied &&
                    !window.confirm(
                      `Remplacer la sauvegarde ${slotIndex + 1} ?`,
                    )
                  ) {
                    return
                  }
                  onSave(
                    context.markerChapterId,
                    context.resumeChapterId,
                    slotIndex,
                  )
                }}
              >
                {occupied
                  ? `Remplacer la sauvegarde ${slotIndex + 1}`
                  : `Enregistrer dans l’emplacement ${slotIndex + 1}`}
              </Button>
            )
          })}
        </Box>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          {canRestore
            ? 'Aucune sauvegarde disponible depuis ce chapitre.'
            : 'Les sauvegardes peuvent être créées ou restaurées depuis le tome 1.'}
        </Text>
      )}
      {savepoints.map((savepoint, index) =>
        savepoint ? (
          <Box
            key={`${savepoint.markerChapterId}-${index}`}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="3"
            borderWidth="1px"
            borderRadius="md"
            padding="3"
          >
            <Text>
              Sauvegarde {index + 1} — chapitre{' '}
              {savepoint.markerChapterId.replace('T01-', '')}, reprise au{' '}
              {savepoint.resumeChapterId.replace('T01-', '')}
            </Text>
            <Button
              variant="outline"
              disabled={!canRestore}
              onClick={() => onRestore(index)}
            >
              Restaurer
            </Button>
          </Box>
        ) : null,
      )}
    </Box>
  )
}
