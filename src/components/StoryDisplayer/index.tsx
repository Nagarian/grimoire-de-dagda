import { Box, Loader, Text } from '@chakra-ui/react'
import classNames from 'classnames'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BookId } from 'services/books'
import type { BookLayout } from 'services/graphLayout'
import { getBookLayout } from 'services/graphLayout'
import { arrowMarkerId, ChapterEdge } from './ChapterEdge'
import { ChapterNode } from './ChapterNode'
import { Controls } from './Controls'
import { Legend } from './Legend'
import { Minimap } from './Minimap'
import { usePanZoom } from './usePanZoom'
import './storyDisplayer.css'

export type StoryDisplayerProps = {
  bookId: BookId
}

type LayoutState =
  | { bookId: BookId; status: 'loaded'; layout: BookLayout }
  | { bookId: BookId; status: 'failed' }

export function StoryDisplayer({ bookId }: StoryDisplayerProps) {
  const [layoutState, setLayoutState] = useState<LayoutState>()
  const currentLayoutState =
    layoutState?.bookId === bookId ? layoutState : undefined
  const layout =
    currentLayoutState?.status === 'loaded'
      ? currentLayoutState.layout
      : undefined
  const hasFailed = currentLayoutState?.status === 'failed'
  const [showMinimap, setShowMinimap] = useState<boolean>(true)
  const [showLegend, setShowLegend] = useState<boolean>(false)
  const [selectMode, setSelectMode] = useState<boolean>(false)
  const [selectedChapter, setSelectedChapter] = useState<string>()
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let cancelled = false

    getBookLayout(bookId).then(
      next => {
        if (!cancelled) {
          setLayoutState({ bookId, status: 'loaded', layout: next })
        }
      },
      (error: unknown) => {
        console.error(error)
        if (!cancelled) setLayoutState({ bookId, status: 'failed' })
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
    canPan: !selectMode,
  })

  const adjacency = useMemo(() => {
    const next = new Map<
      string,
      { incoming: BookLayout['edges']; outgoing: BookLayout['edges'] }
    >()

    layout?.edges.forEach(edge => {
      const source = next.get(edge.source) ?? { incoming: [], outgoing: [] }
      const target = next.get(edge.target) ?? { incoming: [], outgoing: [] }
      source.outgoing.push(edge)
      target.incoming.push(edge)
      next.set(edge.source, source)
      next.set(edge.target, target)
    })

    return next
  }, [layout])

  const hiddenTargetIds = useMemo(
    () =>
      new Set(
        layout?.edges.filter(edge => edge.hidden).map(edge => edge.target),
      ),
    [layout],
  )

  const selectionRegion = useCallback(
    (chapter: string) => {
      const node = layout?.nodes.find(candidate => candidate.id === chapter)
      if (!node) {
        return undefined
      }

      const edges = adjacency.get(chapter)
      const points = edges
        ? [...edges.incoming, ...edges.outgoing].flatMap(edge => edge.points)
        : []
      const minX = Math.min(node.x, ...points.map(point => point.x))
      const minY = Math.min(node.y, ...points.map(point => point.y))
      const maxX = Math.max(
        node.x + node.width,
        ...points.map(point => point.x),
      )
      const maxY = Math.max(
        node.y + node.height,
        ...points.map(point => point.y),
      )
      const maxWidth = node.width * 12

      return {
        x:
          maxX - minX > maxWidth
            ? node.x + node.width / 2 - maxWidth / 2
            : minX,
        y: minY,
        width: Math.min(maxX - minX, maxWidth),
        height: maxY - minY,
      }
    },
    [adjacency, layout],
  )

  const focusChapter = useCallback(
    (chapter: string) => {
      const node = layout?.nodes.find(candidate => candidate.id === chapter)
      if (!node) {
        setSelectedChapter(undefined)
        return false
      }

      setSelectedChapter(node.id)
      panZoom.focusOn(selectionRegion(node.id) ?? node)
      return true
    },
    [layout, panZoom, selectionRegion],
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const onClick = (event: MouseEvent) => {
      if (!selectMode) {
        return
      }
      const target = event.target
      const chapter =
        target instanceof Element
          ? target.closest<SVGGElement>('g.chapter')
          : null
      const id = chapter?.id.startsWith('chapter-')
        ? chapter.id.slice('chapter-'.length)
        : undefined
      if (id && layout?.nodes.some(node => node.id === id)) {
        focusChapter(id)
      } else {
        setSelectedChapter(undefined)
      }
    }

    svg.addEventListener('click', onClick)
    return () => {
      svg.removeEventListener('click', onClick)
    }
  }, [focusChapter, layout, selectMode])

  // Kept out of the render pass: the scene only changes when the book does.
  const scene = useMemo(
    () =>
      layout && (
        <>
          <g className="story-edges">
            {layout.edges.map(edge => (
              <ChapterEdge key={edge.id} edge={edge} />
            ))}
          </g>
          <g className="story-nodes">
            {layout.nodes.map(node => (
              <ChapterNode
                key={node.id}
                node={node}
                hideLabel={hiddenTargetIds.has(node.id)}
              />
            ))}
          </g>
        </>
      ),
    [hiddenTargetIds, layout],
  )

  const selectedEdges = selectedChapter
    ? (adjacency.get(selectedChapter) ?? { incoming: [], outgoing: [] })
    : undefined

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
        className={classNames('story-graph', { 'select-mode': selectMode })}
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
        {selectedChapter && selectedEdges && (
          <g className="story-selection">
            <g className="story-selection-incoming">
              {selectedEdges.incoming.map(edge => (
                <ChapterEdge
                  key={edge.id}
                  edge={edge}
                  className="chapter-edge-incoming"
                />
              ))}
            </g>
            <g className="story-selection-outgoing">
              {selectedEdges.outgoing.map(edge => (
                <ChapterEdge
                  key={edge.id}
                  edge={edge}
                  className="chapter-edge-outgoing"
                />
              ))}
            </g>
            {layout?.nodes
              .filter(node => node.id === selectedChapter)
              .map(node => (
                <ChapterNode key={`selection-${node.id}`} node={node} />
              ))}
          </g>
        )}
      </svg>
      {layout && showLegend && <Legend types={layout.usedTypes} />}
      {layout && showMinimap && <Minimap layout={layout} panZoom={panZoom} />}
      <Controls
        position="absolute"
        top="4"
        right="4"
        zIndex="docked"
        disabled={!layout}
        showMinimap={showMinimap}
        onMinimapToggle={() => {
          setShowMinimap(!showMinimap)
        }}
        showLegend={showLegend}
        onLegendToggle={() => {
          setShowLegend(!showLegend)
        }}
        selectMode={selectMode}
        onSelectModeToggle={() => {
          setSelectMode(!selectMode)
        }}
        onZoomIn={() => {
          panZoom.zoomBy(1.4)
        }}
        onZoomOut={() => {
          panZoom.zoomBy(1 / 1.4)
        }}
        onReset={() => {
          setSelectedChapter(undefined)
          panZoom.fit()
        }}
        onSearch={focusChapter}
      />
    </Box>
  )
}
