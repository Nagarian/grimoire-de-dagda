import { Box, Field } from '@chakra-ui/react'
import { ColorModeButton } from 'components/ui/color-mode'

export function Settings() {
  return (
    <Box display="flex" flexDirection="column" gap="2" padding="2">
      <Field.Root placeItems="stretch">
        <Field.Label>Choose your theme color</Field.Label>
        <ColorModeButton />
      </Field.Root>
    </Box>
  )
}
