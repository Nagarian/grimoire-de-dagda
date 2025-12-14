import { Box, Loader } from '@chakra-ui/react'
import mermaid from 'mermaid'
import { useEffect, useRef, useState } from 'react'
import {
  MiniMap,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch'
import { Controls } from './Controls'

export type StoryDisplayerProps = {
  marmaidContent: string
}

export function StoryDisplayer({ marmaidContent }: StoryDisplayerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showMinimap, setShowMinimap] = useState<boolean>(true)
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [svgId, setSvgId] = useState<string>('#mermaid-diagram')

  useEffect(() => {
    if (!mermaidRef.current) return

    mermaidRef.current.removeAttribute('data-processed')

    setIsLoading(true)

    mermaid
      .run({
        nodes: [mermaidRef.current],
      })
      .then(() => {
        // Get the generated SVG and give it an ID if it doesn't have one
        const generatedSvg = mermaidRef.current?.querySelector('svg')
        if (generatedSvg && generatedSvg.id) {
          setSvgId(`#${generatedSvg.id}`)
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false)
      })
  }, [marmaidContent])

  return (
    <Box position="relative" width="100%" height="100%" overflow="hidden">
      {isLoading && (
        <Loader position="absolute" inset="0" padding="4" zIndex="10" />
      )}
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.5}
        maxScale={10}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
      >
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <div ref={mermaidRef} >
            {marmaidContent}
          </div>
        </TransformComponent>
        {showMinimap && (
          <Box
            position="absolute"
            bottom="4"
            right="4"
            zIndex="popover"
            borderRadius="sm"
            borderWidth="medium"
            borderColor="border.emphasized"
            shadow="md"
            cursor="crosshair"
            bg="bg.panel"
          >
            <MiniMap>
              <svg width="100%" height="100%">
                <use href={svgId} />
              </svg>
            </MiniMap>
          </Box>
        )}
        <Controls
          position="absolute"
          top="4"
          right="4"
          zIndex="20"
          mapRef={mermaidRef}
          showMinimap={showMinimap}
          onMinimapToggle={() => {
            setShowMinimap(!showMinimap)
          }}
        />
      </TransformWrapper>
    </Box>
  )
}
