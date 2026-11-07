import { Button, Stack } from '@chakra-ui/react'
import type { StoryMapPathSuggestion } from 'services/storyMap'

export function StoryMapPathActions({
  suggestions,
  revealedMapPathIds,
  onReveal,
}: {
  suggestions: StoryMapPathSuggestion[]
  revealedMapPathIds: string[]
  onReveal: (mapPathId: string) => void
}) {
  const revealed = new Set(revealedMapPathIds)

  return (
    <Stack gap="2">
      {suggestions.map(suggestion => {
        const isRevealed = revealed.has(suggestion.id)

        return (
          <Button
            key={suggestion.id}
            width="100%"
            justifyContent="flex-start"
            variant="subtle"
            aria-pressed={isRevealed}
            disabled={isRevealed}
            onClick={() => onReveal(suggestion.id)}
          >
            {isRevealed
              ? `Chemin révélé sur la carte : ${suggestion.label}`
              : `Révéler sur la carte : ${suggestion.label}`}
          </Button>
        )
      })}
    </Stack>
  )
}
