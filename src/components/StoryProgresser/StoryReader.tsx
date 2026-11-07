import { Box, Button, Checkbox, Heading, Text } from '@chakra-ui/react'
import type { Book } from 'services/books'
import type { BookData } from 'services/bookData'
import type { StoryChoice } from 'services/storyNavigation'
import type { StoryPosition } from 'services/storyProgress'
import {
  getChapterStoryCheckboxes,
  getStoryCheckboxSuggestions,
} from 'services/storyCheckboxes'
import { getMapPathSuggestions } from 'services/storyMap'
import { ChoiceButton } from './ChoiceButton'
import { ManualChapterDialog } from './ManualChapterDialog'
import { StoryCheckboxItem } from './StoryCheckboxItem'
import { SuggestedStoryCheckboxActions } from './SuggestedStoryCheckboxActions'
import { StoryMapPathActions } from './StoryMapPathActions'

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
  checkedCheckboxIds,
  revealedMapPathIds,
  onToggleCheckbox,
  onRevealMapPath,
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
  checkedCheckboxIds: string[]
  revealedMapPathIds: string[]
  onToggleCheckbox: (checkboxId: string) => void
  onRevealMapPath: (mapPathId: string) => void
}) {
  const chapter = book.chaptersById.get(position.chapterId)
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }
  const isExtension = book.id === 'E01'
  const canContinue = isEnd && !isExtension && nextBook
  const canReturn = isEnd && isExtension && returnLabel
  const checkboxes = getChapterStoryCheckboxes(position)
  const chapterCheckboxes = checkboxes.filter(
    (checkbox): checkbox is Extract<typeof checkbox, { kind: 'chapter' }> =>
      checkbox.kind === 'chapter',
  )
  const lineCheckboxes = checkboxes.filter(
    (checkbox): checkbox is Extract<typeof checkbox, { kind: 'line' }> =>
      checkbox.kind === 'line',
  )
  const suggestions = getStoryCheckboxSuggestions(position)
  const mapPathSuggestions = getMapPathSuggestions(position)
  const chapterTitle =
    chapter.number === 'MAP' ? 'Carte du monde' : `Chapitre ${chapter.number}`
  const hasActions =
    choices.length > 0 ||
    suggestions.length > 0 ||
    mapPathSuggestions.length > 0

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
          {book.id}
        </Text>
        {chapterCheckboxes[0] ? (
          <Checkbox.Root
            checked={checkedCheckboxIds.includes(chapterCheckboxes[0].id)}
            onCheckedChange={() => onToggleCheckbox(chapterCheckboxes[0].id)}
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap="3"
            marginTop="2"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              <Heading as="h1" size="2xl">
                {chapterTitle}
              </Heading>
            </Checkbox.Label>
          </Checkbox.Root>
        ) : (
          <Heading size="2xl" marginTop="2">
            {chapterTitle}
          </Heading>
        )}
        {chapter.number === 'MAP' && <Text marginTop="2">{book.title}</Text>}
      </Box>

      {hasActions && (
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
          {suggestions.length > 0 && (
            <SuggestedStoryCheckboxActions
              suggestions={suggestions}
              checkedCheckboxIds={checkedCheckboxIds}
              onToggle={onToggleCheckbox}
            />
          )}
          {mapPathSuggestions.length > 0 && (
            <StoryMapPathActions
              suggestions={mapPathSuggestions}
              revealedMapPathIds={revealedMapPathIds}
              onReveal={onRevealMapPath}
            />
          )}
          {choices.map(choice => {
            const targetChapterId =
              choice.kind === 'destination'
                ? choice.position.chapterId
                : choice.kind === 'unavailable'
                  ? choice.targetChapterId
                  : undefined
            const choiceCheckboxes = lineCheckboxes.filter(
              checkbox => checkbox.destinationChapterId === targetChapterId,
            )

            return (
              <Box
                key={choice.id}
                role="group"
                aria-label={`Choix ${choice.label}`}
                display="flex"
                alignItems="center"
                gap="3"
              >
                {choiceCheckboxes.map(checkbox => (
                  <StoryCheckboxItem
                    key={checkbox.id}
                    checkbox={checkbox}
                    checked={checkedCheckboxIds.includes(checkbox.id)}
                    hideLabel
                    onToggle={onToggleCheckbox}
                  />
                ))}
                <Box flex="1" minWidth="0">
                  <ChoiceButton choice={choice} onChoose={onChoose} />
                </Box>
              </Box>
            )
          })}
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
