import { Box, Button, IconButton, Loader } from '@chakra-ui/react'
import { select } from 'd3-selection'
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from 'd3-zoom'
import { zoom, zoomIdentity } from 'd3-zoom'
import mermaid from 'mermaid'
import { useEffect, useRef, useState } from 'react'
import { LuMap, LuZoomIn, LuZoomOut } from 'react-icons/lu'
import { MdZoomInMap } from 'react-icons/md'
import { Minimap, type MinimapViewport } from '../Minimap'

export type StoryDisplayerProps = {
  marmaidContent: string
}

export function StoryDisplayer({ marmaidContent }: StoryDisplayerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showMinimap, setShowMinimap] = useState<boolean>(true)
  const [minimapViewport, setMinimapViewport] = useState<MinimapViewport>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const mermaidRef = useRef<HTMLDivElement>(null)
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(
    null,
  )

  useEffect(() => {
    if (!mermaidRef.current || !containerRef.current) return

    mermaidRef.current.removeAttribute('data-processed')

    setIsLoading(true)

    mermaid
      .run({
        nodes: [mermaidRef.current],
      })
      .then(() => {
        if (!containerRef.current) return
        const svgElement = containerRef.current.querySelector('svg')
        if (!svgElement) return

        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight

        const updateMinimapViewport = (transform: ZoomTransform) => {
          if (!containerRef.current) return
          setMinimapViewport({
            x: -transform.x / transform.k,
            y: -transform.y / transform.k,
            width: containerWidth / transform.k,
            height: containerHeight / transform.k,
          })
        }
        const svgRect = svgElement.getBoundingClientRect()
        const svgWidth = svgRect.width
        const svgHeight = svgRect.height

        // Allow panning beyond SVG with reasonable margin (30% of viewport)
        const panMargin = {
          x: containerWidth * 0.3,
          y: containerHeight * 0.3,
        }

        const zoomBehavior = zoom<HTMLDivElement, unknown>()
          .extent([
            [0, 0],
            [containerWidth, containerHeight],
          ])
          .scaleExtent([0.5, 10])
          .translateExtent([
            [-panMargin.x, -panMargin.y],
            [svgWidth + panMargin.x, svgHeight + panMargin.y],
          ])
          .on('zoom', (event: D3ZoomEvent<HTMLDivElement, unknown>) => {
            svgElement.style.transform = `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`
            updateMinimapViewport(event.transform)
          })

        zoomBehaviorRef.current = zoomBehavior
        zoomBehavior(select(containerRef.current))
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false)
      })
  }, [marmaidContent])

  const handleReset = () => {
    if (containerRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.transform(
        select(containerRef.current),
        zoomIdentity,
      )
    }
  }

  const handleZoomIn = () => {
    if (containerRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.scaleBy(select(containerRef.current), 1.3)
    }
  }

  const handleZoomOut = () => {
    if (containerRef.current && zoomBehaviorRef.current) {
      zoomBehaviorRef.current.scaleBy(select(containerRef.current), 0.77)
    }
  }

  const handleMinimapNavigate = (x: number, y: number, scale: number) => {
    if (!containerRef.current || !zoomBehaviorRef.current) return

    zoomBehaviorRef.current.transform(select(containerRef.current), {
      x,
      y,
      k: scale,
    } as ZoomTransform)
  }

  return (
    <Box position="relative" width="100%" height="100%" overflow="hidden">
      {isLoading && (
        <Loader position="absolute" inset="0" padding="4" zIndex="10" />
      )}
      <Box
        ref={containerRef}
        position="absolute"
        inset="0"
        overflow="hidden"
        cursor="grab"
        isolation="isolate"
      >
        <div
          ref={mermaidRef}
          className="mermaid"
          style={{ transformOrigin: '0 0' }}
        >
          {marmaidContent}
        </div>
      </Box>

      <Box
        position="absolute"
        top="4"
        right="4"
        display="flex"
        flexDirection="column"
        gap="2"
        padding="2"
        borderRadius="md"
      >
        <IconButton size="sm" aria-label="Zoom-in" onClick={handleZoomIn}>
          <LuZoomIn />
        </IconButton>
        <Button size="sm" aria-label="Zoom-out" onClick={handleZoomOut}>
          <LuZoomOut />
        </Button>
        <Button size="sm" aria-label="Reset" onClick={handleReset}>
          <MdZoomInMap />
        </Button>
        <Button
          size="sm"
          aria-label={showMinimap ? 'Show minimap' : 'Hide minimap'}
          onClick={() => {
            setShowMinimap(!showMinimap)
          }}
        >
          <LuMap />
        </Button>
      </Box>

      {showMinimap && (
        <Box position="absolute" bottom="4" right="4">
          <Minimap
            viewport={minimapViewport}
            svgElement={containerRef.current?.querySelector('svg') || null}
            containerElement={containerRef.current}
            onNavigate={handleMinimapNavigate}
          />
        </Box>
      )}
    </Box>
  )
}
