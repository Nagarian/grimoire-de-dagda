import { Box } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import type { BookLayout } from 'services/graphLayout'
import type { PanZoom } from './usePanZoom'

export type MinimapProps = {
  layout: BookLayout
  panZoom: PanZoom
}

const maxMinimapWidth = 160
const maxMinimapHeight = 240

export function Minimap({ layout, panZoom }: MinimapProps) {
  // Books are far taller than they are wide, so the minimap fits inside a box
  // instead of following a fixed width.
  const scale = Math.min(
    maxMinimapWidth / (layout.width || 1),
    maxMinimapHeight / (layout.height || 1),
  )
  const svgRef = useRef<SVGSVGElement>(null)
  const viewportRef = useRef<SVGRectElement>(null)

  // The viewport outline follows every pan and zoom, so it is moved attribute
  // by attribute rather than through React state.
  useEffect(
    () =>
      panZoom.subscribe(viewport => {
        const rect = viewportRef.current
        if (!rect) {
          return
        }
        rect.setAttribute('x', `${viewport.x}`)
        rect.setAttribute('y', `${viewport.y}`)
        rect.setAttribute('width', `${viewport.width}`)
        rect.setAttribute('height', `${viewport.height}`)
      }),
    [panZoom],
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const goTo = (event: PointerEvent) => {
      const box = svg.getBoundingClientRect()
      panZoom.centerOn(
        ((event.clientX - box.left) / box.width) * layout.width,
        ((event.clientY - box.top) / box.height) * layout.height,
      )
    }

    const onPointerDown = (event: PointerEvent) => {
      svg.setPointerCapture(event.pointerId)
      goTo(event)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (svg.hasPointerCapture(event.pointerId)) {
        goTo(event)
      }
    }

    svg.addEventListener('pointerdown', onPointerDown)
    svg.addEventListener('pointermove', onPointerMove)

    return () => {
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
    }
  }, [panZoom, layout.width, layout.height])

  return (
    <Box
      position="absolute"
      bottom="4"
      right="4"
      zIndex="docked"
      borderRadius="sm"
      borderWidth="medium"
      borderColor="border.emphasized"
      shadow="md"
      bg="bg.panel"
      overflow="hidden"
    >
      <svg
        ref={svgRef}
        className="story-minimap"
        width={layout.width * scale}
        height={layout.height * scale}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
      >
        {layout.nodes.map(node => (
          <rect
            key={node.id}
            className="story-minimap-node"
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
          />
        ))}
        <rect ref={viewportRef} className="story-minimap-viewport" />
      </svg>
    </Box>
  )
}
