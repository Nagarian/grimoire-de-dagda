import { Box, Button, IconButton, Text } from '@chakra-ui/react'
import { LuBookOpen, LuMenu, LuUndo2 } from 'react-icons/lu'
import type { BookId } from 'services/books'
import { DiceRoller } from './DiceRoller'

export function StoryProgressHeader({
  trackName,
  bookTitle,
  bookId,
  canUndo,
  onUndo,
  onOpenMenu,
  onOpenCharacterSheet,
}: {
  trackName?: string
  bookTitle?: string
  bookId?: BookId
  canUndo: boolean
  onUndo: () => void
  onOpenMenu: () => void
  onOpenCharacterSheet?: () => void
}) {
  return (
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
          {trackName ?? 'Votre aventure'}
        </Text>
        <Text fontWeight="semibold" truncate>
          {bookTitle ?? 'Choisissez votre départ'}
        </Text>
      </Box>
      <Box display="flex" alignItems="center" gap="1" flexShrink="0">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Annuler la dernière étape"
        >
          <LuUndo2 />
          <Text hideBelow="sm">Annuler</Text>
        </Button>
        {bookId && (
          <IconButton
            aria-label="Ouvrir la feuille de personnage"
            title="Feuille de personnage"
            variant="ghost"
            onClick={onOpenCharacterSheet}
          >
            <LuBookOpen />
          </IconButton>
        )}
        <DiceRoller bookId={bookId} />
        <IconButton
          aria-label="Ouvrir le menu du parcours"
          variant="ghost"
          onClick={onOpenMenu}
        >
          <LuMenu />
        </IconButton>
      </Box>
    </Box>
  )
}
