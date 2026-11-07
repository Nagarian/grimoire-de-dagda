import { Box, Heading } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useId } from 'react'

export function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const headingId = useId()

  return (
    <Box
      as="section"
      aria-labelledby={headingId}
      display="flex"
      flexDirection="column"
      gap="4"
      padding="4"
      borderWidth="1px"
      borderRadius="lg"
      bg="bg.panel"
    >
      <Heading id={headingId} as="h2" size="md">
        {title}
      </Heading>
      {children}
    </Box>
  )
}
