import { Box, Drawer, IconButton, Portal, Text } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { getBookColorPalette } from 'components/ui/theme'
import type { BookId } from 'services/books'
import type { BookCharacterSheet, GameMode } from 'services/characterSheet'
import type { ChapterId } from 'services/chapterDsl'
import { getBookData } from 'services/bookData'
import { E01SheetForm } from './character-sheet/E01SheetForm'
import { EmptySheetMessage } from './character-sheet/CharacterSheetFields'
import { T01SheetForm } from './character-sheet/T01SheetForm'
import { T02SheetForm } from './character-sheet/T02SheetForm'
import { T03SheetForm, T04SheetForm } from './character-sheet/T03T04SheetForms'
import { T05SheetForm } from './character-sheet/T05SheetForm'
import type { SavepointContext } from './character-sheet/types'

export type { SavepointContext } from './character-sheet/types'

export function CharacterSheetDrawer({
  open,
  onOpenChange,
  bookId,
  sheet,
  gameMode,
  savepointContext,
  onUpdate,
  onSetGameMode,
  onSaveAtSavepoint,
  onRestoreSavepoint,
  onRemoveCapsule,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId?: BookId
  sheet?: BookCharacterSheet
  gameMode: GameMode | null
  savepointContext?: SavepointContext
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
  onSaveAtSavepoint: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestoreSavepoint: (slotIndex: number) => boolean
  onRemoveCapsule: (capsuleIndex: number) => boolean
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={details => onOpenChange(details.open)}
      placement="end"
      size="lg"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content colorPalette={getBookColorPalette(bookId)}>
            <Drawer.Header>
              <Box minWidth="0">
                <Drawer.Title>Feuille de personnage</Drawer.Title>
                <Text fontSize="sm" color="fg.muted">
                  {sheet ? getBookData(sheet.bookId).title : ''}
                </Text>
              </Box>
              <Drawer.CloseTrigger asChild>
                <IconButton
                  aria-label="Fermer la feuille de personnage"
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body display="flex" flexDirection="column" gap="5">
              {!sheet ? (
                <EmptySheetMessage />
              ) : (
                <BookSheetForm
                  sheet={sheet}
                  gameMode={gameMode}
                  savepointContext={savepointContext}
                  onUpdate={onUpdate}
                  onSetGameMode={onSetGameMode}
                  onSaveAtSavepoint={onSaveAtSavepoint}
                  onRestoreSavepoint={onRestoreSavepoint}
                  onRemoveCapsule={onRemoveCapsule}
                />
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

function BookSheetForm({
  sheet,
  gameMode,
  savepointContext,
  onUpdate,
  onSetGameMode,
  onSaveAtSavepoint,
  onRestoreSavepoint,
  onRemoveCapsule,
}: {
  sheet: BookCharacterSheet
  gameMode: GameMode | null
  savepointContext?: SavepointContext
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
  onSaveAtSavepoint: (
    markerChapterId: ChapterId,
    resumeChapterId: ChapterId,
    slotIndex: number,
  ) => boolean
  onRestoreSavepoint: (slotIndex: number) => boolean
  onRemoveCapsule: (capsuleIndex: number) => boolean
}) {
  switch (sheet.bookId) {
    case 'T01':
      return (
        <T01SheetForm
          sheet={sheet}
          gameMode={gameMode}
          savepointContext={savepointContext}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
          onSaveAtSavepoint={onSaveAtSavepoint}
          onRestoreSavepoint={onRestoreSavepoint}
        />
      )
    case 'T02':
      return (
        <T02SheetForm
          sheet={sheet}
          gameMode={gameMode}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
        />
      )
    case 'T03':
      return (
        <T03SheetForm
          sheet={sheet}
          gameMode={gameMode}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
        />
      )
    case 'T04':
      return (
        <T04SheetForm
          sheet={sheet}
          gameMode={gameMode}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
        />
      )
    case 'T05':
      return (
        <T05SheetForm
          sheet={sheet}
          gameMode={gameMode}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
        />
      )
    case 'E01':
      return (
        <E01SheetForm
          sheet={sheet}
          onUpdate={onUpdate}
          onRemoveCapsule={onRemoveCapsule}
        />
      )
  }
}
