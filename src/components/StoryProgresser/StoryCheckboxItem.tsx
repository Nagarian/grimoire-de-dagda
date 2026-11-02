import { Box, Checkbox, Text } from '@chakra-ui/react'
import type { StoryCheckbox } from 'services/storyCheckboxes'

export function StoryCheckboxItem({
  checkbox,
  checked,
  description,
  hideLabel = false,
  onToggle,
}: {
  checkbox: StoryCheckbox
  checked: boolean
  description?: string
  hideLabel?: boolean
  onToggle: (checkboxId: string) => void
}) {
  return (
    <Box>
      <Checkbox.Root
        checked={checked}
        onCheckedChange={() => onToggle(checkbox.id)}
        alignItems="flex-start"
      >
        <Checkbox.HiddenInput
          aria-label={hideLabel ? checkbox.label : undefined}
        />
        <Checkbox.Control marginTop="1" />
        {!hideLabel && <Checkbox.Label>{checkbox.label}</Checkbox.Label>}
      </Checkbox.Root>
      {description && (
        <Text color="fg.muted" fontSize="sm" marginStart="6">
          {description}
        </Text>
      )}
    </Box>
  )
}
