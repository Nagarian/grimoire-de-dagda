import { Button, Stack } from '@chakra-ui/react'
import type { StoryCheckboxSuggestion } from 'services/storyCheckboxes'

export function SuggestedStoryCheckboxActions({
  suggestions,
  checkedCheckboxIds,
  onToggle,
}: {
  suggestions: StoryCheckboxSuggestion[]
  checkedCheckboxIds: string[]
  onToggle: (checkboxId: string) => void
}) {
  const checked = new Set(checkedCheckboxIds)

  return (
    <Stack gap="2">
      {suggestions.map(({ checkbox }) => {
        const isChecked = checked.has(checkbox.id)
        const target =
          checkbox.kind === 'chapter'
            ? `le chapitre ${checkbox.chapterId}`
            : `la case « ${checkbox.label} » du chapitre ${checkbox.chapterId}`

        return (
          <Button
            key={checkbox.id}
            width="100%"
            justifyContent="flex-start"
            variant="subtle"
            aria-pressed={isChecked}
            onClick={() => onToggle(checkbox.id)}
          >
            {isChecked ? 'Décocher' : 'Cocher'} {target}
          </Button>
        )
      })}
    </Stack>
  )
}
