import { Button, Stack } from '@chakra-ui/react'
import { getChapterNumberFromId } from 'services/chapterDsl'
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
        const chapterNumber = getChapterNumberFromId(checkbox.chapterId)
        const target =
          checkbox.kind === 'chapter'
            ? `le chapitre ${chapterNumber}`
            : `la case « ${checkbox.label} » du chapitre ${chapterNumber}`

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
