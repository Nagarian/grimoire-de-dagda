import { Box, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { getBookColorPalette } from 'components/ui/theme'
import type { BookCharacterSheet, GameMode } from 'services/characterSheet'
import type { BookId } from 'services/books'
import { E01SheetForm } from './SheetForm/E01SheetForm'
import { T01SheetForm } from './SheetForm/T01SheetForm'
import { T02SheetForm } from './SheetForm/T02SheetForm'
import { T04SheetForm } from './SheetForm/T04SheetForm'
import { T05SheetForm } from './SheetForm/T05SheetForm'
import { T03SheetForm } from './SheetForm/T03SheetForm'

export function CharacterSheet({
  bookId,
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
  onRemoveCapsule,
}: {
  bookId?: BookId
  sheet?: BookCharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
  onRemoveCapsule: (capsuleIndex: number) => boolean
}) {
  return (
    <Box
      width="100%"
      height="100%"
      minHeight="0"
      overflowY="auto"
      padding={{ base: '4', md: '8' }}
      colorPalette={getBookColorPalette(bookId)}
    >
      <Box
        width="100%"
        maxWidth="breakpoint-md"
        marginX="auto"
        display="flex"
        flexDirection="column"
        gap="5"
      >
        {!sheet ? (
          <EmptySheetMessage />
        ) : (
          <BookSheetForm
            sheet={sheet}
            gameMode={gameMode}
            onUpdate={onUpdate}
            onSetGameMode={onSetGameMode}
            onRemoveCapsule={onRemoveCapsule}
          />
        )}
      </Box>
    </Box>
  )
}

function BookSheetForm({
  sheet,
  gameMode,
  onUpdate,
  onSetGameMode,
  onRemoveCapsule,
}: {
  sheet: BookCharacterSheet
  gameMode: GameMode | null
  onUpdate: (sheet: BookCharacterSheet) => boolean
  onSetGameMode: (gameMode: GameMode) => boolean
  onRemoveCapsule: (capsuleIndex: number) => boolean
}) {
  switch (sheet.bookId) {
    case 'T01':
      return (
        <T01SheetForm
          sheet={sheet}
          gameMode={gameMode}
          onUpdate={onUpdate}
          onSetGameMode={onSetGameMode}
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

function EmptySheetMessage() {
  const { t } = useTranslation()

  return <Text color="fg.muted">{t('sheet.empty')}</Text>
}
