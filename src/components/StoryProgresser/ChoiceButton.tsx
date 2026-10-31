import { Box, Button, Text } from '@chakra-ui/react'
import type { StoryChoice } from 'services/storyNavigation'

export function ChoiceButton({
  choice,
  onChoose,
}: {
  choice: StoryChoice
  onChoose: (choice: StoryChoice) => void
}) {
  if (choice.kind === 'unavailable') {
    return (
      <Box>
        <Button width="100%" disabled title={choice.reason}>
          {choice.label}
        </Button>
        <Text fontSize="sm" color="fg.error" marginTop="1">
          {choice.reason}
        </Text>
      </Box>
    )
  }

  return (
    <Button
      size="lg"
      width="100%"
      minHeight="12"
      variant="outline"
      onClick={() => onChoose(choice)}
    >
      {choice.label}
    </Button>
  )
}
