import { Box, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export function PageHeader({
  subtitle,
  title,
  actions,
}: {
  subtitle: string
  title: string
  actions?: ReactNode
}) {
  return (
    <Box
      as="header"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="3"
      paddingX={{ base: '3', md: '6' }}
      paddingY="2"
      borderBottomWidth="1px"
    >
      <Box minWidth="0">
        <Text fontSize="sm" color="fg.muted" truncate>
          {subtitle}
        </Text>
        <Text fontWeight="semibold" truncate>
          {title}
        </Text>
      </Box>
      {actions && (
        <Box display="flex" alignItems="center" gap="1" flexShrink="0">
          {actions}
        </Box>
      )}
    </Box>
  )
}
