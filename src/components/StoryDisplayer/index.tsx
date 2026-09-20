import { Box, Loader, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BookId } from 'services/books'
import type { BookLayout } from 'services/graphLayout'
import { getBookLayout } from 'services/graphLayout'
import { arrowMarkerId, ChapterEdge } from './ChapterEdge'
import { chapterElementId, ChapterNode } from './ChapterNode'
import { Controls } from './Controls'
import { Legend } from './Legend'
import { Minimap } from './Minimap'
import { usePanZoom } from './usePanZoom'
import './storyDisplayer.css'

export type StoryDisplayerProps = {
  bookId: BookId
}

export function StoryDisplayer({ bookId }: StoryDisplayerProps) {
  const [layout, setLayout] = useState<BookLayout>()
  const [hasFailed, setHasFailed] = useState<boolean>(false)
  const [showMinimap, setShowMinimap] = useState<boolean>(true)
  const [showLegend, setShowLegend] = useState<boolean>(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const highlighted = useRef<string>(undefined)

  useEffect(() => {
    let cancelled = false
    setLayout(undefined)
    setHasFailed(false)

    getBookLayout(bookId).then(
      next => {
        if (!cancelled) setLayout(next)
      },
      (error: unknown) => {
        console.error(error)
        if (!cancelled) setHasFailed(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [bookId])

  const panZoom = usePanZoom({
    svgRef,
    width: layout?.width ?? 0,
    height: layout?.height ?? 0,
  })

  // The highlight is toggled on the DOM node directly: re-rendering several
  // hundred chapters to outline one of them would be wasteful.
  const highlight = useCallback((chapter: string | undefined) => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const previous = highlighted.current
    if (previous !== undefined) {
      svg
        .querySelector(`#${chapterElementId(previous)}`)
        ?.classList.remove('chapter-highlighted')
    }

    highlighted.current = chapter
    if (chapter !== undefined) {
      svg
        .querySelector(`#${chapterElementId(chapter)}`)
        ?.classList.add('chapter-highlighted')
    }
  }, [])

  const focusChapter = useCallback(
    (chapter: string) => {
      const node = layout?.nodes.find(candidate => candidate.id === chapter)
      highlight(node?.id)

      if (!node) {
        return false
      }

      panZoom.focusOn(node)
      return true
    },
    [layout, panZoom, highlight],
  )

  // Kept out of the render pass: the scene only changes when the book does.
  const scene = useMemo(
    () =>
      layout && (
        <>
          <g className="story-edges">
            {layout.edges
              .filter(edge => !edge.hidden)
              .map(edge => (
                <ChapterEdge key={edge.id} edge={edge} />
              ))}
          </g>
          <g className="story-nodes">
            {layout.nodes.map(node => (
              <ChapterNode key={node.id} node={node} />
            ))}
          </g>
        </>
      ),
    [layout],
  )

  return (
    <Box position="relative" width="100%" height="100%" overflow="hidden">
      {!layout && !hasFailed && (
        <Loader position="absolute" inset="0" padding="4" zIndex="10" />
      )}
      {hasFailed && (
        <Text position="absolute" inset="0" padding="4" zIndex="10">
          L’arbre de ce livre n’a pas pu être construit.
        </Text>
      )}
      <svg
        ref={svgRef}
        className="story-graph"
        role="img"
        aria-label="Arbre des chapitres"
      >
        <defs>
          <marker
            id={arrowMarkerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path className="chapter-arrow" d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {scene}
      </svg>
      {layout && showLegend && <Legend types={layout.usedTypes} />}
      {layout && showMinimap && <Minimap layout={layout} panZoom={panZoom} />}
      <Controls
        position="absolute"
        top="4"
        right="4"
        zIndex="20"
        disabled={!layout}
        showMinimap={showMinimap}
        onMinimapToggle={() => {
          setShowMinimap(!showMinimap)
        }}
        showLegend={showLegend}
        onLegendToggle={() => {
          setShowLegend(!showLegend)
        }}
        onZoomIn={() => {
          panZoom.zoomBy(1.4)
        }}
        onZoomOut={() => {
          panZoom.zoomBy(1 / 1.4)
        }}
        onReset={() => {
          highlight(undefined)
          panZoom.fit()
        }}
        onSearch={focusChapter}
      />
    </Box>
  )
}
