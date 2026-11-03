import { keyframes } from '@emotion/react'
import {
  Box,
  Button,
  Dialog,
  Grid,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuDices, LuX } from 'react-icons/lu'
import type { BookId } from 'services/books'
import { getBookColorPalette } from 'components/ui/theme'

const dieRoll = keyframes`
  from {
    transform: translateY(-0.75rem) rotateX(0deg) rotateY(90deg) rotateZ(0deg) scale(0.75);
  }
  50% {
    transform: translateY(0) rotateX(720deg) rotateY(1080deg) rotateZ(360deg) scale(1.05);
  }
  72% {
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(0) rotateX(1440deg) rotateY(2160deg) rotateZ(720deg) scale(1);
  }
  82% {
    animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
    transform: translateY(0) rotateX(1800deg) rotateY(2520deg) rotateZ(900deg) scale(1);
  }
  88% {
    animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
    transform: translateY(-0.5rem) rotateX(1809deg) rotateY(2511deg) rotateZ(904deg) scale(1.03);
  }
  95% {
    animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
    transform: translateY(0.125rem) rotateX(1798deg) rotateY(2522deg) rotateZ(898deg) scale(0.99);
  }
  to {
    transform: translateY(0) rotateX(1800deg) rotateY(2520deg) rotateZ(900deg) scale(1);
  }
`

const dieSize = 96
const minRollDuration = 900
const rollDurationStep = 100

export function DiceRoller({ bookId }: { bookId?: BookId }) {
  const [open, setOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [rollId, setRollId] = useState(0)
  const [result, setResult] = useState<number[]>()

  function roll(count: 1 | 2) {
    if (rolling) {
      return
    }

    const nextResult = Array.from({ length: count }, rollDie)
    setResult(nextResult)
    setRollId(current => current + 1)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRolling(true)
      const duration = Math.max(...nextResult.map(getRollDuration))
      window.setTimeout(() => setRolling(false), duration)
    }
  }

  const total = result?.reduce((sum, value) => sum + value, 0)

  return (
    <>
      <IconButton
        aria-label="Lancer les dés"
        title="Lancer les dés"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        <LuDices />
      </IconButton>
      <Dialog.Root
        open={open}
        placement="center"
        onOpenChange={details => setOpen(details.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content colorPalette={getBookColorPalette(bookId)}>
              <Dialog.Header>
                <Dialog.Title>Lancer les dés</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton aria-label="Fermer" variant="ghost" size="sm">
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <Text marginBottom="4">
                  Choisissez le nombre de dés à lancer.
                </Text>
                <Box display="flex" gap="3">
                  <Button flex="1" onClick={() => roll(1)} disabled={rolling}>
                    Lancer 1 dé
                  </Button>
                  <Button flex="1" onClick={() => roll(2)} disabled={rolling}>
                    Lancer 2 dés
                  </Button>
                </Box>

                {result && (
                  <Box marginTop="6">
                    <Grid
                      templateColumns={`repeat(${result.length}, minmax(0, 1fr))`}
                      justifyItems="center"
                      gap="4"
                    >
                      {result.map((value, index) => (
                        <DieFace
                          key={`${rollId}-${index}`}
                          value={value}
                          animate={rolling}
                          duration={getRollDuration(value)}
                        />
                      ))}
                    </Grid>
                  </Box>
                )}
                <Text
                  role="status"
                  aria-live="polite"
                  textAlign="center"
                  fontSize="xl"
                  fontWeight="bold"
                  marginTop="4"
                  minHeight="7"
                >
                  {rolling
                    ? 'Les dés roulent…'
                    : result
                      ? result.length === 2
                        ? `Total : ${total}`
                        : `Résultat : ${result[0]}`
                      : 'Aucun lancer pour le moment.'}
                </Text>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

function DieFace({
  value,
  animate,
  duration,
}: {
  value: number
  animate: boolean
  duration: number
}) {
  const faces = getCubeFaces(value)
  const translate = dieSize / 2
  const rotations = {
    front: 'rotateY(0deg)',
    back: 'rotateY(180deg)',
    right: 'rotateY(90deg)',
    left: 'rotateY(-90deg)',
    top: 'rotateX(90deg)',
    bottom: 'rotateX(-90deg)',
  } satisfies Record<DieSide, string>

  return (
    <Box
      aria-label={animate ? 'Dé en mouvement' : `Dé : ${value}`}
      role="img"
      width={`${dieSize}px`}
      height={`${dieSize}px`}
      perspective="500px"
      display="grid"
      placeItems="center"
    >
      <Box
        position="relative"
        width="100%"
        height="100%"
        transformStyle="preserve-3d"
        transform="rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)"
        animation={animate ? `${dieRoll} ${duration}ms linear both` : undefined}
      >
        {(Object.entries(faces) as [DieSide, number][]).map(
          ([side, faceValue]) => (
            <Box
              key={side}
              position="absolute"
              inset="0"
              display="grid"
              placeItems="center"
              borderWidth="2px"
              borderColor="colorPalette.contrast"
              borderRadius="lg"
              bg="colorPalette.solid"
              color="colorPalette.contrast"
              style={{
                transform: `${rotations[side]} translateZ(${translate}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                aria-hidden="true"
              >
                {diePips[faceValue].map(position => (
                  <circle
                    key={position}
                    cx={pipPositions[position].x}
                    cy={pipPositions[position].y}
                    r="7"
                    fill="currentColor"
                  />
                ))}
              </svg>
            </Box>
          ),
        )}
      </Box>
    </Box>
  )
}

const pipPositions = [
  { x: 23, y: 23 },
  { x: 50, y: 23 },
  { x: 77, y: 23 },
  { x: 23, y: 50 },
  { x: 50, y: 50 },
  { x: 77, y: 50 },
  { x: 23, y: 77 },
  { x: 50, y: 77 },
  { x: 77, y: 77 },
]

const diePips: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function getRollDuration(value: number): number {
  return minRollDuration + (value - 1) * rollDurationStep
}

type DieSide = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'

function getCubeFaces(value: number) {
  const opposite = 7 - value
  const remainingPairs = [
    [1, 6],
    [2, 5],
    [3, 4],
  ].filter(([first, second]) => first !== value && second !== value)
  const [rightPair, topPair] = remainingPairs

  return {
    front: value,
    back: opposite,
    right: rightPair[0],
    left: rightPair[1],
    top: topPair[0],
    bottom: topPair[1],
  }
}

function rollDie(): number {
  const range = 0x1_0000_0000
  const limit = range - (range % 6)
  const randomValue = new Uint32Array(1)

  do {
    window.crypto.getRandomValues(randomValue)
  } while (randomValue[0] >= limit)

  return (randomValue[0] % 6) + 1
}
