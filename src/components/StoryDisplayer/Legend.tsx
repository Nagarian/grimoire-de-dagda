import { Box, Heading, Text } from '@chakra-ui/react'
import type { ChapterType } from 'services/chapterType'
import { chapterShapeSize } from 'services/chapterType'
import { ChapterShape } from './ChapterShape'

export type LegendProps = {
  /** Only the types this book uses, in registry order. */
  types: ChapterType[]
}

const swatchWidth = 44
const swatchHeight = 32

export function Legend({ types }: LegendProps) {
  return (
    <Box
      position="absolute"
      top="4"
      left="4"
      zIndex="popover"
      maxHeight="80%"
      overflowY="auto"
      padding="3"
      borderRadius="md"
      borderWidth="thin"
      borderColor="border.emphasized"
      shadow="md"
      bg="bg.panel"
    >
      <Heading as="h2" size="sm" marginBottom="2">
        Légende
      </Heading>
      <Box
        display="grid"
        gridTemplateColumns="auto 1fr"
        gap="2"
        alignItems="center"
      >
        {types
          .filter(type => type.shape && type.className)
          .map(type => (
            <Swatch key={type.id} type={type} />
          ))}
      </Box>
    </Box>
  )
}

function Swatch({ type }: { type: ChapterType }) {
  if (!type.shape) {
    return null
  }

  const size = chapterShapeSize[type.shape]

  return (
    <>
      <svg
        width={swatchWidth}
        height={swatchHeight}
        // Padded so the outline is not clipped by the edges of the swatch.
        viewBox={`-4 -4 ${size.width + 8} ${size.height + 8}`}
        className={`legend-swatch ${type.className ?? ''}`}
        aria-hidden="true"
      >
        <ChapterShape
          shape={type.shape}
          width={size.width}
          height={size.height}
        />
      </svg>
      <Text fontSize="sm">{type.label}</Text>
    </>
  )
}
