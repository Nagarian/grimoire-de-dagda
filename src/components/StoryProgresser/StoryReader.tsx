import { Box, Button, Heading, Text } from '@chakra-ui/react'
import type { Book } from 'services/books'
import type { BookData } from 'services/bookData'
import type { StoryChoice } from 'services/storyNavigation'
import type { StoryPosition } from 'services/storyProgress'
import { ChoiceButton } from './ChoiceButton'
import { ManualChapterDialog } from './ManualChapterDialog'

export function StoryReader({
  book,
  position,
  choices,
  isEnd,
  nextBook,
  returnLabel,
  onChoose,
  onContinue,
  onReturn,
  onJump,
}: {
  book: BookData
  position: StoryPosition
  choices: StoryChoice[]
  isEnd: boolean
  nextBook?: Book
  returnLabel?: string
  onChoose: (choice: StoryChoice) => void
  onContinue: (book: Book) => void
  onReturn: () => void
  onJump: (position: StoryPosition) => boolean
}) {
  const isExtension = position.bookId === 'E01'
  const canContinue = isEnd && !isExtension && nextBook
  const canReturn = isEnd && isExtension && returnLabel

  return (
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
          color="colorPalette.fg"
          fontSize="sm"
        >
          {position.bookId}
        </Text>
        <Heading size="2xl" marginTop="2">
          {position.chapterId === 'MAP'
            ? 'Carte du monde'
            : `Chapitre ${position.chapterId}`}
        </Heading>
        {position.chapterId === 'MAP' && (
          <Text marginTop="2">{book.title}</Text>
        )}
      </Box>

      {choices.length > 0 && (
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
          {choices.map(choice => (
            <ChoiceButton key={choice.id} choice={choice} onChoose={onChoose} />
          ))}
        </Box>
      )}

      {canContinue && (
        <Button size="lg" onClick={() => onContinue(nextBook)}>
          Continuer vers {nextBook.title}
        </Button>
      )}

      {canReturn && (
        <Button size="lg" onClick={onReturn}>
          Revenir à {returnLabel}
        </Button>
      )}

      {isEnd && isExtension && !returnLabel && (
        <Text textAlign="center" color="fg.muted">
          Fin de cette extension.
        </Text>
      )}

      <ManualChapterDialog currentPosition={position} onJump={onJump} />
    </Box>
  )
}
