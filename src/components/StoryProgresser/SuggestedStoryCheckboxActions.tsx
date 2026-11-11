import { Button, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const checked = new Set(checkedCheckboxIds)

  return (
    <Stack gap="2">
      {suggestions.map(({ checkbox }) => {
        const isChecked = checked.has(checkbox.id)
        const chapterNumber = getChapterNumberFromId(checkbox.chapterId)
        const target = t(
          checkbox.kind === 'chapter'
            ? 'checkbox.chapterTarget'
            : 'checkbox.lineTarget',
          { chapter: chapterNumber, label: checkbox.label },
        )

        return (
          <Button
            key={checkbox.id}
            width="100%"
            justifyContent="flex-start"
            variant="subtle"
            aria-pressed={isChecked}
            onClick={() => onToggle(checkbox.id)}
          >
            {t(isChecked ? 'checkbox.uncheck' : 'checkbox.check', { target })}
          </Button>
        )
      })}
    </Stack>
  )
}
