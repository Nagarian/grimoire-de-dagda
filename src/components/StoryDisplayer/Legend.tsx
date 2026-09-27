import { Box, Heading, Text } from '@chakra-ui/react'
import classNames from 'classnames'
import type { ReactNode } from 'react'
import type { ChapterType } from 'services/chapterType'
import { chapterShapeSize } from 'services/chapterType'
import { ChapterBadgeGlyph } from './ChapterBadgeGlyph'
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
      zIndex="docked"
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
      <Heading as="h3" size="xs" marginBottom="1">
        Formes
      </Heading>
      <LegendGrid>
        {types
          .filter(type => type.shape)
          .map(type => (
            <ShapeSwatch key={type.id} type={type} />
          ))}
      </LegendGrid>
      <Heading as="h3" size="xs" marginTop="3" marginBottom="1">
        Badges
      </Heading>
      <LegendGrid>
        {types
          .filter(type => type.badge)
          .map(type => (
            <BadgeSwatch key={type.id} type={type} />
          ))}
      </LegendGrid>
    </Box>
  )
}

function LegendGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="auto 1fr"
      gap="2"
      alignItems="center"
    >
      {children}
    </Box>
  )
}

function ShapeSwatch({ type }: { type: ChapterType }) {
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
        className={classNames('legend-swatch', type.className)}
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

function BadgeSwatch({ type }: { type: ChapterType }) {
  if (!type.badge) {
    return null
  }

  return (
    <>
      <svg
        width={swatchWidth}
        height={swatchHeight}
        viewBox="0 0 44 32"
        className={classNames('legend-swatch', type.className)}
        aria-hidden="true"
      >
        <ChapterBadgeGlyph badge={type.badge} x={10} />
      </svg>
      <Text fontSize="sm">{type.label}</Text>
    </>
  )
}
