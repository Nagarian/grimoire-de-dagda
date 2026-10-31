import { Box, Button, IconButton, Text } from '@chakra-ui/react'
import { LuMenu, LuUndo2 } from 'react-icons/lu'

export function StoryProgressHeader({
  trackName,
  bookTitle,
  canUndo,
  onUndo,
  onOpenMenu,
}: {
  trackName?: string
  bookTitle?: string
  canUndo: boolean
  onUndo: () => void
  onOpenMenu: () => void
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
