import { Box, Button, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { StoryChoice } from 'services/storyNavigation'

const unavailableReasonKeys = {
  missingChapter: 'storyUnavailable.missingChapter',
  unregisteredBook: 'storyUnavailable.unregisteredBook',
  invalidLocalisation: 'storyUnavailable.invalidLocalisation',
  invalidCapsule: 'storyUnavailable.invalidCapsule',
  capsulesFull: 'storyUnavailable.capsulesFull',
} as const

export function ChoiceButton({
  choice,
  onChoose,
}: {
  choice: StoryChoice
  onChoose: (choice: StoryChoice) => void
}) {
  const { t } = useTranslation()

  if (choice.kind === 'unavailable') {
    const reason = t(unavailableReasonKeys[choice.reason])

    return (
      <Box>
        <Button width="100%" disabled title={reason}>
          {choice.label}
        </Button>
        <Text fontSize="sm" color="fg.error" marginTop="1">
          {reason}
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
