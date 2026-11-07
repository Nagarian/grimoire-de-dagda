import { Box, Heading } from '@chakra-ui/react'
import { useId, type ReactNode } from 'react'

export function Section({
  title,
  headerAction,
  children,
  columns = 1,
}: {
  title: string
  headerAction?: ReactNode
  children: ReactNode
  columns?: number
}) {
  const headingId = useId()

  return (
    <Box
      as="section"
      aria-labelledby={headingId}
      display="grid"
      gridTemplateColumns={`repeat(${columns}, minmax(0, 1fr))`}
      gap="3"
      placeContent="center"
      padding="4"
      borderWidth="1px"
      borderRadius="lg"
      bg="bg.panel"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        style={{ gridColumn: '1 / -1' }}
      >
        <Heading id={headingId} as="h3" size="md">
          {title}
        </Heading>
        {headerAction}
      </Box>
      {children}
    </Box>
  )
}
